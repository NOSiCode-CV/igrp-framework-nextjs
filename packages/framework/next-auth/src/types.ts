import type { DefaultSession, User as NextAuthUser } from 'next-auth';
import type { AuthProviderId } from './providers';

/**
 * Module augmentation for next-auth.
 *
 * Consumers of @igrp/framework-next-auth do NOT need to write their own
 * types/next-auth.d.ts. Simply include this file in your tsconfig:
 *
 * ```json
 * {
 *   "include": [
 *     "node_modules/@igrp/framework-next-auth/dist/types.d.ts"
 *   ]
 * }
 * ```
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    idToken?: string;
    authProviderId?: AuthProviderId;
    error?: string;
    expiresAt?: number;
    forceLogout?: boolean;
    user?: {
      id?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    authProviderId?: AuthProviderId;
    expiresAt?: number;
    error?: 'RefreshAccessTokenError' | string;
    forceLogout?: boolean;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & NextAuthUser;
  }
}

export {};
