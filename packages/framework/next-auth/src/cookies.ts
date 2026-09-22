/**
 * Auth cookie naming.
 *
 * Pure and dependency-free (no `next-auth` import) so it is safe in Edge, Node
 * and the browser, and so `@igrp/framework-next` can share it rather than keep
 * a hand-synced copy.
 *
 * ## Why names are scoped by basePath
 *
 * NextAuth v4 names its cookies from a fixed basename at `path: "/"`. Two IGRP
 * apps deployed on the SAME host under different basePaths — `/apps/a` and
 * `/apps/b`, which is the shape `NEXT_PUBLIC_BASE_PATH` exists for — therefore
 * write the same cookie name, at the same path, on the same host. Signing into
 * one overwrites the other: with a shared `NEXTAUTH_SECRET` the second app
 * silently decodes the first app's token (wrong audience, wrong roles); with
 * different secrets it fails to decode and loops to /login.
 *
 * Appending a basePath-derived suffix isolates them. The suffix goes at the
 * END so that:
 *   - a `__Secure-` / `__Host-` prefix stays first, as the browser requires;
 *   - `startsWith(basename)` detection (see {@link resolveSecureCookie}) keeps
 *     working unchanged;
 *   - NextAuth's own chunk suffixes (`.0`, `.1`) still append cleanly.
 */

export const SECURE_COOKIE_PREFIX = '__Secure-';
export const HOST_COOKIE_PREFIX = '__Host-';

export const SESSION_COOKIE_BASENAME = 'next-auth.session-token';
export const SECURE_SESSION_COOKIE_BASENAME = `${SECURE_COOKIE_PREFIX}${SESSION_COOKIE_BASENAME}`;

/**
 * Resolve `getToken`'s `secureCookie` flag from the cookie names actually
 * present on the request, instead of letting it infer the flag from
 * `NEXTAUTH_URL`.
 *
 * `getToken` (next-auth/jwt) derives the session-cookie name purely from
 * `process.env.NEXTAUTH_URL.startsWith('https://')`. But the cookie is WRITTEN
 * by NextAuth's request handler, which decides the `__Secure-` prefix from the
 * *request* origin — e.g. `x-forwarded-proto: https` behind a TLS-terminating
 * proxy. With `NEXTAUTH_URL` left `http`/unset at the Node runtime, the handler
 * stores `__Secure-next-auth.session-token` while `getToken` looks for the bare
 * name, and returns `null` for a perfectly valid session.
 *
 * Reading the prefix off the real cookie keeps both sides in agreement.
 * Returns `undefined` when no session cookie is present, so `getToken` keeps
 * its own default.
 */
export function resolveSecureCookie(cookieNames: Iterable<string>): boolean | undefined {
  let hasPlain = false;
  for (const name of cookieNames) {
    if (name.startsWith(SECURE_SESSION_COOKIE_BASENAME)) return true;
    if (name.startsWith(SESSION_COOKIE_BASENAME)) hasPlain = true;
  }
  return hasPlain ? false : undefined;
}

/**
 * Terminator character closing every basePath suffix.
 *
 * WHY: NextAuth reads the session cookie through `SessionStore`, which collects
 * every cookie whose name `startsWith` the configured one — that is how it
 * reassembles the `.0` / `.1` chunks of an oversized token. An un-terminated
 * suffix therefore makes any app whose slug is a PREFIX of another app's slug
 * swallow that other app's cookie: `/apps/hr` reads
 * `next-auth.session-token.apps-hr` AND `next-auth.session-token.apps-hr-admin`,
 * concatenates the two values, fails to decrypt the result, and sees no session
 * at all — a permanent redirect loop to /login with a perfectly valid cookie in
 * the jar. Worse, `SessionStore#clean()` then expires every name it collected,
 * so signing in or out of `/apps/hr` DELETES `/apps/hr-admin`'s session. That is
 * the exact cross-app interference this module exists to prevent.
 *
 * `~` is a valid cookie-name token character (RFC 6265 → RFC 7230 `token`) and
 * can never appear in a slug, which is `[a-z0-9-]` plus an optional
 * `.<hash>` tail. Closing the suffix with it makes the suffix set prefix-free:
 * `.apps-hr~` is not a prefix of `.apps-hr-admin~` nor of `.apps-hr.1f2c3d04~`,
 * while `.apps-hr~.0` still chunks cleanly.
 *
 * Prefix-free is NOT the same as injective, and the terminator only buys the
 * former — see {@link isLosslessSlug} for the collision half of the problem.
 */
const SUFFIX_TERMINATOR = '~';

/**
 * Separator between the slug and its disambiguating hash.
 *
 * Must be a character the slug itself can never contain, or the two classes of
 * suffix could still collide: `/apps/a/b/1f2c3d` slugs to `apps-a-b-1f2c3d`,
 * which is exactly what `-` as a separator would produce for a hashed
 * `/apps/a-b`. `.` cannot survive slugging (it is folded into `-` like every
 * other non-alphanumeric), so it partitions the two classes cleanly. It is also
 * already how NextAuth spells its own cookie names (`next-auth.session-token`).
 */
const HASH_SEPARATOR = '.';

/**
 * 32-bit FNV-1a, as 8 lowercase hex characters.
 *
 * Deliberately NOT a cryptographic hash: this disambiguates a handful of
 * co-hosted basePaths, it does not authenticate anything, and the value is
 * visible in a cookie name either way. Web Crypto's `digest()` is async and
 * this must stay synchronous and dependency-free to keep working in Edge, Node
 * and the browser alike.
 */
function shortHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    // `Math.imul` keeps the multiply in 32-bit space; `>>> 0` forces unsigned.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * True when `slug` uniquely determines the basePath it came from, so no
 * disambiguating hash is needed.
 *
 * The slug transform folds EVERY non-alphanumeric run to `-` and lowercases, so
 * it is many-to-one: `/apps/a/b` and `/apps/a-b` both produce `apps-a-b`, as do
 * `/apps/hr_admin`, `/apps/hr.admin` and `/apps/HR-ADMIN` for `apps-hr-admin`.
 * Two co-hosted apps that collide get precisely the cross-app interference this
 * module exists to prevent — the `~` terminator makes the suffix set
 * prefix-free, which is a different property from injective.
 *
 * The lossless class is the one where the only substitution performed was
 * `/` → `-`: the path is already lowercase, has no `-` of its own (or it would
 * be ambiguous with a `/`), and contains no other character that slugging would
 * rewrite. Within that class the mapping is reversible, hence collision-free.
 *
 * Checking rather than always hashing is deliberate. `/apps/template`,
 * `/apps/hr` and every other ordinary single-segment-per-level basePath is
 * lossless, so it keeps the cookie name it has today — an unconditional hash
 * would rename every deployment's auth cookies, signing every user out and
 * orphaning a second cookie in each jar (see KNOWN-ISSUES.md #1).
 */
function isLosslessSlug(canonical: string): boolean {
  return /^[a-z0-9]+(?:\/[a-z0-9]+)*$/.test(canonical);
}

/**
 * Turns a basePath into a cookie-name-safe suffix: `/apps/template` →
 * `.apps-template~`. Returns `''` for an empty or root basePath, which is what
 * keeps single-app deployments on the stock NextAuth names.
 *
 * A basePath whose slug is ambiguous (see {@link isLosslessSlug}) additionally
 * carries a short hash of the original path — `/apps/a-b` → `.apps-a-b.9f2b1c04~`
 * — so it can never share a cookie name with `/apps/a/b`.
 *
 * The trailing {@link SUFFIX_TERMINATOR} is load-bearing, not decoration — see
 * its doc comment.
 */
export function basePathCookieSuffix(basePath: string | undefined): string {
  const trimmed = (basePath ?? '').trim();
  if (!trimmed || trimmed === '/') return '';
  const canonical = trimmed.replace(/^\/+|\/+$/g, '');
  const slug = trimmed
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  if (!slug) return '';
  // Hash the ORIGINAL basePath, not the slug — the slug is exactly the lossy
  // value we are disambiguating, so hashing it would collide identically.
  const disambiguator = isLosslessSlug(canonical)
    ? ''
    : `${HASH_SEPARATOR}${shortHash(canonical)}`;
  return `.${slug}${disambiguator}${SUFFIX_TERMINATOR}`;
}

/** Shape of one NextAuth v4 cookie definition, restated to avoid importing `next-auth`. */
export type AuthCookieOption = {
  name: string;
  options: {
    httpOnly?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    path?: string;
    secure?: boolean;
    maxAge?: number;
    domain?: string;
  };
};

export type AuthCookieSet = {
  sessionToken: AuthCookieOption;
  callbackUrl: AuthCookieOption;
  csrfToken: AuthCookieOption;
  pkceCodeVerifier: AuthCookieOption;
  state: AuthCookieOption;
  nonce: AuthCookieOption;
};

/** The session-cookie name for a given basePath / scheme. */
export function sessionCookieName(basePath: string | undefined, secure: boolean): string {
  const prefix = secure ? SECURE_COOKIE_PREFIX : '';
  return `${prefix}${SESSION_COOKIE_BASENAME}${basePathCookieSuffix(basePath)}`;
}

/**
 * Full NextAuth `cookies` config with every cookie name scoped to `basePath`.
 *
 * Returns `undefined` when there is no basePath — the single-app case, where
 * the stock names are already unambiguous and overriding them would log
 * everyone out for nothing.
 *
 * All six cookies are scoped, not just the session token: two apps sharing one
 * `next-auth.csrf-token` fail each other's sign-in POSTs with a CSRF mismatch,
 * and a shared `next-auth.pkce.code_verifier` breaks concurrent logins.
 *
 * Options mirror NextAuth v4's own defaults so nothing else about cookie
 * behaviour changes. `__Host-` is deliberately kept for the CSRF cookie only
 * (as upstream does) — it mandates `path: "/"` and no `Domain`.
 */
export function buildAuthCookies(
  basePath: string | undefined,
  secure: boolean,
): AuthCookieSet | undefined {
  const suffix = basePathCookieSuffix(basePath);
  if (!suffix) return undefined;

  const securePrefix = secure ? SECURE_COOKIE_PREFIX : '';
  const hostPrefix = secure ? HOST_COOKIE_PREFIX : '';
  const base = { httpOnly: true, sameSite: 'lax', path: '/', secure } as const;

  return {
    sessionToken: {
      name: `${securePrefix}next-auth.session-token${suffix}`,
      options: { ...base },
    },
    callbackUrl: {
      name: `${securePrefix}next-auth.callback-url${suffix}`,
      options: { ...base },
    },
    csrfToken: {
      name: `${hostPrefix}next-auth.csrf-token${suffix}`,
      options: { ...base },
    },
    pkceCodeVerifier: {
      name: `${securePrefix}next-auth.pkce.code_verifier${suffix}`,
      options: { ...base, maxAge: 900 },
    },
    state: {
      name: `${securePrefix}next-auth.state${suffix}`,
      options: { ...base, maxAge: 900 },
    },
    nonce: {
      name: `${securePrefix}next-auth.nonce${suffix}`,
      options: { ...base },
    },
  };
}

/**
 * Mirrors how `next-auth` itself decides whether cookies are secure, so the
 * names we write and the names it writes can never disagree.
 *
 * v4's `detectOrigin()` (utils/detect-origin.js) resolves, in order:
 *   1. `NEXTAUTH_URL` — use its scheme.
 *   2. `VERCEL` or `AUTH_TRUST_HOST` — derive from the request's
 *      `x-forwarded-proto`, defaulting to **https**.
 *   3. neither — fall back to `http://localhost:3000`.
 *
 * Reading only `NEXTAUTH_URL` (as an earlier version of this did) gets case 2
 * wrong: behind a TLS-terminating proxy with `AUTH_TRUST_HOST` set and no
 * `NEXTAUTH_URL`, next-auth writes `__Secure-…` while we would name the cookie
 * unprefixed AND mark it `secure: false` — stripping the Secure flag from a
 * session cookie served over HTTPS.
 *
 * Case 2 cannot be resolved at construction time (there is no request yet), so
 * it assumes https, matching next-auth's own default. A deployment that really
 * terminates plain http behind a trusted proxy must set `NEXTAUTH_URL` — or
 * pass `secureCookies` explicitly.
 */
export function resolveSecureCookiesFlag(env: Record<string, string | undefined>): boolean {
  const nextAuthUrl = env.NEXTAUTH_URL ?? process.env.NEXTAUTH_URL;
  if (nextAuthUrl) return nextAuthUrl.startsWith('https://');
  const trustsHost =
    env.VERCEL ?? process.env.VERCEL ?? env.AUTH_TRUST_HOST ?? process.env.AUTH_TRUST_HOST;
  return Boolean(trustsHost);
}
