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
 *
 * ## Why this restates the shapes instead of deriving them
 *
 * Deriving these from the exported `Session` / `JWT` interfaces
 * (`interface Session extends Pick<IGRPSession, …>`) looks like the obvious way
 * to stop the two declarations drifting, and it is wrong twice over:
 *
 * 1. Inside a merged interface group, an OWN member beats an inherited one.
 *    next-auth's `Session` already declares `user?: { name; email; image }`, so
 *    a `Pick<…, 'user'>` arriving through `extends` is silently discarded and
 *    `session.user.id` disappears from the augmented type — with no runtime
 *    symptom at all.
 * 2. `./session` aliases next-auth's `Session` as `DefaultSession` and extends
 *    it, so referring back to it from the augmentation is circular
 *    (TS2502).
 *
 * `DefaultSession` below is next-auth's own *un-augmented* base type, which is
 * what makes the `{ id?: string } & DefaultSession['user']` intersection safe.
 *
 * The drift these restatements risk is guarded by
 * `__tests__/types-augmentation.type-check.ts` — a compile-time test, because
 * no runtime test can observe a missing property on a type.
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
