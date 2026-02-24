"use server";

import { igrpSetAccessClientConfig } from "@igrp/framework-next";
import { getServerSession, type Session } from "@igrp/framework-next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth-options";
import { AUTH_CONSTANTS } from "@/lib/constants";
import { EnvValidationError, logger } from "@/lib/errors";
import { validateEnv } from "@/lib/env";
import { isPreviewMode } from "@/lib/utils";

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
