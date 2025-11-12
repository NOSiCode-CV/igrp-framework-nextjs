import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/logout", "/api/auth"];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip authentication checks if preview mode is enabled (handle whitespace, case, and quotes)
  const rawValue = process.env.IGRP_PREVIEW_MODE;
  const previewModeValue = rawValue
    ?.trim()
    ?.replace(/^["']|["']$/g, "")
    ?.toLowerCase();
  const isPreviewMode = previewModeValue === "true";

  if (!isPreviewMode) {
    // IF YOU USE AN AUTHENTICATION STRATEGY, UNCOMMENT THIS BLOCK

    if (isPublicPath(pathname)) return NextResponse.next();

    const token = await getToken({ req: request });

    if (token?.error === "RefreshAccessTokenError") {
      return NextResponse.redirect(
        new URL("/login", process.env.NEXTAUTH_URL_INTERNAL ?? request.url),
      );
    }
  }

  return NextResponse.next();
}

// additional paths for apps, is used as subdomains
export const config = {
  matcher: ["/", "/((?!api|apps|health|_next|favicon.ico|.*\\..*).*)"],
};
