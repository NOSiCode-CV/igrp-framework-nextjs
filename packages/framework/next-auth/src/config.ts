// ─────────────────────────────────────────────────────────────────────────────
// @igrp/framework-next-auth/config
//
// Edge-safety contract:
// The top of this file imports ONLY things that are safe in the Edge runtime
// (types, next-auth/jwt, pure local modules). The full `next-auth` package and
// `next/headers` are heavy Node-only dependencies — `next-auth` transitively
// requires `openid-client`, which uses `crypto` / `stream` / `events` and
// cannot execute in Edge. Pulling them into the top-level module graph drags
// them into any middleware bundle that imports `@igrp/framework-next-auth/config`,
// which is exactly what caused:
//
//   TypeError: Cannot read properties of undefined (reading 'custom')
//     at openid-client/lib/device_flow_handle.js (middleware.js)
//
// To keep the middleware bundle clean, every `next-auth` main package usage
// (handler construction, getServerSession) and every `next/headers` usage
// (cookies) lives inside a function body and uses `await import(...)`. Webpack
// then puts them in a lazy chunk the Edge bundle never reaches.
// ─────────────────────────────────────────────────────────────────────────────

import type { NextApiRequest } from 'next';
import { getToken } from 'next-auth/jwt';
import type { NextAuthOptions, Account } from 'next-auth';
import type { OAuthConfig } from 'next-auth/providers/oauth';

import { interopDefault } from './_interop';
import type { JWT } from './jwt';
import type { Session } from './session';
import {
  createAuthProviderFromEnv,
  getAuthProviderIdFromEnv,
  isAuthDisabled as isAuthDisabledFromEnv,
  type AuthProviderId,
} from './providers';
import {
  configureOidcTokenRecoveryStore,
  getRecoveredToken,
  introspectOidcToken,
  refreshOidcAccessToken,
  revokeOidcSession,
} from './oidc';
import type { IGRPTokenRecoveryStore } from './token-store';
import { escapeHtml, sanitizeRedirectUrl, stripAuthApiSuffix } from './sanitize';

// ─── Config Error ─────────────────────────────────────────────────────────────

/**
 * Thrown when `withIGRPAuth` cannot build a valid provider from the environment
 * (e.g. unsupported `AUTH_PROVIDER` value, missing required env vars).
 *
 * Unlike a construction-time throw, this error is stored inside the auth instance
 * and re-thrown lazily so the module can load cleanly. Next.js App Router error
 * boundaries (`error.tsx` / `global-error.tsx`) will catch it during render and
 * display a proper error page instead of a raw runtime overlay.
 */
export class IGRPAuthConfigError extends Error {
  override readonly name = 'IGRPAuthConfigError' as const;
  readonly code: string;

  constructor(message: string, code = 'AUTH_CONFIG_INVALID') {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, IGRPAuthConfigError.prototype);
  }
}

/** Structural guard — works across package boundaries and serialisation. */
export function isIGRPAuthConfigError(error: unknown): error is IGRPAuthConfigError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'IGRPAuthConfigError'
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

// How many milliseconds before the access-token's `exp` the JWT callback
// starts refreshing proactively. This is also the threshold used by
// getSession() to decide "session expired" on the server side.
//
// CONSTRAINT: the client-side session-poll interval (IGRP_SESSION_REFETCH_INTERVAL,
// in seconds) MUST be less than TOKEN_REFRESH_BUFFER_MS / 1000.
//
// If poll_interval_s >= TOKEN_REFRESH_BUFFER_MS / 1000, the last client poll
// before the buffer window opens will find the token still "valid" (more than
// TOKEN_REFRESH_BUFFER_MS remaining), so no client-side refresh fires. The window
// then opens, server renders inside it trigger the JWT callback and refresh
// correctly — but those refreshes run in read-only RSC context and cannot update
// the session cookie. The cookie is only updated by the NEXT client poll (after
// expiry), which triggers refresh there too. With rotating refresh tokens this
// is handled by the recovery store; without rotation it works via repeated
// refreshes. But if that client-side refresh fails for any reason, the dead
// zone leaves callers with an expired token.
//
// Recommended: set IGRP_SESSION_REFETCH_INTERVAL to at most
// (TOKEN_REFRESH_BUFFER_MS / 1000) - 15, i.e. ≤ 45 s for this default of 60 s.
const TOKEN_REFRESH_BUFFER_MS = 60_000;

// How long BEFORE actual access-token expiry middleware starts redirecting to
// /login. Deliberately much smaller than TOKEN_REFRESH_BUFFER_MS: the jwt
// callback begins refreshing proactively at `expiresAt - TOKEN_REFRESH_BUFFER_MS`
// (60s out), so middleware must stay lenient past that point to give the client
// session poll / focus-refetch a chance to rotate the cookie before a navigation
// is bounced to /login. This is just a small grace to cover in-flight request
// duration (the access token shouldn't die mid-render).
const TOKEN_EXPIRY_GRACE_MS = 10_000;

const DEFAULT_MATCHER = ['/', '/((?!apps|_next|favicon.ico|.*\\..*).*)', '/api/:path*'];

// ─── Types ────────────────────────────────────────────────────────────────────

type AnyProvider = OAuthConfig<Record<string, unknown>>;

/**
 * Signature of a NextAuth v4 App Router route handler. Typed with the Web
 * Fetch API shapes (`Request` / `Response`) so this module doesn't need to
 * statically import `next-auth` just to spell the return type.
 */
export type NextAuthHandler = (req: Request, ctx?: unknown) => Promise<Response>;

/**
 * User-supplied callback extensions that run AFTER IGRP defaults.
 * Each receives the already-processed value and may enrich or override fields.
 */
type IGRPAuthCallbackExtensions = {
  /**
   * Runs after the IGRP jwt callback has processed the token.
   * Return the token with any additional custom fields.
   */
  jwt?: (
    params: Parameters<NonNullable<NonNullable<NextAuthOptions['callbacks']>['jwt']>>[0],
    igrpToken: JWT,
  ) => Promise<JWT>;

  /**
   * Runs after the IGRP session callback has processed the session.
   * Return the session with any additional custom fields.
   */
  session?: (
    params: Parameters<NonNullable<NonNullable<NextAuthOptions['callbacks']>['session']>>[0],
    igrpSession: Session,
  ) => Promise<Session>;

  /**
   * Fully replaces the IGRP redirect callback when provided.
   */
  redirect?: NonNullable<NextAuthOptions['callbacks']>['redirect'];
};

type IGRPAuthMiddlewareOptions = {
  /**
   * Login page path used by getLoginRedirectUrl().
   * Defaults to "/login".
   */
  loginUrl?: string;
  /**
   * Custom matcher pattern for Next.js middleware config.
   * Overrides the IGRP default.
   */
  matcher?: string[];
};

export type IGRPAuthOptions = {
  /**
   * Provider selection:
   * - Omit or pass "igrp-auth" / "none" to use IGRP pre-defined providers (reads env vars automatically).
   * - Pass a fully-constructed next-auth Provider object for a custom provider.
   */
  provider?: AuthProviderId | AnyProvider;

  /**
   * Environment source. Defaults to process.env.
   * Override if you need to pass a custom env map (e.g. validated env object).
   */
  env?: Record<string, string | undefined>;

  /** NextAuth secret. Defaults to process.env.NEXTAUTH_SECRET. */
  secret?: string;

  /** NextAuth pages config (e.g. custom signIn page). */
  pages?: NextAuthOptions['pages'];

  /** NextAuth session config. */
  session?: NextAuthOptions['session'];

  /** Callback extensions that compose on top of IGRP defaults. */
  callbacks?: IGRPAuthCallbackExtensions;

  /** Middleware primitives configuration. */
  middleware?: IGRPAuthMiddlewareOptions;

  /**
   * Called by getSession() when the session token is expired or refresh failed.
   * Use this to redirect to /logout (or any other action) without the package
   * importing next/navigation directly.
   *
   * @example
   * import { redirect } from "next/navigation";
   * withIGRPAuth({ onSessionExpired: () => redirect("/logout") });
   */
  onSessionExpired?: () => void | never;

  /**
   * Shared store for rotated refresh-token recovery. Defaults to an in-memory,
   * per-process store — correct for single-instance or sticky-routed
   * deployments. Multi-replica deployments without sticky sessions should
   * supply an `IGRPTokenRecoveryStore` implementation backed by infrastructure
   * shared across replicas. Implementations must never let `get`/`set` block
   * auth — callers treat thrown errors as cache misses.
   *
   * @example
   * withIGRPAuth({ tokenRecoveryStore: mySharedStore });
   */
  tokenRecoveryStore?: IGRPTokenRecoveryStore;
};

export type IGRPAuthInstance = {
  /**
   * Non-null when the auth provider could not be configured (unsupported
   * `AUTH_PROVIDER` value, missing required env vars, etc.).
   *
   * When set:
   * - `GET` / `POST` return a 500 HTML diagnostic page.
   * - `serverSession` / `getSession` throw this error so App Router error
   *   boundaries can catch and render a proper error page.
   */
  configError: IGRPAuthConfigError | null;

  /** NextAuth options object — pass to NextAuth() if you need to customise further. */
  authOptions: NextAuthOptions;

  /**
   * Route handler for /api/auth/[...nextauth].
   * Re-export as GET and POST from your route file.
   *
   * @example
   * export const { GET, POST } = auth;
   */
  GET: NextAuthHandler;
  POST: NextAuthHandler;

  /**
   * Matcher config for the middleware.
   * Re-export from your middleware.ts.
   *
   * @example
   * export const { config } = auth;
   */
  config: { matcher: string[] };

  // ── Middleware primitives ──────────────────────────────────────────────────
  // The template owns the middleware function body and uses these helpers
  // to make all auth decisions. This keeps the middleware transparent and
  // extensible — callers can add logging, rate-limiting, custom headers, etc.

  /**
   * Returns true when auth is disabled via AUTH_PROVIDER=none.
   * Use as the first check in your middleware.
   */
  isAuthDisabled: () => boolean;

  /**
   * Returns true when IGRP_PREVIEW_MODE=true.
   * Preview mode bypasses auth entirely for local/demo usage.
   */
  isPreviewMode: () => boolean;

  /**
   * Extracts and decodes the JWT from an incoming Edge request.
   * Returns null when no valid session cookie is present.
   * Accepts `unknown` to avoid NextRequest version mismatches across packages.
   *
   * @example
   * const token = await auth.getTokenFromRequest(request);
   */
  getTokenFromRequest: (request: unknown) => Promise<JWT | null>;

  /**
   * Returns true when the token is expired or has a refresh error flag.
   * Use to decide whether to redirect to login.
   *
   * @example
   * if (!token || auth.isTokenExpiredOrFailed(token)) return loginRedirect();
   */
  isTokenExpiredOrFailed: (token: JWT) => boolean;

  /**
   * Builds the login redirect URL from NEXTAUTH_URL_INTERNAL (or the
   * request origin as fallback) combined with the configured loginUrl.
   * Accepts `{ url: string }` so it works with any NextRequest version.
   *
   * @example
   * return NextResponse.redirect(auth.getLoginRedirectUrl(request));
   */
  getLoginRedirectUrl: (request: { url: string }) => URL;

  // ── Server helpers (Node runtime only) ───────────────────────────────────

  /**
   * Gets the raw JWT from the cookie jar (server-side, Node runtime).
   * Useful for API routes that need the raw token.
   */
  getAccessToken: () => Promise<JWT | null>;

  /**
   * Gets the NextAuth session (server-side, Node runtime).
   */
  serverSession: () => Promise<Session | null>;

  /**
   * Gets the session for layout use. Calls onSessionExpired() when the token
   * is expired or refresh has failed.
   * Safe to call from server components and server actions.
   */
  getSession: () => Promise<Session | null>;
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function resolveProvider(
  provider: IGRPAuthOptions['provider'],
  env: Record<string, string | undefined>,
): AnyProvider | null {
  if (provider == null || typeof provider === 'string') {
    return createAuthProviderFromEnv(
      env,
      provider as AuthProviderId | undefined,
    ) as AnyProvider | null;
  }
  return provider;
}

function normalizePreviewMode(env: Record<string, string | undefined>): boolean {
  return (
    env.IGRP_PREVIEW_MODE?.trim()
      .replace(/^["']|["']$/g, '')
      .toLowerCase() === 'true'
  );
}

/**
 * The auth chrome itself (`/login`, `/logout`) is never a valid post-auth
 * destination — redirecting there after a successful sign-in bounces the user
 * straight back through the flow they just completed.
 */
const AUTH_CHROME_PATH = /^\/(login|logout)(\/|$|\?)/;

/**
 * `env` is the documented environment source for the whole factory, but
 * `NODE_ENV` is not something a caller normally puts in a validated env map —
 * fall back to the real process env rather than silently treating a custom map
 * as "production".
 */
function resolveNodeEnv(env: Record<string, string | undefined>): string | undefined {
  return env.NODE_ENV ?? process.env.NODE_ENV;
}

function isAuthChromePath(pathOrUrl: string): boolean {
  return AUTH_CHROME_PATH.test(pathOrUrl.split('?')[0] || '');
}

/**
 * Warns once, in development only, when the client session-poll interval is
 * too long for the proactive-refresh buffer to help.
 *
 * See the TOKEN_REFRESH_BUFFER_MS comment above: when the poll interval is at
 * or beyond the buffer, the last poll before the buffer window opens still
 * sees a "valid" token, so no persist-capable refresh fires; refreshes that do
 * run inside the window happen in read-only RSC context and cannot write the
 * cookie. The constraint was documented but never checked, which made the
 * resulting dead zone look like a random logout.
 */
let warnedRefetchInterval = false;
function warnOnRefetchIntervalMisconfiguration(env: Record<string, string | undefined>): void {
  if (warnedRefetchInterval) return;
  const raw = env.IGRP_SESSION_REFETCH_INTERVAL?.trim();
  if (!raw) return;
  const seconds = Number.parseInt(raw, 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return;

  const maxSeconds = TOKEN_REFRESH_BUFFER_MS / 1000;
  if (seconds < maxSeconds) return;

  warnedRefetchInterval = true;
  console.warn(
    `[withIGRPAuth] IGRP_SESSION_REFETCH_INTERVAL=${seconds}s is >= the proactive refresh ` +
      `buffer (${maxSeconds}s). The client session poll will never fire inside the refresh ` +
      'window, so refreshes only run in read-only RSC context and cannot persist the rotated ' +
      `cookie. Recommended: at most ${maxSeconds - 15}s.`,
  );
}

const SESSION_COOKIE_BASENAME = 'next-auth.session-token';
const SECURE_SESSION_COOKIE_BASENAME = `__Secure-${SESSION_COOKIE_BASENAME}`;

/**
 * Resolve `getToken`'s `secureCookie` flag from the cookie names actually
 * present on the request, instead of letting it infer the flag from
 * `NEXTAUTH_URL`.
 *
 * Why this is necessary:
 * `getToken` (next-auth/jwt) derives the session-cookie name purely from
 * `process.env.NEXTAUTH_URL.startsWith('https://')`. But the cookie is WRITTEN
 * by NextAuth's request handler, which decides the `__Secure-` prefix from the
 * *request* origin — e.g. `x-forwarded-proto: https` when `AUTH_TRUST_HOST`/
 * `VERCEL` is set, or a build-time-inlined `NEXTAUTH_URL` baked into the Edge
 * middleware bundle. Behind a TLS-terminating proxy with `NEXTAUTH_URL` left
 * `http`/unset at the Node runtime, the handler stores
 * `__Secure-next-auth.session-token` while `getToken` looks for the bare
 * `next-auth.session-token` — so it returns `null` for a perfectly valid
 * session. Login still works (it runs through the request-aware handler), but
 * `getAccessToken` silently fails, which is what breaks RP-initiated logout
 * (`[getLogoutUrl] no active token found`).
 *
 * Reading the prefix off the real cookie keeps both sides in agreement
 * regardless of how the scheme was detected. Returns `undefined` when no
 * session cookie is present so `getToken` keeps its own default.
 */
function resolveSecureCookie(cookieNames: Iterable<string>): boolean | undefined {
  let hasPlain = false;
  for (const name of cookieNames) {
    if (name.startsWith(SECURE_SESSION_COOKIE_BASENAME)) return true;
    if (name.startsWith(SESSION_COOKIE_BASENAME)) hasPlain = true;
  }
  return hasPlain ? false : undefined;
}

/**
 * Best-effort extraction of cookie names from an incoming request of unknown
 * shape (NextRequest in Edge). Used only to pick the session-cookie prefix;
 * any failure falls back to an empty list so `getToken` keeps its default.
 */
function extractCookieNames(request: unknown): string[] {
  const cookies = (request as { cookies?: unknown } | null | undefined)?.cookies;
  const getAll = (cookies as { getAll?: () => Array<{ name?: string }> } | undefined)?.getAll;
  if (typeof getAll !== 'function') return [];
  try {
    return getAll
      .call(cookies)
      .map((c) => c?.name ?? '')
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Lazily loads `next-auth` and returns a constructed handler.
 * Dynamic import so webpack doesn't pull `next-auth` (and transitively
 * `openid-client`) into any Edge bundle that imports `withIGRPAuth`.
 */
async function createNextAuthHandler(
  authOptions: NextAuthOptions,
  env: Record<string, string | undefined>,
): Promise<NextAuthHandler> {
  const NextAuthModule = await import('next-auth');
  const NextAuth = interopDefault(NextAuthModule as unknown as typeof NextAuthModule.default);
  return NextAuth({
    ...authOptions,
    debug: resolveNodeEnv(env) === 'development',
  }) as unknown as NextAuthHandler;
}

/** Stub handler used when AUTH_PROVIDER=none — avoids constructing NextAuth with empty providers. */
const disabledAuthHandler: NextAuthHandler = async () =>
  new Response('Authentication is disabled (AUTH_PROVIDER=none)', { status: 404 });

/** Stub handler used when auth configuration is invalid — returns a 500 with a diagnostic HTML page. */
function makeConfigErrorHandler(err: IGRPAuthConfigError): NextAuthHandler {
  const html = [
    '<!DOCTYPE html><html lang="en"><head>',
    '<meta charset="utf-8">',
    '<title>Auth Configuration Error</title>',
    '<style>',
    'body{font-family:system-ui,sans-serif;max-width:600px;margin:4rem auto;padding:0 1rem;color:#111}',
    'h1{color:#b91c1c;margin-bottom:.5rem}',
    'code{background:#f3f4f6;padding:.1em .4em;border-radius:.25em;font-size:.9em}',
    'p{line-height:1.6}',
    '</style>',
    '</head><body>',
    '<h1>Authentication Configuration Error</h1>',
    `<p><strong>Code:</strong> <code>${escapeHtml(err.code)}</code></p>`,
    `<p>${escapeHtml(err.message)}</p>`,
    '<p>Check your <code>AUTH_PROVIDER</code> environment variable and ensure all required env vars are set.</p>',
    '</body></html>',
  ].join('');
  return async () =>
    new Response(html, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a fully configured IGRP auth instance.
 *
 * The instance exposes:
 * - `GET` / `POST`  — route handler for /api/auth/[...nextauth]
 * - `config`        — matcher for middleware.ts
 * - Middleware primitives (`isAuthDisabled`, `isPreviewMode`, `getTokenFromRequest`,
 *   `isTokenExpiredOrFailed`, `getLoginRedirectUrl`) — your middleware.ts uses these
 *   to stay transparent and extensible
 * - Server helpers (`getAccessToken`, `serverSession`, `getSession`)
 *
 * @example — IGRP pre-defined provider (reads env vars automatically)
 * ```ts
 * // src/lib/auth.ts
 * import { withIGRPAuth } from "@igrp/framework-next-auth/config";
 * import { redirect } from "next/navigation";
 *
 * export const auth = withIGRPAuth({
 *   onSessionExpired: () => redirect("/logout"),
 * });
 * ```
 *
 * @example — Custom provider from zero
 * ```ts
 * import GitHubProvider from "next-auth/providers/github";
 *
 * export const auth = withIGRPAuth({
 *   provider: GitHubProvider({
 *     clientId: process.env.GITHUB_ID!,
 *     clientSecret: process.env.GITHUB_SECRET!,
 *   }),
 *   onSessionExpired: () => redirect("/logout"),
 * });
 * ```
 */
export function withIGRPAuth(options: IGRPAuthOptions = {}): IGRPAuthInstance {
  const {
    provider,
    env = process.env,
    pages,
    session: sessionConfig,
    callbacks: callbackExtensions = {},
    middleware: middlewareOptions = {},
    onSessionExpired,
    tokenRecoveryStore,
  } = options;

  // Resolved once, from the caller's `env` first: a caller that passes a
  // validated env map should not silently get half its config from
  // `process.env`. The process fallback stays so the common case
  // (`env` omitted, or a partial map) is unchanged.
  const secret = options.secret ?? env.NEXTAUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (tokenRecoveryStore) {
    configureOidcTokenRecoveryStore(tokenRecoveryStore);
  }

  const { loginUrl = '/login', matcher = DEFAULT_MATCHER } = middlewareOptions;

  // ── Provider resolution (non-throwing) ────────────────────────────────────
  // Errors here (unsupported AUTH_PROVIDER, missing env vars) used to throw
  // synchronously at module-evaluation time (withIGRPAuth is called at the top
  // level of src/lib/auth.ts). That crashed the module before React loaded, so
  // Next.js showed a raw runtime error overlay with no meaningful UI.
  //
  // We now capture the error and surface it lazily:
  // - GET / POST  →  500 HTML diagnostic page
  // - serverSession / getSession  →  throw so the nearest error.tsx boundary
  //   renders a proper "configuration error" page inside the app chrome.

  let resolvedProvider: AnyProvider | null = null;
  let configError: IGRPAuthConfigError | null = null;

  try {
    resolvedProvider = resolveProvider(provider, env);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = msg.includes('Unsupported AUTH_PROVIDER')
      ? 'AUTH_PROVIDER_INVALID'
      : 'AUTH_CONFIG_INVALID';
    configError = new IGRPAuthConfigError(msg, code);
  }

  const authIsDisabled = !configError && resolvedProvider === null;

  if (resolveNodeEnv(env) !== 'production') {
    warnOnRefetchIntervalMisconfiguration(env);
  }

  /**
   * Browser-reachable app origin, with NextAuth's `/api/auth` suffix removed.
   *
   * Prefers the `baseUrl` NextAuth passes (derived from NEXTAUTH_URL or the
   * request) and falls back to NEXTAUTH_URL directly. NEXTAUTH_URL_INTERNAL is
   * deliberately NOT consulted — it names a server-to-server origin.
   */
  function resolveAppBaseUrl(baseUrl?: string): string {
    return stripAuthApiSuffix(baseUrl || env.NEXTAUTH_URL || '');
  }

  /** Post-auth landing URL: app base + NEXT_PUBLIC_IGRP_APP_HOME_SLUG. */
  function buildHomeUrl(appBaseUrl: string): string {
    const rawSlug = env.NEXT_PUBLIC_IGRP_APP_HOME_SLUG?.trim() || '/';
    const withLeadingSlash = rawSlug.startsWith('/') ? rawSlug : `/${rawSlug}`;
    const safeSlug = sanitizeRedirectUrl(withLeadingSlash, appBaseUrl, '/');
    return `${appBaseUrl}${safeSlug === '/' ? '/' : safeSlug}`;
  }

  // ── authOptions ────────────────────────────────────────────────────────────
  // Built synchronously. The options *object* has no Node-only deps; it only
  // becomes Node-only when passed to NextAuth() below, which we defer.

  const authOptions: NextAuthOptions = {
    // Do NOT set useSecureCookies explicitly. NextAuth defaults to
    // `NEXTAUTH_URL.startsWith('https://')`, which is exactly the same
    // signal that `getToken` (next-auth/jwt) uses to derive the cookie name.
    // Overriding it with `NODE_ENV === 'production'` diverges from that:
    // a production build on HTTP (e.g. `next start` on localhost) would have
    // NextAuth write `__Secure-next-auth.session-token` while the middleware's
    // `getToken` reads `next-auth.session-token` → the cookie is never found
    // → infinite redirect to /login. Let both sides default from NEXTAUTH_URL
    // so they are always consistent.
    providers: resolvedProvider ? [resolvedProvider] : [],
    secret,
    ...(pages ? { pages } : {}),
    ...(sessionConfig ? { session: sessionConfig } : {}),

    callbacks: {
      async jwt(params) {
        const { token, account } = params;
        let igrpToken = token as JWT;

        // Initial sign-in: map account fields onto the JWT
        if (account) {
          const accountTyped = account as Account & { expires_at?: number };
          igrpToken = {
            ...igrpToken,
            authProviderId: getAuthProviderIdFromEnv(env) as JWT['authProviderId'],
            accessToken: accountTyped.access_token,
            idToken: accountTyped.id_token,
            expiresAt: accountTyped.expires_at
              ? accountTyped.expires_at * 1000
              : Date.now() + 3600 * 1000,
            refreshToken: accountTyped.refresh_token,
          };
        }

        // Token still valid — return as-is (with 60s proactive refresh buffer).
        // Clear any stale `error` / `forceLogout` carried over from an earlier
        // failed attempt: if `expiresAt` is comfortably in the future we are
        // NOT going to refresh on this call, so a leftover error flag would
        // stick to the cookie forever and trip the client-side session
        // watcher into looping the user to /logout even though the access
        // token is fine. This can happen when a successful refresh runs
        // inside a server component (where cookies() is read-only and the
        // rotated token can't be persisted) and the next route-handler poll
        // sees a stale-but-still-valid token.
        if (igrpToken.expiresAt && Date.now() < igrpToken.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
          if (igrpToken.error || igrpToken.forceLogout) {
            igrpToken = { ...igrpToken, error: undefined, forceLogout: false };
          }
          if (callbackExtensions.jwt) {
            return callbackExtensions.jwt(params, igrpToken);
          }
          return igrpToken;
        }

        // Access token expired (or within its refresh buffer).
        //
        // First, try to recover a rotated token from a recent refresh that
        // could not persist its cookie (e.g. a refresh that ran inside an RSC
        // render). This MUST run before introspection: after rotation the old
        // refresh token reads `active: false`, so introspecting here would
        // short-circuit a recoverable session straight to forceLogout.
        const recovered = await getRecoveredToken(igrpToken.refreshToken);
        if (recovered) {
          igrpToken = recovered;
        } else {
          // Introspect the refresh token to catch a server-side revocation
          // before we try to use it (fail-open: a flaky introspection must
          // never block refresh).
          const refreshTokenActive = await introspectOidcToken(igrpToken, env).catch(() => true);
          if (!refreshTokenActive) {
            console.error(
              '[next-auth] jwt: refresh token reported inactive by introspection endpoint — ' +
                'logging user out. Check: (1) token was not manually revoked, ' +
                '(2) IGRP_AUTH_CLIENT_ID / IGRP_AUTH_CLIENT_SECRET are correct for the introspection endpoint, ' +
                '(3) introspection_endpoint in the IdP discovery document is reachable.',
            );
            igrpToken = { ...igrpToken, error: 'RefreshAccessTokenError', forceLogout: true };
          } else {
            try {
              igrpToken = await refreshOidcAccessToken(igrpToken, env);
              if (igrpToken.error) {
                // refreshOidcAccessToken returns an error-flagged JWT on failure
                // rather than throwing. Surface it here so the cause is visible.
                console.error(
                  '[next-auth] jwt: token refresh returned error flag — user will be logged out. ' +
                    'Check: (1) IdP token endpoint is reachable, (2) refresh token has not expired, ' +
                    '(3) client credentials are correct, (4) token rotation — if the IdP rotates refresh ' +
                    'tokens and this is a multi-replica deployment without a shared tokenRecoveryStore, ' +
                    'a concurrent refresh on another pod may have consumed this refresh token.',
                  { error: igrpToken.error },
                );
              }
            } catch {
              console.error(
                '[next-auth] jwt: refreshOidcAccessToken threw unexpectedly — user will be logged out.',
              );
              igrpToken = { ...igrpToken, error: 'RefreshAccessTokenError', forceLogout: true };
            }
          }
        }

        if (callbackExtensions.jwt) {
          return callbackExtensions.jwt(params, igrpToken);
        }
        return igrpToken;
      },

      // SECURITY: copies accessToken + idToken onto the client session by design (the browser AM client needs accessToken); never log/serialize the session client-side. See the Session type JSDoc in session.ts.
      async session(params) {
        const { session, token } = params;
        const tokenTyped = token as JWT;
        let igrpSession = session as Session;

        if (tokenTyped) {
          igrpSession = {
            ...igrpSession,
            accessToken: tokenTyped.accessToken,
            idToken: tokenTyped.idToken,
            authProviderId: tokenTyped.authProviderId,
            error: tokenTyped.error,
            expiresAt: tokenTyped.expiresAt,
            forceLogout: tokenTyped.forceLogout,
          };

          // `Session['user'].id` is part of this package's public type (and of
          // the `next-auth` module augmentation in ./types), but this callback
          // fully replaces NextAuth's default session callback — which is what
          // would otherwise be the only thing touching `session.user`. Without
          // this, `user.id` was declared and permanently `undefined`. NextAuth
          // puts the provider's subject in `token.sub`; `token.user.id` wins
          // when a `callbacks.jwt` extension has set a more specific value.
          const tokenUserId = tokenTyped.user?.id ?? tokenTyped.sub;
          if (tokenUserId) {
            igrpSession = {
              ...igrpSession,
              user: { ...igrpSession.user, id: tokenUserId },
            };
          }
        }

        if (callbackExtensions.session) {
          return callbackExtensions.session(params, igrpSession);
        }
        return igrpSession;
      },

      async redirect(params) {
        if (callbackExtensions.redirect) {
          return callbackExtensions.redirect(params);
        }

        const { url, baseUrl } = params;

        // Resolve every destination against the *app* base URL, never
        // NEXTAUTH_URL_INTERNAL: that variable names a server-reachable origin
        // (container DNS / cluster service) and must never become a `Location`
        // header — in the only deployments that set it, it is by definition not
        // reachable from the browser. `baseUrl` is NextAuth's own value derived
        // from NEXTAUTH_URL / the request, which is what the browser used.
        const appBaseUrl = resolveAppBaseUrl(baseUrl);
        const home = buildHomeUrl(appBaseUrl);

        // No useful callbackUrl — land on home. Compare against both the raw
        // baseUrl (which may still carry /api/auth) and the stripped app base.
        if (
          !url ||
          url === baseUrl ||
          url === `${baseUrl}/` ||
          url === appBaseUrl ||
          url === `${appBaseUrl}/`
        ) {
          return home;
        }

        // Relative same-origin path (e.g. "/some/page") — validate through the
        // shared sanitizer (rejects "//", "/\", %5C, and "/../" traversal), then
        // resolve against the app base. sanitizeRedirectUrl returns the relative
        // path for relative input, so re-prefix appBaseUrl to honor NextAuth's
        // absolute-URL redirect contract.
        if (url.startsWith('/') && !url.startsWith('//')) {
          const safe = sanitizeRedirectUrl(url, appBaseUrl, '');
          if (!safe || !safe.startsWith('/')) return home;
          if (isAuthChromePath(safe)) return home;
          return `${appBaseUrl}${safe}`;
        }

        // Absolute URL — only honor when it matches the app origin.
        try {
          const parsed = new URL(url);
          const base = new URL(appBaseUrl);
          if (parsed.origin === base.origin) {
            // Compare the path *relative to the app base* — under a basePath
            // the login page is `/apps/template/login`, which would not match
            // an anchored `^/login` check.
            const basePathname = base.pathname.replace(/\/+$/, '');
            const relative =
              basePathname && parsed.pathname.startsWith(basePathname)
                ? parsed.pathname.slice(basePathname.length) || '/'
                : parsed.pathname;
            return isAuthChromePath(relative) ? home : url;
          }
        } catch {
          // fall through to home
        }
        return home;
      },
    },

    events: {
      async signOut(message) {
        // Skip revocation when auth is disabled or in preview mode — no real token exists.
        if (authIsDisabled || configError || normalizePreviewMode(env)) return;

        // JWT sessions carry { token }; DB sessions carry { session }.
        // This package uses JWT sessions only, but guard defensively.
        const token = ('token' in message ? message.token : null) as JWT | null;
        if (!token) return;

        // F1a — await revocation so the /api/auth/signout response is delayed
        // until the IdP has confirmed (or refused) the revoke. This closes the
        // race where the client called `window.location.replace(endSessionUrl)`
        // before the revoke `fetch()` had finished — browser navigation aborts
        // in-flight requests.
        //
        // Revocation must still never **throw** — local sign-out always
        // succeeds, even if the IdP is unreachable. Errors surface as logs.
        try {
          const result = await revokeOidcSession(token, env);
          if (!result.ok) {
            console.warn('[next-auth.events.signOut] token revocation skipped/failed', result);
          }
        } catch (err) {
          // Belt-and-braces — `revokeOidcSession` is supposed to catch its own
          // network errors and tag them, but defend against future changes.
          console.error('[next-auth.events.signOut] token revocation threw:', err);
        }
      },
    },
  };

  // ── Route handler (lazy) ──────────────────────────────────────────────────
  // `NextAuth()` is only called on the first request that hits GET/POST, which
  // only happens in Node runtime (the /api/auth/[...nextauth] route). This
  // keeps `next-auth` + `openid-client` out of the Edge middleware bundle.

  let cachedHandler: NextAuthHandler | null = null;
  async function ensureHandler(): Promise<NextAuthHandler> {
    if (cachedHandler) return cachedHandler;
    cachedHandler = await createNextAuthHandler(authOptions, env);
    return cachedHandler;
  }

  const handlerGET: NextAuthHandler = async (req, ctx) => {
    const h = await ensureHandler();
    return h(req, ctx);
  };
  const handlerPOST: NextAuthHandler = async (req, ctx) => {
    const h = await ensureHandler();
    return h(req, ctx);
  };

  // ── Middleware primitives (Edge-safe) ─────────────────────────────────────

  function isAuthDisabled(): boolean {
    return isAuthDisabledFromEnv(env);
  }

  function isPreviewMode(): boolean {
    return normalizePreviewMode(env);
  }

  async function getTokenFromRequest(request: unknown): Promise<JWT | null> {
    const secureCookie = resolveSecureCookie(extractCookieNames(request));
    return (await getToken({
      req: request as Parameters<typeof getToken>[0]['req'],
      secret,
      ...(secureCookie !== undefined ? { secureCookie } : {}),
    })) as JWT | null;
  }

  function isTokenExpiredOrFailed(token: JWT): boolean {
    const expiresAt = typeof token.expiresAt === 'number' ? token.expiresAt : undefined;
    const isExpired = expiresAt !== undefined && expiresAt <= Date.now() + TOKEN_EXPIRY_GRACE_MS;
    // `token.error` is only ever set to 'RefreshAccessTokenError' (the refresh
    // path flattens the IdP's OAuth error body into this single flag), so that
    // is the only failure value to check here.
    return isExpired || token.error === 'RefreshAccessTokenError';
  }

  function getLoginRedirectUrl(request: { url: string }): URL {
    const explicitBasePath = env.NEXT_PUBLIC_BASE_PATH ?? process.env.NEXT_PUBLIC_BASE_PATH ?? '';

    // NEXTAUTH_URL_INTERNAL is a server-to-server origin and must never end up
    // in a `Location` header — this URL is handed straight to
    // NextResponse.redirect(). Use the public NEXTAUTH_URL (minus its
    // `/api/auth` suffix), falling back to the request's own origin.
    const configuredBase = stripAuthApiSuffix(env.NEXTAUTH_URL ?? '');
    if (configuredBase) {
      try {
        const base = new URL(configuredBase);
        // When NEXT_PUBLIC_BASE_PATH is unset, recover the basePath from
        // NEXTAUTH_URL's own path — `new URL('/login', 'https://h/app')`
        // would otherwise resolve to `https://h/login` and drop it.
        const prefix = explicitBasePath || base.pathname.replace(/\/+$/, '');
        return new URL(`${prefix}${loginUrl}`, base.origin);
      } catch {
        // Malformed NEXTAUTH_URL — fall through to the request origin.
      }
    }

    return new URL(`${explicitBasePath}${loginUrl}`, request.url);
  }

  // ── Server helpers (Node runtime only — dynamic imports) ──────────────────

  async function getAccessToken(): Promise<JWT | null> {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const all = cookieStore.getAll();
    const secureCookie = resolveSecureCookie(all.map((c) => c.name));
    const token = await getToken({
      req: {
        cookies: Object.fromEntries(all.map((c) => [c.name, c.value])),
      } as NextApiRequest,
      secret,
      ...(secureCookie !== undefined ? { secureCookie } : {}),
    });
    return token as JWT | null;
  }

  async function serverSession(): Promise<Session | null> {
    if (configError) throw configError;
    if (authIsDisabled) return null;
    const { getServerSession } = await import('next-auth');
    return (await getServerSession(authOptions)) as Session | null;
  }

  async function getSession(): Promise<Session | null> {
    if (configError) throw configError;

    let session: Session | null;
    try {
      session = await serverSession();
    } catch {
      // Cookie decode / transient session-read failure — treat as "no session".
      return null;
    }

    if (!session) return null;

    const providerExp = typeof session.expiresAt === 'number' ? session.expiresAt : undefined;
    const providerExpired =
      providerExp !== undefined && providerExp < Date.now() + TOKEN_REFRESH_BUFFER_MS;
    const refreshFailed = session.error === 'RefreshAccessTokenError';

    // Expired access token or a failed refresh: hand control to onSessionExpired
    // (typically `redirect('/logout')`). This MUST run outside the try/catch
    // above — `redirect()` signals via a thrown NEXT_REDIRECT error, and
    // swallowing it would silently cancel the redirect, leaving a dead session
    // mounted until the next access-token-bearing request 401s into the error
    // boundary.
    if (providerExpired || refreshFailed) {
      onSessionExpired?.();
      return null;
    }

    return session;
  }

  // ── Return ─────────────────────────────────────────────────────────────────

  const configErrorHandler = configError ? makeConfigErrorHandler(configError) : null;

  return {
    configError,
    authOptions,
    // Priority: config error > auth disabled (none) > normal handler
    GET: configErrorHandler ?? (authIsDisabled ? disabledAuthHandler : handlerGET),
    POST: configErrorHandler ?? (authIsDisabled ? disabledAuthHandler : handlerPOST),
    config: { matcher },
    isAuthDisabled,
    isPreviewMode,
    getTokenFromRequest,
    isTokenExpiredOrFailed,
    getLoginRedirectUrl,
    getAccessToken,
    serverSession,
    getSession,
  };
}
