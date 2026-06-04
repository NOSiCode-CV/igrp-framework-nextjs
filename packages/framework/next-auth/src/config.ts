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
  getRecoveredToken,
  introspectOidcToken,
  refreshOidcAccessToken,
  revokeOidcSession,
} from './oidc';
import { escapeHtml, sanitizeRedirectUrl } from './sanitize';

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
  jwt?: (params: Parameters<NonNullable<NonNullable<NextAuthOptions['callbacks']>['jwt']>>[0], igrpToken: JWT) => Promise<JWT>;

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
    return createAuthProviderFromEnv(env, provider as AuthProviderId | undefined) as AnyProvider | null;
  }
  return provider;
}

function normalizePreviewMode(env: Record<string, string | undefined>): boolean {
  return env.IGRP_PREVIEW_MODE?.trim().replace(/^["']|["']$/g, '').toLowerCase() === 'true';
}

/**
 * Lazily loads `next-auth` and returns a constructed handler.
 * Dynamic import so webpack doesn't pull `next-auth` (and transitively
 * `openid-client`) into any Edge bundle that imports `withIGRPAuth`.
 */
async function createNextAuthHandler(authOptions: NextAuthOptions): Promise<NextAuthHandler> {
  const NextAuthModule = await import('next-auth');
  const NextAuth = interopDefault(NextAuthModule as unknown as typeof NextAuthModule.default);
  return NextAuth({
    ...authOptions,
    debug: process.env.NODE_ENV === 'development',
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
    secret = process.env.NEXTAUTH_SECRET,
    pages,
    session: sessionConfig,
    callbacks: callbackExtensions = {},
    middleware: middlewareOptions = {},
    onSessionExpired,
  } = options;

  const {
    loginUrl = '/login',
    matcher = DEFAULT_MATCHER,
  } = middlewareOptions;

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
    const code = msg.includes('Unsupported AUTH_PROVIDER') ? 'AUTH_PROVIDER_INVALID' : 'AUTH_CONFIG_INVALID';
    configError = new IGRPAuthConfigError(msg, code);
  }

  const authIsDisabled = !configError && resolvedProvider === null;

  // ── authOptions ────────────────────────────────────────────────────────────
  // Built synchronously. The options *object* has no Node-only deps; it only
  // becomes Node-only when passed to NextAuth() below, which we defer.

  const authOptions: NextAuthOptions = {
    useSecureCookies: process.env.NODE_ENV === 'production',
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
        const recovered = getRecoveredToken(igrpToken.refreshToken);
        if (recovered) {
          if (env.NODE_ENV !== 'production') {
            console.debug('[next-auth.jwt] recovered rotated refresh token from cache', {
              recovered: true,
            });
          }
          igrpToken = recovered;
        } else {
          // Introspect the refresh token to catch a server-side revocation
          // before we try to use it (fail-open: a flaky introspection must
          // never block refresh).
          const refreshTokenActive = await introspectOidcToken(igrpToken, env).catch(() => true);
          if (!refreshTokenActive) {
            igrpToken = { ...igrpToken, error: 'RefreshAccessTokenError', forceLogout: true };
          } else {
            try {
              igrpToken = await refreshOidcAccessToken(igrpToken, env);
            } catch {
              igrpToken = { ...igrpToken, error: 'RefreshAccessTokenError', forceLogout: true };
            }
          }
        }

        if (callbackExtensions.jwt) {
          return callbackExtensions.jwt(params, igrpToken);
        }
        return igrpToken;
      },

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
        const nextInternalUrl = env.NEXTAUTH_URL_INTERNAL || '';
        const igrpAppHomeSlug = env.NEXT_PUBLIC_IGRP_APP_HOME_SLUG || '';
        const home = nextInternalUrl
          ? `${nextInternalUrl}${igrpAppHomeSlug}`
          : sanitizeRedirectUrl(igrpAppHomeSlug || '/', env.NEXTAUTH_URL ?? baseUrl, '/');

        // No useful callbackUrl — land on home.
        if (!url || url === baseUrl || url === `${baseUrl}/`) return home;

        // Relative same-origin path (e.g. "/some/page") — resolve against baseUrl.
        // Protocol-relative ("//evil.com/…") is rejected as an open-redirect vector.
        if (url.startsWith('/') && !url.startsWith('//')) {
          return `${baseUrl}${url}`;
        }

        // Absolute URL — only honor when it matches the app origin.
        try {
          if (new URL(url).origin === new URL(baseUrl).origin) return url;
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

        const isDev = env.NODE_ENV !== 'production';

        // D3 — log the shape of the token at signout time. Booleans only,
        // never the values. Helps confirm whether `id_token_hint` will be
        // present in the subsequent end-session URL and whether the refresh
        // token is available to revoke.
        if (isDev) {
          console.debug('[next-auth.events.signOut] token shape', {
            hasIdToken: typeof token.idToken === 'string' && token.idToken.length > 0,
            hasAccessToken: typeof token.accessToken === 'string' && token.accessToken.length > 0,
            hasRefreshToken: typeof token.refreshToken === 'string' && token.refreshToken.length > 0,
            authProviderId: token.authProviderId,
            expiresAt: token.expiresAt,
            error: token.error,
          });
        }

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
          } else if (isDev) {
            console.debug('[next-auth.events.signOut] token revocation succeeded', result);
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
    cachedHandler = await createNextAuthHandler(authOptions);
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
    return (await getToken({
      req: request as Parameters<typeof getToken>[0]['req'],
      secret: secret || process.env.NEXTAUTH_SECRET,
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
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    return new URL(`${basePath}${loginUrl}`, env.NEXTAUTH_URL_INTERNAL ?? request.url);
  }

  // ── Server helpers (Node runtime only — dynamic imports) ──────────────────

  async function getAccessToken(): Promise<JWT | null> {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = await getToken({
      req: {
        cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])),
      } as NextApiRequest,
      secret: secret || process.env.NEXTAUTH_SECRET,
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
    const providerExpired = providerExp !== undefined && providerExp < Date.now() + TOKEN_REFRESH_BUFFER_MS;
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
