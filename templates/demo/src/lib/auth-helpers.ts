import type { NextApiRequest } from "next";
import { cookies } from "next/headers";
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
    const issuer = process.env.KEYCLOAK_ISSUER;
    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

    if (!issuer || !clientId || !clientSecret) {
      logger.error("[Auth] Missing Keycloak configuration for token refresh");
      return { ...token, error: "RefreshAccessTokenError" };
    }

    const refreshResponse = await fetch(
      `${issuer}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken || "",
        }),
      },
    );

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      logger.error("[Auth] Failed to refresh token", undefined, {
        status: refreshResponse.status,
        errorText,
      });
      return { ...token, error: "RefreshAccessTokenError" };
    }

    const refreshed = await refreshResponse.json();

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Date.now() + (refreshed.expires_in || 3600) * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    logger.error("[Auth] Error refreshing token", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}
