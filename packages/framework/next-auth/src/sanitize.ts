const MAX_REDIRECT_LENGTH = 2048;
const MAX_STRING_LENGTH = 10_000;
const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;
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
 * `https://host/apps/template/api/auth`. That same string is what NextAuth
 * hands the `redirect` callback as `baseUrl`, so concatenating an app path
 * onto it yields a NextAuth API URL instead of an app page. Use this to get
 * back to the app origin before building any user-facing redirect.
 */
export function stripAuthApiSuffix(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '').replace(/\/api\/auth$/, '');
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
  if (url == null || typeof url !== 'string') return fallback;

  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_REDIRECT_LENGTH) return fallback;
  if (DANGEROUS_PROTOCOLS.test(trimmed)) return fallback;

  const decoded = decodeOnce(trimmed);
  if (hasOriginEscapeChars(trimmed, decoded)) return fallback;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    if (hasTraversalSegment(decoded)) return fallback;
    return trimmed;
  }

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
      return fallback;
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
  if (path == null || typeof path !== 'string') return fallback;
  const trimmed = path.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_REDIRECT_LENGTH) return fallback;
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
  if (value == null || typeof value !== 'string') return '';
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
