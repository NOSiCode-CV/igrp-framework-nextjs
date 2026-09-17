import { redirect } from "next/navigation";

import { igrpSetAccessClientConfig } from "@igrp/framework-next";
import { isIgrpError } from "@igrp/framework-next/errors";
import { withIGRPAuth } from "@igrp/framework-next-auth/config";
import { assertAuthProviderEnv } from "@igrp/framework-next-auth/providers";

import { reportError } from "@/lib/report-error";
import { isAuthBypass } from "@/lib/utilities";

/**
 * Minimal session shape used in bypass mode (IGRP_PREVIEW_MODE or
 * AUTH_PROVIDER=none). Covers only the fields layouts/actions read; callers
 * cast to their concrete session type. Single source of truth — do not inline.
 */
export const PREVIEW_SESSION_STUB = {
  user: { name: "Preview User", email: "preview@example.com" },
  accessToken: "preview-token",
  expires: "9999-12-31T23:59:59.999Z",
} as const;

/**
 * Optional explicit NextAuth session-cookie lifetime, in seconds. Align this to
 * your IdP's refresh-token lifetime so the session cookie expires with the
 * refresh token instead of lingering for NextAuth's ~30-day default. Unset (or
 * non-numeric / <= 0) leaves the NextAuth default in place — no behavior change.
 */
function getSessionMaxAge(): number | undefined {
  const raw = process.env.IGRP_SESSION_MAX_AGE?.trim();
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

const sessionMaxAge = getSessionMaxAge();

/**
 * Central IGRP auth instance.
 *
 * - Provider is resolved automatically from AUTH_PROVIDER env var (igrp-auth / none).
 *   To use a custom provider, pass a Provider object: `provider: GitHubProvider({ ... })`.
 * - All auth boilerplate (authOptions, route handler, middleware, session helpers) is provided.
 *
 * Usage:
 *   Route handler  → export const { GET, POST } = auth;
 *   Middleware     → export const { middleware, config } = auth;
 *   Server action  → const session = await auth.serverSession();
 *   Layout         → const session = await auth.getSession();
 */
export const auth = withIGRPAuth({
  onSessionExpired: () => redirect("/logout"),
  // Explicit session lifetime when IGRP_SESSION_MAX_AGE is set; otherwise omit
  // so withIGRPAuth keeps NextAuth's default (no `session` override).
  ...(sessionMaxAge ? { session: { maxAge: sessionMaxAge } } : {}),
  // Point NextAuth at our custom sign-in page so its internal "needs sign-in"
  // redirects (e.g. when a future caller uses `useSession({ required: true })`
  // or `withAuth`) land on /login instead of the framework default page.
  pages: { signIn: "/login" },
});

/**
 * Gets the server-side session from NextAuth.
 * Validates env, configures the IGRP access client when a session exists.
 *
 * @returns Session or null
 */
export async function serverSession() {
  const apiManagement = process.env.IGRP_ACCESS_MANAGEMENT_API || "";

  if (!process.env.NEXTAUTH_SECRET) {
    console.warn(
      "NEXTAUTH_SECRET is not set. This is required for production.",
    );
    if (process.env.NODE_ENV === "production") {
      // Hard fail in prod — we will not masquerade as "no session". Bubbles
      // to the nearest App Router `error.tsx`.
      throw new Error("NEXTAUTH_SECRET must be set in production");
    }
  }

  // Env/provider misconfiguration is a setup problem, not a "no session"
  // condition — let typed framework errors propagate so the boundary can
  // render a real diagnosis rather than silently redirecting to login.
  assertAuthProviderEnv(process.env);

  try {
    const session = await auth.serverSession();

    const sessionError =
      session && typeof session === "object" && "error" in session
        ? (session as { error?: unknown }).error
        : undefined;

    // Dev-only diagnostics for the most common silent-failure modes:
    //  - session present but the JWT carries a `error` flag from `callbacks.jwt`
    //    (typical when the OIDC refresh token has expired or the issuer
    //    rejected refresh). Layouts treat the user as "logged out" but the
    //    underlying cause is invisible without a log.
    //  - session is null while a NextAuth cookie is present (cookie decode
    //    failed, NEXTAUTH_SECRET changed, or the cookie was issued by a
    //    different basePath/domain).
    if (process.env.NODE_ENV !== "production" && sessionError) {
      console.warn(
        "[serverSession] session present but carries error flag:",
        sessionError,
        "→ user will be treated as unauthenticated; check OIDC refresh token / issuer logs",
      );
    }

    // Skip seeding a token we already know is dead — it would only produce a
    // guaranteed 401 on the next access-management call instead of letting the
    // session-error redirect (onSessionExpired / IGRPSessionWatcher) run first.
    if (session !== null && !sessionError) {
      igrpSetAccessClientConfig({
        token: session.accessToken as string,
        baseUrl: apiManagement,
      });
    }

    return session;
  } catch (error) {
    // Next.js static-render bailout: `headers()`/cookies were read during
    // prerender. This is control flow, not an error — re-throw so Next marks
    // the route dynamic. Swallowing it both masks the bailout as "no session"
    // and floods the error reporter at build time.
    if (
      error instanceof Error &&
      (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }

    // Only swallow the "no session / cookie decode failed" branch. Typed
    // IgrpError instances and IGRPAuthConfigError indicate config-level problems
    // and must surface so error boundaries can render a proper diagnosis.
    if (isIgrpError(error)) throw error;
    if (error instanceof Error && error.name === "IGRPAuthConfigError")
      throw error;
    // Surface the error name so the log distinguishes "JWE decryption failed
    // / cookie-decode failed" (recoverable — treat as no session) from less
    // obvious causes (e.g. JSON parse failures, network errors hitting the
    // session endpoint). Without this, every swallowed error reads the same.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[serverSession] swallowed error — returning null session:",
        error instanceof Error ? `${error.name}: ${error.message}` : error,
      );
    }
    reportError(error, { segment: "lib/auth.serverSession" });
    return null;
  }
}

/**
 * Gets the current session for layout use.
 * Redirects to /logout when token expired or refresh failed.
 * Returns null in preview mode.
 */
export async function getSession() {
  if (isAuthBypass()) return null;
  const session = await auth.getSession();
  // Seed the per-request access-client config so downstream consumers in the
  // same request (e.g. igrpGetClaims, server actions) can read the token.
  // Mirrors serverSession(); IGRPLayoutFull also seeds later but renders after
  // the (igrp) layout body where igrpGetClaims() runs.
  if (session) {
    igrpSetAccessClientConfig({
      token: (session.accessToken as string) ?? "",
      baseUrl: process.env.IGRP_ACCESS_MANAGEMENT_API || "",
    });
  }
  return session;
}
