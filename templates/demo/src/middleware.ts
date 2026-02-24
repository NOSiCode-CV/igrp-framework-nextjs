import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "@igrp/framework-next-auth";

import { AUTH_CONSTANTS } from "@/lib/constants";
import { logger } from "@/lib/errors";
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

function loginRedirect(request: NextRequest) {
  return NextResponse.redirect(
    new URL("/login", process.env.NEXTAUTH_URL_INTERNAL ?? request.url),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPreviewMode()) return NextResponse.next();

  if (isPublicPath(pathname)) return NextResponse.next();

  let token: Awaited<ReturnType<typeof getToken>>;
  try {
    token = await getToken({ req: request });
  } catch (error) {
    logger.error("[Middleware] getToken failed", error, { pathname });
    return loginRedirect(request);
  }

  if (!token) {
    return loginRedirect(request);
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
    return loginRedirect(request);
  }

  return NextResponse.next();
}

// additional paths for apps, is used as subdomains
export const config = {
  matcher: ["/", "/((?!api|apps|health|_next|favicon.ico|.*\\..*).*)"],
};
