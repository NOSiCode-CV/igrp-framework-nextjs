import type { AuthOptions } from "next-auth";
import {
  createAuthProviderFromEnv,
  getAuthProviderIdFromEnv,
} from "@igrp/framework-next-auth";
import { refreshAccessToken } from "./auth-helpers";
import { sanitizeRedirectUrl } from "./sanitize";

export const authOptions: AuthOptions = {
  // Secure cookies in production (HTTPS only); allow HTTP in development
  useSecureCookies: process.env.NODE_ENV === "production",

  providers: [createAuthProviderFromEnv(process.env)],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    /**
     * JWT callback: runs on every request. Handles token storage and refresh.
     *
     * Flow:
     * 1. Initial sign-in (account present): store access_token, expires_at (ms), refresh_token
     * 2. Token still valid (expiresAt > now): return cached token
     * 3. Token expired: call refreshAccessToken; returns new token or token with error
     *
     * When error is set, session callback propagates it; layout redirects to /logout.
     */
    async jwt({ token, account }) {
      if (account) {
        token.authProviderId = getAuthProviderIdFromEnv(process.env);
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000;
        token.refreshToken = account.refresh_token;
      }

      if (token.expiresAt && Date.now() < token.expiresAt) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        session.idToken = token.idToken;
        session.authProviderId = token.authProviderId;
        session.error = token.error;
      }
      return session;
    },
    async redirect({ url }) {
      const nextInternalUrl = process.env.NEXTAUTH_URL_INTERNAL || "";
      const igrpAppHomeSlug = process.env.NEXT_PUBLIC_IGRP_APP_HOME_SLUG || "";
      const redirectTo = `${nextInternalUrl}${igrpAppHomeSlug}`;

      if (nextInternalUrl) return redirectTo;

      // Sanitize user-provided redirect URL to prevent open redirect
      return sanitizeRedirectUrl(url, process.env.NEXTAUTH_URL, "/");
    },
  },
};
