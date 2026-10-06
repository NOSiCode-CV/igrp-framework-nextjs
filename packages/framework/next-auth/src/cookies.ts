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

/** `/apps/My_App/` → `apps-my-app`; empty for a root or absent basePath. */
function basePathSlug(basePath: string | undefined): string {
  return (basePath ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/**
 * Turns a basePath into a cookie-name-safe suffix: `/apps/template` →
 * `.apps-template~`.
 *
 * An empty or root basePath gets the bare terminator, `~`, rather than no
 * suffix. The stock `next-auth.session-token` is a PREFIX of every scoped
 * name, so a root-path app sharing a host with basePath apps — one without
 * `NEXT_PUBLIC_BASE_PATH` next to `/apps/a` and `/apps/b` — collected all of
 * their cookies as its own chunks, failed with "Invalid Compact JWE", and then
 * expired every one of them: NextAuth's session route calls
 * `SessionStore#clean()` on a decode error. `next-auth.session-token~` is
 * neither a prefix of `next-auth.session-token.apps-a~` nor prefixed by it.
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
  if (!trimmed || trimmed === '/') return SUFFIX_TERMINATOR;
  const canonical = trimmed.replace(/^\/+|\/+$/g, '');
  const slug = basePathSlug(basePath);
  if (!slug) return SUFFIX_TERMINATOR;
  // Hash the ORIGINAL basePath, not the slug — the slug is exactly the lossy
  // value we are disambiguating, so hashing it would collide identically.
  const disambiguator = isLosslessSlug(canonical)
    ? ''
    : `${HASH_SEPARATOR}${shortHash(canonical)}`;
  return `.${slug}${disambiguator}${SUFFIX_TERMINATOR}`;
}

/**
 * Cookie `Path` for an app's auth cookies: its basePath (`/apps/template`), or
 * `/` for a root-path app.
 *
 * ## Why the path is scoped, not just the name
 *
 * Scoping only the NAME keeps apps from overwriting each other, but at
 * `Path=/` the browser still sends every co-hosted app's session cookie on
 * every request to the host — to every other app, and to the IdP when it is
 * served from the same host (`/auth/...`). A session cookie holding an access
 * token, id_token and refresh token is routinely 2–4 KB, chunked above that, so
 * a handful of apps tips the request over the proxy's header ceiling (nginx
 * `large_client_header_buffers`, 8 KB by default). The visible symptom is the
 * RP-initiated logout: the IdP's end-session GET carries the id_token in its
 * URL on top of that Cookie header, and fails with `431` or, over HTTP/2,
 * `ERR_HTTP2_PROTOCOL_ERROR`.
 *
 * At `Path=<basePath>` each app's cookies reach only that app's own routes —
 * including `<basePath>/api/auth/*`, where NextAuth reads and writes them.
 * RFC 6265 path-matching requires a `/` (or the end) after the prefix, so
 * `/apps/hr` never matches `/apps/hr-admin`.
 *
 * Must equal Next's `basePath` exactly (it is case-sensitive), which is why it
 * is derived from the same `NEXT_PUBLIC_BASE_PATH` and only normalised for
 * stray slashes.
 */
export function basePathCookiePath(basePath: string | undefined): string {
  const canonical = (basePath ?? '').trim().replace(/^\/+|\/+$/g, '');
  return canonical ? `/${canonical}` : '/';
}

/**
 * Marker that path-scoped cookie names carry before the terminator:
 * `.apps-template~` → `.apps-template_p~`.
 *
 * WHY a rename at all: without one, an existing user's browser would hold two
 * cookies with the SAME name — the old one at `Path=/` and the new one at
 * `Path=<basePath>`. Both are sent, the request-cookie parser keeps only one of
 * them per name (the `Path=/` copy, which comes last), and for a chunked token
 * NextAuth could even reassemble `.0` from one copy with `.1` from the other.
 * A distinct name makes the two generations invisible to each other; the old
 * one is then expired by {@link staleAuthCookies}.
 *
 * `_` can occur neither in a slug (`[a-z0-9-]`) nor in the hash tail
 * (`.` + hex), so the marker cannot collide with any other app's name, old or
 * new, and the set stays prefix-free: every name still ends in the single
 * {@link SUFFIX_TERMINATOR}. A replica still on the previous version reads by
 * the prefix `.apps-template~`, which `.apps-template_p~` does not start with,
 * so a rolling deploy cannot glue the two generations together either.
 *
 * Root-path apps are left as they are: their path stays `/`, so there is
 * nothing to separate and no reason to sign their users out.
 */
const PATH_SCOPE_MARKER = '_p';

/** Name suffix for the path-scoped auth cookies of `basePath`. */
export function authCookieSuffix(basePath: string | undefined): string {
  const suffix = basePathCookieSuffix(basePath);
  if (basePathCookiePath(basePath) === '/') return suffix;
  return `${suffix.slice(0, -SUFFIX_TERMINATOR.length)}${PATH_SCOPE_MARKER}${SUFFIX_TERMINATOR}`;
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
  return `${prefix}${SESSION_COOKIE_BASENAME}${authCookieSuffix(basePath)}`;
}

/**
 * Full NextAuth `cookies` config with every cookie name scoped to `basePath`.
 *
 * A root-path app is scoped too (names end in a bare `~`, see
 * {@link basePathCookieSuffix}): it cannot know whether basePath apps share its
 * host, and when they do, the stock names are what breaks all of them.
 *
 * All six cookies are scoped, not just the session token: two apps sharing one
 * `next-auth.csrf-token` fail each other's sign-in POSTs with a CSRF mismatch,
 * and a shared `next-auth.pkce.code_verifier` breaks concurrent logins.
 *
 * Every cookie except CSRF is also confined to the app's path
 * ({@link basePathCookiePath}) and carries the path-scope marker
 * ({@link authCookieSuffix}). CSRF stays at `Path=/` under its previous name:
 * `__Host-` (as upstream uses it) mandates `path: "/"` and no `Domain`, and the
 * cookie is a few dozen bytes, so it is not what fills the header.
 *
 * Other options mirror NextAuth v4's own defaults so nothing else about cookie
 * behaviour changes.
 */
export function buildAuthCookies(
  basePath: string | undefined,
  secure: boolean,
): AuthCookieSet {
  const suffix = authCookieSuffix(basePath);
  const csrfSuffix = basePathCookieSuffix(basePath);
  const securePrefix = secure ? SECURE_COOKIE_PREFIX : '';
  const hostPrefix = secure ? HOST_COOKIE_PREFIX : '';
  const scoped = {
    httpOnly: true,
    sameSite: 'lax',
    path: basePathCookiePath(basePath),
    secure,
  } as const;
  const root = { httpOnly: true, sameSite: 'lax', path: '/', secure } as const;

  return {
    sessionToken: {
      name: `${securePrefix}next-auth.session-token${suffix}`,
      options: { ...scoped },
    },
    callbackUrl: {
      name: `${securePrefix}next-auth.callback-url${suffix}`,
      options: { ...scoped },
    },
    csrfToken: {
      name: `${hostPrefix}next-auth.csrf-token${csrfSuffix}`,
      options: { ...root },
    },
    pkceCodeVerifier: {
      name: `${securePrefix}next-auth.pkce.code_verifier${suffix}`,
      options: { ...scoped, maxAge: 900 },
    },
    state: {
      name: `${securePrefix}next-auth.state${suffix}`,
      options: { ...scoped, maxAge: 900 },
    },
    nonce: {
      name: `${securePrefix}next-auth.nonce${suffix}`,
      options: { ...scoped },
    },
  };
}

/**
 * Cookie basenames that {@link buildAuthCookies} confines to the app's path.
 * CSRF is absent on purpose: it keeps its name and `Path=/`.
 */
const PATH_SCOPED_BASENAMES = [
  SESSION_COOKIE_BASENAME,
  'next-auth.callback-url',
  'next-auth.pkce.code_verifier',
  'next-auth.state',
  'next-auth.nonce',
] as const;

/** One `Set-Cookie` that expires a stale auth cookie. */
export type StaleAuthCookie = {
  name: string;
  options: {
    path: '/';
    maxAge: 0;
    httpOnly: true;
    sameSite: 'lax';
    /** Required to overwrite a `__Secure-` cookie, which the browser rejects otherwise. */
    secure: boolean;
  };
};

/**
 * Previous-generation auth cookies of THIS app that are present on the request
 * and should be expired, with the `Set-Cookie` options that expire them.
 *
 * Covers the names this app wrote at `Path=/` before its cookies were scoped
 * to its path: the terminated form (`.apps-template~`) and the pre-terminator
 * form (`.apps-template`), each with NextAuth's `.N` chunks and with or without
 * the `__Secure-` prefix. Nothing reads them any more, but the browser keeps
 * sending them to every path on the host until they expire (30 days by
 * default) — exactly the header weight path scoping exists to remove.
 *
 * Only names derived from `basePath` are returned, so a sweep can never touch
 * another app's cookies, whatever version that app runs. A root-path app
 * returns nothing: its cookies keep their name and `Path=/`.
 *
 * Pure, like the rest of this module: the caller owns the response. In the
 * template's middleware:
 *
 * ```ts
 * for (const { name, options } of staleAuthCookies(basePath, request.cookies.getAll().map((c) => c.name))) {
 *   response.cookies.set(name, '', options);
 * }
 * ```
 *
 * Known gap: a lossy basePath (one that carries a hash, see
 * {@link isLosslessSlug}) also wrote names WITHOUT the hash — terminated,
 * between the terminator and hash fixes, and unterminated before that. Those
 * are the same names a lossless sibling (`/apps/a/b` for `/apps/a-b`) may still
 * be using, so they are deliberately not swept; they expire on their own.
 */
export function staleAuthCookies(
  basePath: string | undefined,
  presentCookieNames: Iterable<string>,
): StaleAuthCookie[] {
  if (basePathCookiePath(basePath) === '/') return [];

  const slug = basePathSlug(basePath);
  const canonical = basePathCookiePath(basePath).slice(1);
  const legacySuffixes = [basePathCookieSuffix(basePath)];
  // The pre-terminator name had no hash, so for a lossy basePath it is shared
  // with its lossless sibling — same reasoning as the known gap above.
  if (slug && isLosslessSlug(canonical)) legacySuffixes.push(`.${slug}`);

  const legacyNames = new Set<string>();
  for (const prefix of ['', SECURE_COOKIE_PREFIX]) {
    for (const basename of PATH_SCOPED_BASENAMES) {
      for (const suffix of legacySuffixes) legacyNames.add(`${prefix}${basename}${suffix}`);
    }
  }

  const stale: StaleAuthCookie[] = [];
  for (const name of presentCookieNames) {
    const chunk = /^(.*)\.\d+$/.exec(name);
    if (!legacyNames.has(name) && !(chunk && legacyNames.has(chunk[1]))) continue;
    stale.push({
      name,
      options: {
        path: '/',
        maxAge: 0,
        httpOnly: true,
        sameSite: 'lax',
        secure: name.startsWith(SECURE_COOKIE_PREFIX),
      },
    });
  }
  return stale;
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
