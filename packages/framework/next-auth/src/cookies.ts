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
 * can never appear in a slug, which is `[a-z0-9-]` only. Closing the suffix with
 * it makes the suffix set prefix-free: `.apps-hr~` is not a prefix of
 * `.apps-hr-admin~`, while `.apps-hr~.0` still chunks cleanly.
 */
const SUFFIX_TERMINATOR = '~';

/**
 * Turns a basePath into a cookie-name-safe suffix: `/apps/template` →
 * `.apps-template~`. Returns `''` for an empty or root basePath, which is what
 * keeps single-app deployments on the stock NextAuth names.
 *
 * The trailing {@link SUFFIX_TERMINATOR} is load-bearing, not decoration — see
 * its doc comment.
 */
export function basePathCookieSuffix(basePath: string | undefined): string {
  const trimmed = (basePath ?? '').trim();
  if (!trimmed || trimmed === '/') return '';
  const slug = trimmed
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return slug ? `.${slug}${SUFFIX_TERMINATOR}` : '';
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
