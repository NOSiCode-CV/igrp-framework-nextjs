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
  isOidcManagedProviderId,
  type AuthProviderId,
  type SessionAuthProviderId,
} from './providers';
import {
  applyRecoveredToken,
  configureOidcTokenRecoveryStore,
  forgetRecoveredToken,
  getRecoveredToken,
  introspectOidcToken,
  isUsableRecoveredToken,
  refreshOidcAccessToken,
  revokeOidcSession,
} from './oidc';
import type { IGRPTokenRecoveryStore } from './token-store';
import { escapeHtml, sanitizeRedirectUrl, stripAuthApiSuffix } from './sanitize';
import {
  buildAuthCookies,
  resolveSecureCookie,
  resolveSecureCookiesFlag,
  sessionCookieName,
} from './cookies';
import { isNextControlFlowError } from './runtime';
import { decodeIgrpClaims } from './claims';
import { warnOnce } from './_global-state';

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
// CONSTRAINT: the client-side session-poll interval — `sessionArgs.refetchInterval`,
// set by the app, NOT by any env var — interacts with this buffer.
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
// This is why IGRPSessionWatcher exists: it schedules the refresh from
// `session.expiresAt` instead, so correctness no longer depends on tuning the
// fixed poll at all, and the poll is free to be a long backstop.
const TOKEN_REFRESH_BUFFER_MS = 60_000;

// How long BEFORE actual access-token expiry middleware starts redirecting to
// /login. Deliberately much smaller than TOKEN_REFRESH_BUFFER_MS: the jwt
// callback begins refreshing proactively at `expiresAt - TOKEN_REFRESH_BUFFER_MS`
// (60s out), so middleware must stay lenient past that point to give the client
// session poll / focus-refetch a chance to rotate the cookie before a navigation
// is bounced to /login. This is just a small grace to cover in-flight request
// duration (the access token shouldn't die mid-render).
const TOKEN_EXPIRY_GRACE_MS = 10_000;

// Total wall-clock budget for IdP revocation during sign-out. `events.signOut`
// blocks the /api/auth/signout response — and therefore the cookie clear —
// until it settles, and revocation is discovery + revoke in series, so bounding
// the individual fetches is not the same as bounding the user's wait.
const SIGNOUT_REVOCATION_BUDGET_MS = 5000;

// Access-token lifetime assumed only when the IdP told us nothing AND the
// token itself carries no `exp`. Deliberately short: the previous one-hour
// guess meant a token that really died in ~3 minutes was treated as healthy for
// the rest of the hour — middleware never bounced, the jwt callback never
// refreshed, and every access-management call 401'd with nothing in the session
// explaining why. A short value is self-correcting: the next jwt callback
// refreshes and the IdP's real `expires_in` takes over.
const UNKNOWN_EXPIRY_FALLBACK_MS = 5 * 60_000;

// Default middleware matcher, exposed as `auth.config` for a template to
// re-export.
//
// Matchers are basePath-RELATIVE: Next strips `basePath` before matching (the
// same reason `request.nextUrl.pathname` arrives without it). So the `apps`
// alternative excludes a top-level `/apps` *inside* the app — it does NOT
// refer to a deployment mounted at `/apps/<name>`, and an app whose basePath
// is `/apps/template` is matched normally. It is kept only for consumers that
// really do have an `/apps` route; it protects nothing by itself.
//
// Consumers that additionally filter inside the middleware body (static
// prefixes, extension checks) are duplicating `_next|favicon.ico|.*\..*`
// here — harmless, but the matcher is the cheaper place to do it, since a
// non-matching request never wakes the middleware at all.
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
   *
   * LIMIT: this map governs everything **this package** reads, but it cannot
   * reach inside `next-auth` itself. `next-auth`'s `detectOrigin()` reads
   * `process.env.NEXTAUTH_URL` / `VERCEL` / `AUTH_TRUST_HOST` directly, and
   * that origin is what it uses for its own `callbackUrl` and for the
   * `baseUrl` handed to `callbacks.redirect`. So a caller that passes `env`
   * WITHOUT also setting the corresponding `process.env` values gets a split
   * brain: our cookie naming, redirects and secret follow the map, while
   * next-auth's internals fall back to `http://localhost:3000`.
   *
   * In practice: use `env` to narrow or validate what is already in
   * `process.env`, not to replace it.
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
   * How auth cookies are named when the app runs under a `basePath`.
   *
   * - `"basePath"` (default) — every NextAuth cookie name is suffixed with a
   *   slug derived from `NEXT_PUBLIC_BASE_PATH`, so two IGRP apps on the same
   *   host under `/apps/a` and `/apps/b` stop overwriting each other's session.
   * - `"none"` — keep NextAuth's stock names.
   *
   * Only takes effect when a basePath is actually set; a single app at the
   * host root is unaffected either way.
   *
   * NOTE: switching an existing deployment from `"none"` to `"basePath"` (or
   * changing the basePath) renames the cookie, which signs every current
   * session out exactly once.
   */
  cookieIsolation?: 'basePath' | 'none';

  /**
   * Overrides whether auth cookies are marked `Secure` (and carry the
   * `__Secure-` / `__Host-` prefixes).
   *
   * Defaults to the same signal `next-auth` uses — see
   * `resolveSecureCookiesFlag`. Set it explicitly only for a deployment that
   * terminates plain http behind a trusted proxy, where the default's
   * https assumption is wrong.
   */
  secureCookies?: boolean;

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
   * Resolves an app-relative path against the app's **browser-reachable**
   * origin, including its basePath.
   *
   * This is the single origin resolver for anything that becomes a `Location`
   * header. Middleware that builds its own redirects (`/login`, `/`, …) should
   * go through this rather than `new URL(path, request.url)`: behind a
   * TLS-terminating proxy `request.url` is the *internal* origin
   * (`http://pod:3000/…`), so redirecting to it sends the browser somewhere it
   * cannot reach. Prefers `NEXTAUTH_URL` (minus its `/api/auth` suffix) and
   * falls back to the request origin. `NEXTAUTH_URL_INTERNAL` is never used —
   * it names a server-to-server origin by definition.
   *
   * Accepts `{ url: string }` so it works with any NextRequest version.
   *
   * @example
   * return NextResponse.redirect(auth.resolveAppUrl('/', request));
   */
  resolveAppUrl: (path: string, request: { url: string }) => URL;

  /**
   * `resolveAppUrl` applied to the configured `middleware.loginUrl`
   * (default `/login`). Equivalent to `auth.resolveAppUrl('/login', request)`.
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
 * Warns once when the IdP issues access tokens whose whole lifetime is inside
 * the proactive-refresh buffer.
 *
 * At that point `expiresAt - TOKEN_REFRESH_BUFFER_MS` is already in the past
 * for a token that was JUST issued, so: the jwt callback refreshes on every
 * single session read (one IdP round-trip per read), and `getSession` — which
 * uses the same buffer to decide "expired" — calls `onSessionExpired()` on a
 * freshly refreshed session, i.e. redirects to /logout forever. The poll-interval
 * constraint below was checked; this one, which is the more destructive half,
 * was not.
 *
 * Unlike the poll-interval check this also warns in production: the condition is
 * a property of the IdP's client configuration, which is exactly what differs
 * between a working dev realm and a broken deployed one.
 */
function warnOnShortTokenLifetime(expiresAt: number): void {
  const lifetimeMs = expiresAt - Date.now();
  if (lifetimeMs > TOKEN_REFRESH_BUFFER_MS) return;

  warnOnce('config.shortTokenLifetime', () =>
    console.warn(
      `[withIGRPAuth] the IdP issued an access token that lives ~${Math.max(0, Math.round(lifetimeMs / 1000))}s, ` +
        `which is inside the ${TOKEN_REFRESH_BUFFER_MS / 1000}s proactive-refresh buffer. Every session read will ` +
        'refresh, and every server render will treat the fresh session as expired and run onSessionExpired ' +
        "(typically a redirect to /logout). Raise the IdP client's access-token lifetime above " +
        `${TOKEN_REFRESH_BUFFER_MS / 1000}s.`,
    ),
  );
}

/**
 * Warns once, in development only, when `IGRP_SESSION_REFETCH_INTERVAL` is set.
 *
 * NOTHING READS THIS VARIABLE. The client poll cadence is whatever the app puts
 * in `sessionArgs.refetchInterval` (in `demo-v1`, a fixed 600s backstop in
 * `src/lib/config/get-session-args.ts`), and the real silent refresh is
 * scheduled adaptively by `IGRPSessionWatcher` from `session.expiresAt`.
 *
 * This check previously compared the env value against TOKEN_REFRESH_BUFFER_MS
 * and warned when it was too large. That could never work: it inspected a
 * variable with no effect on the interval it was guarding, so it passed on the
 * documented `45` while the value that actually reached `SessionProvider` was
 * `600` — ten times past the ceiling it existed to enforce. A guard that reads
 * one value and protects another is not a guard.
 *
 * It now warns about the only thing it can actually observe and be right about:
 * the variable is set, and setting it does nothing. That makes the check
 * *capable of firing correctly*, which the previous version was not.
 */
function warnOnRefetchIntervalMisconfiguration(env: Record<string, string | undefined>): void {
  const raw = env.IGRP_SESSION_REFETCH_INTERVAL?.trim();
  if (!raw) return;

  warnOnce('config.refetchInterval', () =>
    console.warn(
      `[withIGRPAuth] IGRP_SESSION_REFETCH_INTERVAL is set (${raw}) but nothing reads it — ` +
        'it has no effect on the client session-poll cadence. That is set by the app via ' +
        '`sessionArgs.refetchInterval`, and silent token refresh is scheduled adaptively by ' +
        'IGRPSessionWatcher from `session.expiresAt`, so it needs no tuning. Remove the ' +
        'variable from your .env.',
    ),
  );
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

/**
 * Best available expiry for a freshly issued access token, most to least
 * authoritative:
 *   1. `account.expires_at` — what next-auth derived from the token response.
 *   2. `account.expires_in` — present when next-auth could not normalise it.
 *   3. the access token's OWN `exp` claim, when it is a JWT.
 *   4. {@link UNKNOWN_EXPIRY_FALLBACK_MS}.
 *
 * Step 3 matters because an IdP that omits `expires_in` still stamps `exp` into
 * the token it just issued — so "we don't know" is much rarer than a bare
 * `expires_at` check suggests.
 */
function resolveInitialExpiry(
  account: {
    expires_at?: number;
    expires_in?: number;
    access_token?: string;
  },
  isManagedProvider: boolean,
): number | undefined {
  if (typeof account.expires_at === 'number' && Number.isFinite(account.expires_at)) {
    return account.expires_at * 1000;
  }
  if (typeof account.expires_in === 'number' && Number.isFinite(account.expires_in)) {
    return Date.now() + account.expires_in * 1000;
  }
  if (typeof account.access_token === 'string') {
    try {
      const claims = decodeIgrpClaims(account.access_token);
      if (typeof claims.expiresAt === 'number') return claims.expiresAt;
    } catch {
      // Opaque (non-JWT) access token, or malformed — fall through.
    }
  }
  // A provider this package does not manage has no refresh path to "correct"
  // an invented expiry: the guess would simply become the moment the session
  // dies. A GitHub token, for instance, does not expire and reports no
  // `expires_in`, so the 5-minute fallback used to redirect the user to /logout
  // five minutes after sign-in. Leaving `expiresAt` undefined is what the
  // expiry gates read as "this provider has no token expiry", handing the
  // session's lifetime to the NextAuth cookie — standard NextAuth behaviour.
  if (!isManagedProvider) return undefined;

  console.warn(
    '[next-auth] jwt: the IdP returned no expires_at/expires_in and the access token carries no ' +
      `exp claim — assuming ${UNKNOWN_EXPIRY_FALLBACK_MS / 1000}s. The first refresh will correct it.`,
  );
  return Date.now() + UNKNOWN_EXPIRY_FALLBACK_MS;
}

/**
 * Resolves to `fallback` if `promise` has not settled within `ms`. The promise
 * itself is not cancelled — it is left to finish (or fail) in the background;
 * this only bounds how long the caller waits on it.
 */
async function withDeadline<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    return await Promise.race([promise, deadline]);
  } finally {
    if (timer) clearTimeout(timer);
  }
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
    cookieIsolation = 'basePath',
    secureCookies: secureCookiesOption,
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
    const code = msg.includes('AUTH_PROVIDER is set but empty')
      ? 'AUTH_PROVIDER_EMPTY'
      : msg.includes('Unsupported AUTH_PROVIDER')
        ? 'AUTH_PROVIDER_INVALID'
        : 'AUTH_CONFIG_INVALID';
    configError = new IGRPAuthConfigError(msg, code);
  }

  const authIsDisabled = !configError && resolvedProvider === null;

  // ── Secret ────────────────────────────────────────────────────────────────
  // A missing secret is not a soft failure: `getToken` does not throw on one,
  // it fails to decrypt and returns null, so middleware sees "no session" on
  // every request and loops to /login while the route handler separately 500s
  // from NextAuth's own MissingSecret. That reads as "auth is flaky" in a log.
  // Surface it through the same lazy mechanism as a bad provider.
  //
  // Production only, mirroring NextAuth v4 (which derives a throwaway secret in
  // development): dev without a secret is already degraded, but failing the
  // whole app there would break a first-run `pnpm dev` before the user has
  // written their .env.
  if (!configError && !authIsDisabled && !secret) {
    if (resolveNodeEnv(env) === 'production') {
      configError = new IGRPAuthConfigError(
        'NEXTAUTH_SECRET is not set. Without it the session cookie cannot be decrypted: ' +
          'getToken() returns null for every request, so middleware redirects to /login in a loop.',
        'AUTH_SECRET_MISSING',
      );
    } else {
      warnOnce('config.missingSecret', () =>
        console.warn(
          '[withIGRPAuth] NEXTAUTH_SECRET is not set. Session cookies cannot be read by ' +
            'getToken()/middleware, which looks like a /login redirect loop. Required in production.',
        ),
      );
    }
  }

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

  /**
   * The provider id stamped onto the JWT at sign-in.
   *
   * Reads the RESOLVED provider, not the environment. `withIGRPAuth` documents
   * `provider: GitHubProvider({...})` as a supported way to bring your own
   * provider, but the env var is untouched in that case — so every custom-provider
   * session used to be stamped `"none"`, and every OIDC helper then treated it as
   * the auth-disabled bypass: discovery resolved to `''`, `fetch('')` threw, and
   * the first refresh force-logged the user out of a healthy session.
   */
  function resolveTokenProviderId(): SessionAuthProviderId {
    if (provider != null && typeof provider === 'object') return provider.id;
    return getAuthProviderIdFromEnv(env);
  }

  /**
   * Whether the OIDC token lifecycle applies to the session this token belongs
   * to.
   *
   * A token minted before `authProviderId` was stamped carries no id at all.
   * Reading that as "unmanaged" would silently strand every live session at the
   * moment of upgrade — no refresh, ever — so it falls back to the environment,
   * exactly as `oidc.getProviderIdFromTokenOrEnv` does. A throwing environment
   * means `configError` is already set and the handlers are replaced; answering
   * "managed" there keeps the pre-existing code path.
   */
  function isManagedSessionToken(token: JWT): boolean {
    if (token.authProviderId !== undefined) {
      return isOidcManagedProviderId(token.authProviderId);
    }
    try {
      return isOidcManagedProviderId(resolveTokenProviderId());
    } catch {
      return true;
    }
  }

  /** Post-auth landing URL: app base + NEXT_PUBLIC_IGRP_APP_HOME_SLUG. */
  function buildHomeUrl(appBaseUrl: string): string {
    const rawSlug = env.NEXT_PUBLIC_IGRP_APP_HOME_SLUG?.trim() || '/';
    const withLeadingSlash = rawSlug.startsWith('/') ? rawSlug : `/${rawSlug}`;
    const safeSlug = sanitizeRedirectUrl(withLeadingSlash, appBaseUrl, '/');
    return `${appBaseUrl}${safeSlug === '/' ? '/' : safeSlug}`;
  }

  // ── Cookie naming ──────────────────────────────────────────────────────────
  // `useSecureCookies` is left to NextAuth (see the note on authOptions below),
  // and it derives the flag from NEXTAUTH_URL's scheme — so mirror exactly that
  // signal here, or the names we write and the names `getToken` reads would
  // disagree.
  const basePath = env.NEXT_PUBLIC_BASE_PATH ?? process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const secureCookies = secureCookiesOption ?? resolveSecureCookiesFlag(env);
  const authCookies =
    cookieIsolation === 'basePath' ? buildAuthCookies(basePath, secureCookies) : undefined;
  // What `getToken` must look for. Only meaningful when we overrode the names;
  // otherwise `getToken` keeps its own derivation.
  const resolvedSessionCookieName = authCookies ? authCookies.sessionToken.name : undefined;

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
    // Scoped cookie names when the app runs under a basePath — see ./cookies.
    // Absent (undefined) for a root-path app, leaving NextAuth's defaults.
    //
    // `useSecureCookies` is pinned to the SAME value used to build those names.
    // The long-standing note below says not to set it explicitly, because doing
    // so with a *different* signal (NODE_ENV) desynchronised the writer from
    // `getToken`. Once we override the names we are already committed to a
    // scheme decision, so stating it makes both sides agree by construction
    // rather than by both happening to derive it the same way. Only set
    // alongside `cookies`, so the no-basePath path behaves exactly as before.
    ...(authCookies ? { cookies: authCookies, useSecureCookies: secureCookies } : {}),
    ...(pages ? { pages } : {}),
    ...(sessionConfig ? { session: sessionConfig } : {}),

    callbacks: {
      async jwt(params) {
        const { token, account } = params;
        let igrpToken = token as JWT;

        // Initial sign-in: map account fields onto the JWT
        if (account) {
          const accountTyped = account as Account & { expires_at?: number; expires_in?: number };
          const providerId = resolveTokenProviderId();
          const expiresAt = resolveInitialExpiry(accountTyped, isOidcManagedProviderId(providerId));
          if (expiresAt !== undefined) warnOnShortTokenLifetime(expiresAt);
          igrpToken = {
            ...igrpToken,
            authProviderId: providerId,
            accessToken: accountTyped.access_token,
            idToken: accountTyped.id_token,
            expiresAt,
            refreshToken: accountTyped.refresh_token,
          };
        }

        // A provider this package does not manage owns its own token lifecycle:
        // there is no discovery document, no token endpoint and no credentials
        // to refresh with. Everything below — the expiry buffer, the recovery
        // store, introspection, refresh — is OIDC machinery that cannot apply,
        // and running it anyway is what used to end custom-provider sessions on
        // a schedule (first by forcing a logout, then by inventing an expiry).
        // Hand the token straight to the caller's extension instead.
        if (!isManagedSessionToken(igrpToken)) {
          if (callbackExtensions.jwt) {
            return callbackExtensions.jwt(params, igrpToken);
          }
          return igrpToken;
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
        if (isUsableRecoveredToken(recovered)) {
          // Take only the auth material: the stored token was built by whichever
          // caller performed the rotation, so adopting it wholesale would import
          // that caller's custom claims into this session.
          igrpToken = applyRecoveredToken(igrpToken, recovered);
        }

        // Recovery may hand back an entry whose ACCESS token is already spent —
        // the entry lives for RECOVERY_TTL_MS, which can outlast it. Adopting it
        // is still right (it carries the rotated, still-valid refresh token),
        // but the session is not healthy yet, so re-check rather than returning
        // a token that is expired on arrival. Re-reading `expiresAt` here is
        // also what makes a garbage store entry recoverable instead of sticky.
        const stillNeedsRefresh =
          !igrpToken.expiresAt || Date.now() >= igrpToken.expiresAt - TOKEN_REFRESH_BUFFER_MS;

        if (stillNeedsRefresh) {
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
              } else if (typeof igrpToken.expiresAt === 'number') {
                // Also check REFRESHED tokens, not just the one minted at
                // sign-in: an IdP client whose access-token lifetime is
                // shortened after deployment would otherwise never trip the
                // warning, and that is precisely when the refresh storm starts.
                warnOnShortTokenLifetime(igrpToken.expiresAt);
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
        // Bounded as a WHOLE rather than per hop: revocation does discovery
        // (one timeout) and then the revoke call (another), serially, so the
        // per-fetch ceiling alone allows roughly double the wait on a cold
        // discovery cache — all of it delaying the session-cookie clear.
        //
        // Revocation must still never **throw** — local sign-out always
        // succeeds, even if the IdP is unreachable. Errors surface as logs.
        //
        // The budget covers EVERY remote hop this event makes, not just the
        // revoke: the recovery-store cleanup below can also be a network call
        // when a shared store is configured, and an unbounded await there would
        // hold the cookie clear open for exactly as long as that store is down.
        const signOutDeadline = Date.now() + SIGNOUT_REVOCATION_BUDGET_MS;
        const remainingBudget = () => Math.max(0, signOutDeadline - Date.now());

        try {
          const result = await withDeadline(revokeOidcSession(token, env), remainingBudget(), {
            ok: false as const,
            reason: 'timeout' as const,
          });
          if (!result.ok) {
            console.warn('[next-auth.events.signOut] token revocation skipped/failed', result);
          }
        } catch (err) {
          // Belt-and-braces — `revokeOidcSession` is supposed to catch its own
          // network errors and tag them, but defend against future changes.
          console.error('[next-auth.events.signOut] token revocation threw:', err);
        }

        // Drop this session's rotation-recovery entry. The entry exists to
        // bridge an RSC rotation to the next persisting read; once the user has
        // signed out there is no next read, and leaving it would keep a token
        // bundle for a dead session in the store for the rest of its TTL.
        //
        // Entries are keyed by the CONSUMED refresh token, so this clears the
        // case that matters — a rotation whose cookie was never persisted, i.e.
        // the cookie still holds the consumed token. A rotation that DID persist
        // leaves an entry keyed by a token this session no longer knows; that
        // one still expires by TTL. Bounded by the shared sign-out budget above.
        await withDeadline(forgetRecoveredToken(token.refreshToken), remainingBudget(), undefined);
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
      // When we renamed the cookies, `getToken`'s own derivation would look for
      // the stock name and find nothing.
      ...(resolvedSessionCookieName
        ? { cookieName: sessionCookieName(basePath, secureCookie ?? secureCookies) }
        : {}),
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

  function resolveAppUrl(path: string, request: { url: string }): URL {
    const explicitBasePath = env.NEXT_PUBLIC_BASE_PATH ?? process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    const relative = path.startsWith('/') ? path : `/${path}`;

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
        return new URL(`${prefix}${relative}`, base.origin);
      } catch {
        // Malformed NEXTAUTH_URL — fall through to the request origin.
      }
    }

    return new URL(`${explicitBasePath}${relative}`, request.url);
  }

  function getLoginRedirectUrl(request: { url: string }): URL {
    return resolveAppUrl(loginUrl, request);
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
      ...(resolvedSessionCookieName
        ? { cookieName: sessionCookieName(basePath, secureCookie ?? secureCookies) }
        : {}),
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
    } catch (error) {
      // `getServerSession` reads cookies/headers, so during a prerender it
      // throws Next's static-render bailout. That is control flow, not a
      // failure: swallowing it reports "no session", the route never gets
      // marked dynamic, and the page renders (and can be cached) as logged
      // out. The same applies to a redirect()/notFound() raised from a
      // caller-supplied callback. Only genuine read failures — cookie decode,
      // a changed NEXTAUTH_SECRET — become "no session".
      if (isNextControlFlowError(error)) throw error;
      if (isIGRPAuthConfigError(error)) throw error;
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
    resolveAppUrl,
    getLoginRedirectUrl,
    getAccessToken,
    serverSession,
    getSession,
  };
}
