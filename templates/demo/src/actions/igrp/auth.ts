"use server";

import { igrpSetAccessClientConfig } from "@igrp/framework-next";
import { getServerSession, type Session } from "@igrp/framework-next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth-options";
import { AUTH_CONSTANTS } from "@/lib/constants";
import { validateEnv } from "@/lib/env";
import { EnvValidationError, logger } from "@/lib/errors";
import { isPreviewMode } from "@/lib/utils";

/**
 * Gets the server-side session from NextAuth.
 * Validates env, configures access client when session exists.
 *
 * @returns Session or null; throws EnvValidationError in production when vars missing
 */
export async function serverSession(): Promise<Session | null> {
  const apiManagement = process.env.IGRP_ACCESS_MANAGEMENT_API || "";

  try {
    validateEnv();

    const session = await getServerSession(authOptions);

    if (session !== null) {
      igrpSetAccessClientConfig({
        token: session.accessToken as string,
        baseUrl: apiManagement,
      });
    }
    return session;
  } catch (error) {
    if (error instanceof EnvValidationError) {
      logger.error("[Auth] Environment validation failed", error, {
        missingVars: error.missingVars,
      });
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
      return null;
    }
    logger.error("[Auth] Getting server session failed", error);
    return null;
  }
}

/**
 * Gets the current session for layout. Redirects to /logout when token expired.
 *
 * Token refresh is triggered by getServerSession → JWT callback (auth-options).
 * If refresh fails, session.error is set; we redirect to /logout to clear cookies.
 *
 * @returns Session or null; redirects to /logout if refresh failed or expired
 */
export async function getSession(): Promise<Session | null> {
  if (isPreviewMode()) return null;

  let session: Session | null;
  try {
    session = await serverSession();
    if (!session) return session;

    const now =
      Math.floor(Date.now() / 1000) + AUTH_CONSTANTS.TOKEN_EXPIRY_BUFFER_SEC;

    const providerExp =
      typeof session.expiresAt === "number" ? session.expiresAt : undefined;
    const providerExpired = providerExp !== undefined && providerExp < now;
    const refreshFailed = session.error === "RefreshAccessTokenError";

    if (providerExpired || refreshFailed) {
      redirect("/logout");
    }
  } catch (error) {
    logger.error("Failed to get session in layout", error);
    session = null;
  }

  return session;
}
