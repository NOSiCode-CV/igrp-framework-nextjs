"use server";

export { serverSession, getSession } from "@/lib/auth";

import { buildEndSessionUrl } from "@igrp/framework-next-auth/oidc";
import { auth } from "@/lib/auth";

/**
 * Returns the IdP end-session URL for RP-initiated logout, or null when:
 * - auth is disabled (AUTH_PROVIDER=none)
 * - no active session / idToken missing
 * - IdP discovery doc has no end_session_endpoint
 *
 * Must be called BEFORE signOut() — the access token is needed to build the URL.
 */
export async function getLogoutUrl(postLogoutRedirectUri: string): Promise<string | null> {
  const token = await auth.getAccessToken();
  if (!token) return null;
  return buildEndSessionUrl(token, process.env, postLogoutRedirectUri);
}
