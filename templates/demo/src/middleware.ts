import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "@igrp/framework-next-auth";
import { isPreviewMode } from "@/lib/utils";

const PUBLIC_PATHS = ["/login", "/logout", "/api/auth"];
const STATIC_PREFIXES = ["/_next/", "/static/", "/favicon.ico"];

function isPublicPath(pathname: string) {
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return true;
  }
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPreviewMode()) return NextResponse.next();

  if (isPublicPath(pathname)) return NextResponse.next();

  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXTAUTH_URL_INTERNAL ?? request.url),
    );
  }

  const expiresAt =
    typeof token.expiresAt === "number" ? token.expiresAt : undefined;
  const isExpired = expiresAt !== undefined && expiresAt <= Date.now() + 60_000;

  if (
    isExpired ||
    token.error === "RefreshAccessTokenError" ||
    token.error === "invalid_grant"
  ) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXTAUTH_URL_INTERNAL ?? request.url),
    );
  }

  return NextResponse.next();
}

// additional paths for apps, is used as subdomains
export const config = {
  matcher: ["/", "/((?!api|apps|health|_next|favicon.ico|.*\\..*).*)"],
};
