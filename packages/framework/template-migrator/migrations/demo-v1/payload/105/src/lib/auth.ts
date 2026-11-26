import { igrpEnsureAccessClientConfig } from "@igrp/framework-next";
import { isIgrpError } from "@igrp/framework-next/errors";
import { assertAuthProviderEnv } from "@igrp/framework-next-auth/providers";
import { isNextControlFlowError } from "@igrp/framework-next-auth/runtime";

import { auth } from "@/lib/auth-instance";
import { reportError } from "@/lib/report-error";
import { isAuthBypass } from "@/lib/utilities";

// The auth instance itself lives in `lib/auth-instance.ts` so middleware (Edge
// runtime) can import it without pulling in the Node-only session helpers
// below. Everything else keeps importing from here — the public surface of
// this module is unchanged.
export { auth, PREVIEW_SESSION_STUB } from "@/lib/auth-instance";

/**
 * Gets the server-side session from NextAuth.
 * Validates env, configures the IGRP access client when a session exists.
 *
 * @returns Session or null
 */
export async function serverSession() {
  // A missing NEXTAUTH_SECRET is checked by the framework: auth.serverSession()
  // throws IGRPAuthConfigError (AUTH_SECRET_MISSING) in production.
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
      await igrpEnsureAccessClientConfig({
        token: (session.accessToken as string) ?? "",
      });
    }

    return session;
  } catch (error) {
    // Next.js static-render bailout: `headers()`/cookies were read during
    // prerender. This is control flow, not an error — re-throw so Next marks
    // the route dynamic. Swallowing it both masks the bailout as "no session"
    // and floods the error reporter at build time.
    if (isNextControlFlowError(error)) throw error;

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
  // This seed does not reach the (igrp) layout: a value set after an await stays
  // in this function's async context. igrpGetClaims() gets the refreshed token
  // through the session read that withIGRPAuth registers. The base URL comes
  // from IGRP_ACCESS_MANAGEMENT_API.
  if (session) {
    await igrpEnsureAccessClientConfig({
      token: (session.accessToken as string) ?? "",
    });
  }
  return session;
}
