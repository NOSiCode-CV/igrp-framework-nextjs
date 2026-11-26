import type { IGRPAuthInstance } from './config';
import { sanitizeCallbackUrl } from './sanitize';

/** The `withIGRPAuth` methods the middleware decision uses. */
export type IGRPMiddlewareAuth = Pick<
  IGRPAuthInstance,
  | 'getTokenFromRequest'
  | 'isTokenExpiredOrFailed'
  | 'isEndedByHostLogout'
  | 'getLoginRedirectUrl'
  | 'resolveAppUrl'
  | 'isPreviewMode'
  | 'isAuthDisabled'
>;

/** The parts of a `NextRequest` the decision reads. */
export type IGRPMiddlewareRequest = {
  url: string;
  nextUrl: { pathname: string; search: string };
  cookies: { has(name: string): boolean };
};

export type IGRPMiddlewareOptions = {
  /** Extra paths that skip the token check, matched exactly (e.g. `/api/health`). */
  publicPaths?: readonly string[];
  /**
   * The app's logout-pending marker cookie. While it is set, a protected route
   * is sent to the login page so the deferred sign-out can finish.
   */
  logoutPendingCookie?: string;
  /** Defaults to `NEXT_PUBLIC_BASE_PATH`. Used to sanitize `callbackUrl`. */
  basePath?: string;
  /**
   * Defaults to `process.env`. Read only for `NEXT_PUBLIC_BASE_PATH`; the
   * bypass comes from `auth`, so it follows the instance's `provider` option.
   */
  env?: Record<string, string | undefined>;
};

/** `pass`: let the request through. `redirect`: send the browser to `url`. */
export type IGRPMiddlewareDecision = { type: 'pass' } | { type: 'redirect'; url: URL };

const AUTH_UI_PREFIXES = ['/login', '/logout', '/api/auth'];
const PUBLIC_PREFIXES = ['/login/', '/logout/', '/api/auth/'];
const STATIC_PREFIXES = ['/_next/', '/static/', '/favicon.ico'];
const STATIC_ASSET_RE =
  /\.(?:ico|png|jpe?g|gif|svg|webp|avif|bmp|css|js|mjs|map|json|txt|xml|webmanifest|woff2?|ttf|otf|eot|pdf|mp4|webm|mp3)$/i;

function isAuthUiPath(pathname: string): boolean {
  return AUTH_UI_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPublicPath(pathname: string, publicPaths: readonly string[]): boolean {
  if (AUTH_UI_PREFIXES.includes(pathname) || publicPaths.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // Static assets by extension only. A dotted route such as `/users/john.doe`
  // is NOT public, and `/api/*` never counts as an asset (`/api/reports/x.pdf`
  // goes through the token check). Last segment only: on the full path, dots
  // before a later "/" make the regex O(n²).
  return (
    !pathname.startsWith('/api/') &&
    STATIC_ASSET_RE.test(pathname.slice(pathname.lastIndexOf('/') + 1))
  );
}

/**
 * What the app's middleware should do with a request, auth-wise. The app turns
 * the answer into a response and owns everything HTTP around it (security
 * headers, CSP, cookies), so this stays free of `next/server` and Edge-safe.
 *
 * 1. Auth bypassed (`auth.isPreviewMode()` or `auth.isAuthDisabled()`, the same
 *    answer the handlers act on): `/login`, `/logout` and `/api/auth/*` redirect
 *    to `/`; everything else passes. Reading the env here instead let a leftover
 *    `AUTH_PROVIDER=none` pass every request while `provider:` ran real auth.
 * 2. Public and static paths pass.
 * 3. A logout-pending marker sends a protected route to the login page (no
 *    `callbackUrl`: a completed logout lands on /login, not back in the app).
 * 4. No token, an undecodable, expired or failed one, or a session ended by a
 *    co-hosted app's logout (`reason=session_ended`): redirect to the login
 *    page with the current path as a sanitized `callbackUrl`.
 */
export async function igrpMiddlewareDecision(
  request: IGRPMiddlewareRequest,
  auth: IGRPMiddlewareAuth,
  options: IGRPMiddlewareOptions = {},
): Promise<IGRPMiddlewareDecision> {
  const env = options.env ?? process.env;
  const { pathname, search } = request.nextUrl;

  if (auth.isPreviewMode() || auth.isAuthDisabled()) {
    return isAuthUiPath(pathname)
      ? { type: 'redirect', url: auth.resolveAppUrl('/', request) }
      : { type: 'pass' };
  }

  if (isPublicPath(pathname, options.publicPaths ?? [])) return { type: 'pass' };

  if (options.logoutPendingCookie && request.cookies.has(options.logoutPendingCookie)) {
    console.warn(
      '[logout][middleware] logout_pending marker on protected route — forcing /login to complete teardown',
      { pathname },
    );
    return { type: 'redirect', url: auth.getLoginRedirectUrl(request) };
  }

  const loginRedirect = (reason?: 'session_ended'): IGRPMiddlewareDecision => {
    const url = auth.getLoginRedirectUrl(request);
    if (reason) url.searchParams.set('reason', reason);
    // Never `/`, never /login/* (would loop), never /logout/*.
    const callback = sanitizeCallbackUrl(
      pathname + search,
      options.basePath ?? env.NEXT_PUBLIC_BASE_PATH ?? '',
    );
    if (callback && callback !== '/') url.searchParams.set('callbackUrl', callback);
    return { type: 'redirect', url };
  };

  let token: Awaited<ReturnType<IGRPMiddlewareAuth['getTokenFromRequest']>>;
  try {
    token = await auth.getTokenFromRequest(request);
  } catch (error) {
    console.error('[Middleware] getToken failed', error, { pathname });
    return loginRedirect();
  }
  if (!token || auth.isTokenExpiredOrFailed(token)) return loginRedirect();
  if (auth.isEndedByHostLogout(token, request)) return loginRedirect('session_ended');
  return { type: 'pass' };
}
