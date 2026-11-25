const MAX_REDIRECT_LENGTH = 2048;
const MAX_STRING_LENGTH = 10_000;
const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROL_CHARS = /[\x00-\x1f\x7f]/;

/**
 * Single decode pass, tolerant of malformed escapes. One pass is deliberate:
 * it is what a browser does to a `Location` value, so it is the right depth
 * for deciding whether a redirect leaves the origin. Deeper encodings
 * (`%252e%252e`) survive as literal path text, which stays same-origin — if a
 * downstream consumer double-decodes a path, that decode is where the check
 * belongs.
 */
function decodeOnce(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // Malformed escape sequence — keep the raw value and let callers' checks run.
    return value;
  }
}

/**
 * Backslashes (raw or encoded) and C0/DEL control characters are both routes
 * to an off-origin redirect that a plain `//` check misses: a browser
 * normalizes a leading `/\` to `//`, and WHATWG URL parsing strips `\t \n \r`
 * so `/\t/evil.com` becomes `//evil.com`.
 */
function hasOriginEscapeChars(raw: string, decoded: string): boolean {
  return (
    raw.includes('\\') ||
    decoded.includes('\\') ||
    CONTROL_CHARS.test(raw) ||
    CONTROL_CHARS.test(decoded)
  );
}

/**
 * Traversal check by path segment, on the decoded path only (query and hash
 * excluded). Segment-aware so `/a/../b` and `/a/%2e%2e/b` are rejected while
 * `/file..name`, `/reports/q1..q2` and a `..` inside a query value are kept.
 */
function hasTraversalSegment(decoded: string): boolean {
  const pathOnly = decoded.split('?')[0].split('#')[0];
  return pathOnly.split('/').some((segment) => segment === '..');
}

/**
 * Resolves the login path relative to a base URL.
 * Falls back to "/login" if the base URL is invalid.
 */
export function getLoginPath(baseUrl: string, path = '/login'): string {
  try {
    return new URL(path, baseUrl).pathname;
  } catch {
    return '/login';
  }
}

/**
 * Strips a trailing `/api/auth` (and any trailing slashes) from a base URL.
 *
 * NextAuth v4 requires `NEXTAUTH_URL` to point at the auth API root, not the
 * app root, when the app uses a `basePath` — e.g.
 * `https://host/apps/template/api/auth`. Use this on `NEXTAUTH_URL` (or any
 * URL that may carry the suffix) to get back to the app base before building a
 * user-facing redirect.
 *
 * NOTE: this is NOT what next-auth hands the `redirect` callback. Its
 * `baseUrl` argument is `url.origin` — protocol + host only, the basePath
 * already gone — so the basePath must be re-derived from `NEXTAUTH_URL` /
 * `NEXT_PUBLIC_BASE_PATH`, not read from `baseUrl`.
 */
export function stripAuthApiSuffix(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '').replace(/\/api\/auth$/, '');
}

/**
 * Removes a leading `basePath` from a path, matching on a SEGMENT boundary.
 *
 * `basePath` must be normalised (leading `/`, no trailing `/`, or `''`).
 * Returns the remainder, always starting with `/` (`/apps/core` → `/`,
 * `/apps/core?a=1` → `/?a=1`), or `null` when `path` is not under `basePath`
 * — so `/apps/core-other` is NOT under `/apps/core`. An empty `basePath`
 * returns `path` unchanged.
 *
 * Applied once, deliberately: callers use it to make a prefixed and an
 * unprefixed path converge before re-prefixing, not to unwrap nesting.
 */
export function stripBasePath(path: string, basePath: string): string | null {
  if (!basePath) return path;
  if (path === basePath) return '/';
  if (!path.startsWith(basePath)) return null;
  const next = path.charAt(basePath.length);
  if (next === '/') return path.slice(basePath.length);
  if (next === '?' || next === '#') return `/${path.slice(basePath.length)}`;
  return null;
}

/**
 * Sanitizes a redirect/callback URL to prevent open redirect attacks.
 * Allows only relative paths (/) or same-origin absolute URLs.
 */
export function sanitizeRedirectUrl(
  url: string | null | undefined,
  baseOrigin?: string,
  fallback = '/',
): string {
  if (typeof url !== 'string') return fallback;

  const trimmed = url.trim();
  // Empty input needs no check of its own: it is neither relative nor a parseable URL.
  if (trimmed.length > MAX_REDIRECT_LENGTH) return fallback;
  if (DANGEROUS_PROTOCOLS.test(trimmed)) return fallback;

  const decoded = decodeOnce(trimmed);
  if (hasOriginEscapeChars(trimmed, decoded)) return fallback;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    if (hasTraversalSegment(decoded)) return fallback;
    return trimmed;
  }

  // Stryker disable next-line ConditionalExpression: equivalent — new URL(undefined) throws, which also ends at the fallback.
  if (baseOrigin) {
    try {
      const parsed = new URL(trimmed);
      const base = new URL(baseOrigin);
      if (
        parsed.origin === base.origin &&
        parsed.protocol === base.protocol &&
        parsed.hostname === base.hostname
      ) {
        // Keep the fragment: the relative branch above returns the input
        // verbatim (fragment included), so dropping it here made the same
        // destination survive or lose its anchor depending on whether the
        // caller happened to pass it absolute — which silently broke
        // deep-links in menu entries resolved through this helper.
        return parsed.pathname + parsed.search + parsed.hash;
      }
    } catch {
      // Not a parseable URL: fall through to the fallback below.
    }
  }

  return fallback;
}

/**
 * Sanitizes a path for redirects. Allows only same-origin relative paths.
 *
 * Applies the same guards as {@link sanitizeRedirectUrl} for the relative-path
 * case: a leading `//` (protocol-relative, off-origin), backslash and
 * control-character bypasses, and segment-wise `..` traversal. The traversal
 * check is deliberately segment-aware rather than a bare `includes('..')`, so
 * a legitimate path such as `/reports/q1..q2` is no longer rejected.
 */
export function sanitizePath(path: string | null | undefined, fallback = '/'): string {
  if (typeof path !== 'string') return fallback;
  const trimmed = path.trim();
  // Empty input is rejected by the leading-slash check below.
  if (trimmed.length > MAX_REDIRECT_LENGTH) return fallback;
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;

  const decoded = decodeOnce(trimmed);
  if (hasOriginEscapeChars(trimmed, decoded)) return fallback;
  if (hasTraversalSegment(decoded)) return fallback;

  return trimmed;
}

/**
 * Sanitizes a string: trims, limits length, removes control characters.
 */
export function sanitizeString(
  value: string | null | undefined,
  maxLength = MAX_STRING_LENGTH,
): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  const withoutControlChars = [...trimmed]
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');
  return withoutControlChars.slice(0, maxLength);
}

/**
 * Escapes HTML special characters to prevent XSS when rendering user content.
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates and normalizes a `callbackUrl` query value.
 *
 * Rules:
 * - Must be a non-empty string starting with `/` (no protocol-relative URLs, no
 *   absolute URLs to other origins — would otherwise enable open-redirect).
 * - The basePath prefix is stripped for path comparison so `/login` and
 *   `/<basePath>/login` are treated the same.
 * - Anything pointing back to `/login` or `/logout` (the auth chrome itself)
 *   is rejected — those targets cause the post-auth redirect to land back on
 *   the login screen and accumulate a nested `callbackUrl` chain.
 *
 * @returns the original value when safe, otherwise `undefined` so callers can
 * fall back to `/`.
 */
export function sanitizeCallbackUrl(
  raw: unknown,
  // Stryker disable next-line StringLiteral: equivalent — no path that starts with `/` can start with a non-`/` basePath.
  basePath: string = process.env.NEXT_PUBLIC_BASE_PATH ?? '',
): string | undefined {
  // Empty input is rejected by the leading-slash check below.
  if (typeof raw !== 'string') return undefined;

  // Decode once and re-validate so percent-encoded tricks can't smuggle a
  // protocol-relative target or backslash past the checks below
  // (e.g. `/%2F%2Fevil.com`, `/%5Cevil.com`).
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return undefined; // malformed percent-encoding
  }
  // Reject backslashes outright — some browsers/proxies normalize `\` to `/`,
  // turning `/\evil.com` or `/\/evil.com` into a protocol-relative redirect.
  // Decoding never removes a raw `\`, so this one check covers both forms.
  if (decoded.includes('\\')) return undefined;

  // Only same-origin relative URLs — enforced on both the raw and decoded
  // forms. Rejects `//evil.com`, `http://…`, `%2Fx`, etc. A raw leading `/`
  // survives decoding, so the decoded form only needs the `//` check.
  if (!raw.startsWith('/') || raw.startsWith('//')) return undefined;
  if (decoded.startsWith('//')) return undefined;

  // Normalize by stripping the configured basePath — repeatedly — so neither
  // `/<basePath>/login` nor a double-prefixed `/<basePath>/<basePath>/login`
  // can slip an auth-chrome target past the loop guard below.
  let normalized = decoded;
  if (basePath) {
    while (normalized === basePath || normalized.startsWith(`${basePath}/`)) {
      // Stryker disable next-line StringLiteral: equivalent — '' and '/' both pass the auth chrome check.
      normalized = normalized.slice(basePath.length) || '/';
    }
  }

  const pathOnly = normalized.split('?')[0].split('#')[0];
  if (pathOnly === '/login' || pathOnly.startsWith('/login/')) return undefined;
  if (pathOnly === '/logout' || pathOnly.startsWith('/logout/')) return undefined;

  return raw;
}
