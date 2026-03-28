import type { NextApiRequest } from "next";
import { cookies } from "next/headers";
import { refreshOidcAccessToken } from "@igrp/framework-next-auth";
import { getToken, type JWT } from "next-auth/jwt";

import { logger } from "@/lib/logger";

/**
 * Retrieves the JWT access token from cookies (NextAuth session).
 *
 * @returns The decoded JWT token or null if not authenticated
 */
export async function getAccessToken() {
  const cookieStore = await cookies();

  const token = await getToken({
    req: {
      cookies: Object.fromEntries(
        cookieStore.getAll().map((c) => [c.name, c.value]),
      ),
    } as NextApiRequest,
    secret: process.env.NEXTAUTH_SECRET || "",
  });

  return token;
}

/**
 * Refreshes the access token using the refresh token from Keycloak.
 *
 * ## Token refresh flow
 * 1. Validates Keycloak env vars (issuer, clientId, clientSecret)
 * 2. POSTs to Keycloak's OIDC token endpoint with grant_type=refresh_token
 * 3. On success: updates accessToken, expiresAt (ms), and refreshToken (if rotated)
 * 4. On failure: returns token with error flag; NextAuth will redirect to logout
 *
 * ## Keycloak response
 * - access_token: New access token
 * - expires_in: Seconds until expiry (converted to ms for expiresAt)
 * - refresh_token: Optional; Keycloak may rotate it (we keep old if not returned)
 *
 * @param token - The JWT token containing the refresh token
 * @returns Promise with refreshed token data or token with error flag
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    return await refreshOidcAccessToken(token, process.env);
  } catch (error) {
    logger.error("[Auth] Error refreshing token", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}
