import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { logger } from "@/lib/errors";

/** Security headers applied to all responses in production. */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

function withSecurityHeaders(response: NextResponse): NextResponse {
  if (process.env.NODE_ENV === "production") {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

const PUBLIC_PATHS = new Set(["/login", "/logout", "/api/auth", "/api/health"]);
const PUBLIC_PREFIXES = ["/login/", "/logout/", "/api/auth/", "/api/health/"];
const STATIC_PREFIXES = ["/_next/", "/static/", "/favicon.ico"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

/**
 * Next.js middleware: auth check + security headers.
 *
 * Flow:
 * 1. Skip auth when disabled (AUTH_PROVIDER=none) or preview mode
 * 2. Skip auth for public/static paths
 * 3. Extract JWT — redirect to login on failure
 * 4. Redirect to login when token expired or refresh failed
 * 5. Apply security headers to all passing responses
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (auth.isAuthDisabled()) return withSecurityHeaders(NextResponse.next());
  if (auth.isPreviewMode()) return withSecurityHeaders(NextResponse.next());
  if (isPublicPath(pathname)) return withSecurityHeaders(NextResponse.next());

  const loginRedirect = () =>
    withSecurityHeaders(
      NextResponse.redirect(auth.getLoginRedirectUrl(request)),
    );

  let token: Awaited<ReturnType<typeof auth.getTokenFromRequest>>;
  try {
    token = await auth.getTokenFromRequest(request);
  } catch (error) {
    logger.error("[Middleware] getToken failed", error, { pathname });
    return loginRedirect();
  }

  if (!token || auth.isTokenExpiredOrFailed(token)) {
    return loginRedirect();
  }

  return withSecurityHeaders(NextResponse.next());
}

// Matcher: page routes + API routes (so API responses also get security headers)
export const { config } = auth;
