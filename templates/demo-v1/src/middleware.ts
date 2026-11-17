import { type NextRequest, NextResponse } from "next/server";

import { staleAuthCookies } from "@igrp/framework-next-auth/cookies";
import { igrpMiddlewareDecision } from "@igrp/framework-next-auth/middleware";

// Edge runtime: import the instance from its Edge-safe module, NOT "@/lib/auth"
// (which also carries Node-only session helpers — see lib/auth-instance.ts).
import { auth } from "@/lib/auth-instance";
import { LOGOUT_PENDING_COOKIE } from "@/lib/logout-pending";

/**
 * Content-Security-Policy-Report-Only baseline. Report-only never blocks a
 * request, so it blocks no XSS either: it only collects the data an enforcing
 * policy needs. Violations are POSTed to `/api/csp-report`, which logs them on
 * the server. Switch the header to `Content-Security-Policy` once those logs
 * are clean.
 *
 * style-src allows 'unsafe-inline' deliberately and permanently: Radix (used
 * throughout the design system for Popover/DropdownMenu/Tooltip/Select/
 * HoverCard/ContextMenu) sets inline `style` attributes at runtime for
 * floating-UI positioning, with no CSP nonce escape hatch — this is not
 * fixable from application code.
 *
 * script-src does NOT allow 'unsafe-inline'. Inline scripts carry the
 * per-request nonce instead: Next.js reads it from this policy on the request
 * headers for its own scripts, and the root layout passes `x-nonce` to
 * IGRPRootLayout for next-themes' theme boot script.
 */
function buildCspReportOnly(nonce?: string): string {
  const imageDomains = (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean)
    .flatMap((domain) => [`https://${domain}`, `http://${domain}`]);

  // form-action defaults to 'self' and would otherwise silently block the
  // logout page's cross-origin POST to the IdP's end_session_endpoint.
  let authIssuerOrigin = "";
  try {
    authIssuerOrigin = process.env.IGRP_AUTH_ISSUER
      ? new URL(process.env.IGRP_AUTH_ISSUER).origin
      : "";
  } catch {
    // Malformed IGRP_AUTH_ISSUER — omit rather than break header construction.
  }

  return [
    "default-src 'self'",
    `script-src 'self'${nonce ? ` 'nonce-${nonce}'` : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data:${imageDomains.length ? ` ${imageDomains.join(" ")}` : ""}`,
    "font-src 'self'",
    "connect-src 'self'",
    `form-action 'self'${authIssuerOrigin ? ` ${authIssuerOrigin}` : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    `report-uri ${BASE_PATH}${CSP_REPORT_PATH}`,
  ].join("; ");
}

/** Security headers applied to all responses in production. */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  // Deliberately "0", not "1; mode=block". The legacy XSS Auditor this header
  // controls was removed from every current browser, and where it still exists
  // its filtering has itself been an XSS vector (it can be abused to suppress
  // legitimate script and to probe cross-origin content). "0" disables it
  // explicitly, which is the current OWASP / Chrome guidance. The CSP above is
  // still report-only, so until it is switched to enforcing, XSS defence rests
  // on React's escaping.
  "X-XSS-Protection": "0",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  // Only meaningful when actually served over HTTPS, which every production
  // deployment of this template is expected to be (behind a TLS-terminating
  // proxy or directly). Safe to send unconditionally in the production gate
  // below — browsers ignore it on plain HTTP.
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
};

const IS_PRODUCTION = process.env.NODE_ENV === "production";

function withSecurityHeaders(
  response: NextResponse,
  csp = buildCspReportOnly(),
): NextResponse {
  if (IS_PRODUCTION) {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }
    response.headers.set("Content-Security-Policy-Report-Only", csp);
  }
  return response;
}

// `/api/health` is the container HEALTHCHECK target (docker/*/Dockerfile). Behind
// auth it answered 307 → /login, and `wget` followed the redirect — so the probe
// tested the login page at the public origin (or failed outright when the
// container cannot reach that origin) and never reached the health route.
// `/api/csp-report` receives browser CSP reports, which are sent without cookies.
// /login, /logout, /api/auth and static assets are public in the framework.
const CSP_REPORT_PATH = "/api/csp-report";
const PUBLIC_PATHS = ["/api/health", CSP_REPORT_PATH];

// Build-time constant — baked in by Next.js for NEXT_PUBLIC_* vars.
// Needed for raw URL construction in middleware where next/navigation isn't available.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Next.js middleware: auth check + security headers.
 *
 * The auth decision (bypass, public paths, logout-pending backstop, token,
 * host logout, callbackUrl) is the framework's `igrpMiddlewareDecision`; this
 * file turns it into a response and applies the security headers and CSP.
 *
 * x-current-path is injected as a request header on every passing response so
 * server components can build a callbackUrl when they need to redirect to login.
 */
export async function middleware(request: NextRequest) {
  return expireStaleAuthCookies(request, await handleRequest(request));
}

/**
 * Expires this app's previous-generation auth cookies on whatever response the
 * middleware produced (pass-through or redirect alike).
 *
 * Auth cookies are now confined to the app's basePath, under a new name. The
 * names this app used to write at `Path=/` are no longer read, but the browser
 * keeps sending them to every path on the host — including the IdP — until
 * they expire. `staleAuthCookies` derives those names from this app's basePath
 * only, so another co-hosted app's cookies are never touched. A no-op once the
 * old cookies are gone, and always for a root-path app.
 */
function expireStaleAuthCookies(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const names = request.cookies.getAll().map((cookie) => cookie.name);
  for (const { name, options } of staleAuthCookies(BASE_PATH, names)) {
    response.cookies.set(name, "", options);
  }
  return response;
}

async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const currentPath = pathname + search;

  // Passes the request through, forwarding the current path and a fresh CSP
  // nonce (`x-nonce`, read by the root layout) to server components.
  const nextWithPath = (): NextResponse => {
    const nonce = btoa(crypto.randomUUID());
    const csp = buildCspReportOnly(nonce);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-current-path", currentPath);
    requestHeaders.set("x-nonce", nonce);
    // Next.js takes the nonce for its own inline scripts from the request's policy.
    if (IS_PRODUCTION) {
      requestHeaders.set("Content-Security-Policy-Report-Only", csp);
    }
    return withSecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      csp,
    );
  };

  // Redirect URLs come from the framework (`auth.resolveAppUrl`), not
  // `new URL(path, request.url)`: behind a TLS-terminating proxy `request.url`
  // carries the INTERNAL origin, so a Location built from it points the browser
  // somewhere it cannot reach.
  const decision = await igrpMiddlewareDecision(request, auth, {
    publicPaths: PUBLIC_PATHS,
    logoutPendingCookie: LOGOUT_PENDING_COOKIE,
    basePath: BASE_PATH,
  });
  if (decision.type === "redirect") {
    return withSecurityHeaders(NextResponse.redirect(decision.url));
  }

  // i18n: this app is cookie-first (no `persistLocale`), so the middleware
  // leaves the IGRP_LOCALE cookie alone. A session-first app (one with a
  // profile write-back) reads the token itself and ends with
  //   return igrpSyncLocaleCookie(request, nextWithPath(), token.locale, i18n)
  // importing from "@igrp/framework-next/i18n" (Edge-safe), never from "@/i18n".
  return nextWithPath();
}

/**
 * Which requests wake the middleware.
 *
 * MUST be an object literal of string literals: Next reads `config` at BUILD
 * time by parsing this file, without running it. The previous
 * `export const { config } = auth;` could not be parsed, so Next silently fell
 * back to matching every path, static assets included (the build's
 * middleware-manifest showed `/:path*`).
 *
 * Same values as the framework default (`auth.config.matcher`). Matchers are
 * basePath-relative. Skips `/apps`, `/_next` and `favicon.ico` as whole
 * segments, and static assets by extension — not every path with a dot, so a
 * page route like `/users/john.doe` still goes through the middleware.
 */
export const config = {
  matcher: [
    "/",
    "/((?!apps(?:/|$)|_next(?:/|$)|favicon.ico$|.*\\.(?:ico|png|jpe?g|gif|svg|webp|avif|bmp|css|js|mjs|map|json|txt|xml|webmanifest|woff2?|ttf|otf|eot|pdf|mp4|webm|mp3)$).*)",
    "/api/:path*",
  ],
};
