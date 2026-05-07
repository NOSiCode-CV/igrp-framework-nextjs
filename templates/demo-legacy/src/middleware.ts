import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

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

const AUTH_UI_PREFIXES = ["/login", "/logout", "/api/auth"];

const PUBLIC_PATHS = new Set(["/login", "/logout", "/api/auth"]);
const PUBLIC_PREFIXES = ["/login/", "/logout/", "/api/auth/"];
const STATIC_PREFIXES = ["/_next/", "/static/", "/favicon.ico"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (/\.[^/]+$/.test(pathname)) return true;
  return false;
}

function isAuthUiPath(pathname: string): boolean {
  return AUTH_UI_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Next.js middleware: auth check + security headers.
 *
 * Flow:
 * 1. When auth is bypassed (AUTH_PROVIDER=none or IGRP_PREVIEW_MODE=true),
 *    redirect any /login, /logout, or /api/auth/* request to / and let every
 *    other path through untouched. There is no real provider to talk to.
 * 2. Otherwise: skip auth for public/static paths.
 * 3. Extract JWT — redirect to login on failure.
 * 4. Redirect to login when token expired or refresh failed.
 * 5. Apply security headers to all passing responses.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (auth.isAuthDisabled() || auth.isPreviewMode()) {
    if (isAuthUiPath(pathname)) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/", request.url)),
      );
    }
    return withSecurityHeaders(NextResponse.next());
  }

  if (isPublicPath(pathname)) return withSecurityHeaders(NextResponse.next());

  const loginRedirect = () =>
    withSecurityHeaders(
      NextResponse.redirect(auth.getLoginRedirectUrl(request)),
    );

  let token: Awaited<ReturnType<typeof auth.getTokenFromRequest>>;
  try {
    token = await auth.getTokenFromRequest(request);
  } catch (error) {
    console.error("[Middleware] getToken failed", error, { pathname });
    return loginRedirect();
  }

  if (!token || auth.isTokenExpiredOrFailed(token)) {
    return loginRedirect();
  }

  return withSecurityHeaders(NextResponse.next());
}

// Matcher: page routes only (legacy template)
export const { config } = auth;
