import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "@igrp/framework-next-auth/jwt";

import { AUTH_CONSTANTS } from "@/lib/constants";
import { logger } from "@/lib/errors";
import { isPreviewMode } from "@/lib/utils";

/** Security headers applied to all responses in production. */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

/** Applies security headers to responses. */
function withSecurityHeaders(response: NextResponse): NextResponse {
  if (process.env.NODE_ENV === "production") {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

const PUBLIC_PATH_SET = new Set([
  "/login",
  "/logout",
  "/api/auth",
  "/api/health",
]);
const PUBLIC_PREFIXES = ["/login/", "/logout/", "/api/auth/", "/api/health/"];
const STATIC_PREFIXES = ["/_next/", "/static/", "/favicon.ico"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATH_SET.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

function loginRedirect(request: NextRequest) {
  return NextResponse.redirect(
    new URL("/login", process.env.NEXTAUTH_URL_INTERNAL ?? request.url),
  );
}

/**
 * Next.js middleware: auth check, security headers.
 * Skips auth in preview mode; redirects unauthenticated users to login.
 *
 * @param request - Incoming request
 * @returns Response (next, redirect, or login redirect)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPreviewMode()) return withSecurityHeaders(NextResponse.next());

  if (isPublicPath(pathname)) return withSecurityHeaders(NextResponse.next());

  let token: Awaited<ReturnType<typeof getToken>>;
  try {
    token = await getToken({ req: request });
  } catch (error) {
    logger.error("[Middleware] getToken failed", error, { pathname });
    return withSecurityHeaders(loginRedirect(request));
  }

  if (!token) {
    return withSecurityHeaders(loginRedirect(request));
  }

  const expiresAt =
    typeof token.expiresAt === "number" ? token.expiresAt : undefined;
  const isExpired =
    expiresAt !== undefined &&
    expiresAt <= Date.now() + AUTH_CONSTANTS.TOKEN_REFRESH_BUFFER_MS;

  if (
    isExpired ||
    token.error === "RefreshAccessTokenError" ||
    token.error === "invalid_grant"
  ) {
    return withSecurityHeaders(loginRedirect(request));
  }

  return withSecurityHeaders(NextResponse.next());
}

// Matcher: page routes + API routes (so API responses get security headers)
export const config = {
  matcher: ["/", "/((?!apps|_next|favicon.ico|.*\\..*).*)", "/api/:path*"],
};
