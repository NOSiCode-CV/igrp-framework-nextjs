import type { NextApiRequest } from 'next';
import { cookies } from 'next/headers';
import NextAuth from 'next-auth';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import type { NextAuthOptions, Account } from 'next-auth';
import type { OAuthConfig } from 'next-auth/providers/oauth';

import type { JWT } from './jwt';
import type { Session } from './session';
import {
  createAuthProviderFromEnv,
  getAuthProviderIdFromEnv,
  isAuthDisabled as isAuthDisabledFromEnv,
  type AuthProviderId,
} from './providers';
import { refreshOidcAccessToken } from './oidc';
import { sanitizeRedirectUrl } from './sanitize';

// ─── Constants ───────────────────────────────────────────────────────────────

const TOKEN_REFRESH_BUFFER_MS = 60_000;
const TOKEN_EXPIRY_BUFFER_SEC = 60;

const DEFAULT_MATCHER = ['/', '/((?!apps|_next|favicon.ico|.*\\..*).*)', '/api/:path*'];

// ─── Types ────────────────────────────────────────────────────────────────────

type AnyProvider = OAuthConfig<Record<string, unknown>> | ReturnType<typeof import('next-auth/providers/keycloak').default>;

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
   * - Omit or pass "keycloak" / "autentika" / "none" to use IGRP pre-defined providers (reads env vars automatically).
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
  /** NextAuth options object — pass to NextAuth() if you need to customise further. */
  authOptions: NextAuthOptions;

  /**
   * Route handler for /api/auth/[...nextauth].
   * Re-export as GET and POST from your route file.
   *
   * @example
   * export const { GET, POST } = auth;
   */
  GET: ReturnType<typeof NextAuth>;
  POST: ReturnType<typeof NextAuth>;

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

  const resolvedProvider = resolveProvider(provider, env);

  // ── authOptions ────────────────────────────────────────────────────────────

  const authOptions: NextAuthOptions = {
    useSecureCookies: process.env.NODE_ENV === 'production',
    providers: [resolvedProvider].filter(Boolean) as NextAuthOptions['providers'],
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

        // Token still valid — return as-is
        if (igrpToken.expiresAt && Date.now() < igrpToken.expiresAt) {
          if (callbackExtensions.jwt) {
            return callbackExtensions.jwt(params, igrpToken);
          }
          return igrpToken;
        }

        // Token expired — attempt refresh
        try {
          igrpToken = await refreshOidcAccessToken(igrpToken, env);
        } catch {
          igrpToken = { ...igrpToken, error: 'RefreshAccessTokenError', forceLogout: true };
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

        const { url } = params;
        const nextInternalUrl = env.NEXTAUTH_URL_INTERNAL || '';
        const igrpAppHomeSlug = env.NEXT_PUBLIC_IGRP_APP_HOME_SLUG || '';

        if (nextInternalUrl) {
          return `${nextInternalUrl}${igrpAppHomeSlug}`;
        }

        return sanitizeRedirectUrl(url, env.NEXTAUTH_URL, '/');
      },
    },
  };

  // ── Route handler ──────────────────────────────────────────────────────────

  const handler = NextAuth({
    ...authOptions,
    debug: process.env.NODE_ENV === 'development',
  });

  // ── Middleware primitives ──────────────────────────────────────────────────

  function isAuthDisabled(): boolean {
    return isAuthDisabledFromEnv(env);
  }

  function isPreviewMode(): boolean {
    return normalizePreviewMode(env);
  }

  async function getTokenFromRequest(request: unknown): Promise<JWT | null> {
    return (await getToken({
      req: request as Parameters<typeof getToken>[0]['req'],
    })) as JWT | null;
  }

  function isTokenExpiredOrFailed(token: JWT): boolean {
    const expiresAt = typeof token.expiresAt === 'number' ? token.expiresAt : undefined;
    const isExpired = expiresAt !== undefined && expiresAt <= Date.now() + TOKEN_REFRESH_BUFFER_MS;
    return isExpired || token.error === 'RefreshAccessTokenError' || token.error === 'invalid_grant';
  }

  function getLoginRedirectUrl(request: { url: string }): URL {
    return new URL(loginUrl, env.NEXTAUTH_URL_INTERNAL ?? request.url);
  }

  // ── Server helpers (Node runtime) ─────────────────────────────────────────

  async function getAccessToken(): Promise<JWT | null> {
    const cookieStore = await cookies();
    const token = await getToken({
      req: {
        cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])),
      } as NextApiRequest,
      secret: secret || '',
    });
    return token as JWT | null;
  }

  async function serverSession(): Promise<Session | null> {
    try {
      return (await getServerSession(authOptions)) as Session | null;
    } catch {
      return null;
    }
  }

  async function getSession(): Promise<Session | null> {
    let session: Session | null;

    try {
      session = await serverSession();
      if (!session) return session;

      const now = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_BUFFER_SEC;
      const providerExp = typeof session.expiresAt === 'number' ? session.expiresAt : undefined;
      const providerExpired = providerExp !== undefined && providerExp < now;
      const refreshFailed = session.error === 'RefreshAccessTokenError';

      if (providerExpired || refreshFailed) {
        onSessionExpired?.();
        return null;
      }
    } catch {
      session = null;
    }

    return session;
  }

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    authOptions,
    GET: handler,
    POST: handler,
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
