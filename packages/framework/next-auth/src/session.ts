import type { NextAuthOptions, TokenSet } from 'next-auth';
import type { Session as DefaultSession } from 'next-auth';
import type { SessionAuthProviderId } from './providers';

export type { NextAuthOptions, TokenSet };

/**
 * IGRP session shape. Intentionally carries `accessToken` to the client (the
 * browser-side Access Management client reads `session.accessToken`);
 * `refreshToken` and `idToken` stay in the JWT (read them server-side with
 * `getAccessToken()`).
 *
 * SECURITY: the access token is readable over the unauthenticated-to-JS
 * `/api/auth/session` endpoint and via `useSession()`/`getSession()`. NEVER log
 * or serialize the session object client-side, and error/telemetry pipelines
 * MUST redact it — an XSS otherwise exfiltrates a bearer token, not just a cookie.
 */
export interface Session extends DefaultSession {
  accessToken?: string;
  /** @deprecated No longer populated on the session; read `idToken` from the JWT (`getAccessToken()`). */
  idToken?: string;
  authProviderId?: SessionAuthProviderId;
  error?: string;
  expiresAt?: number;
  forceLogout?: boolean;
  user?: {
    id?: string;
    /** The OIDC `locale` claim, raw. Mirrors `JWT.locale`. */
    locale?: string;
  } & DefaultSession['user'];
}

/**
 * Narrows to a session that actually carries a usable `accessToken`.
 *
 * Checks the VALUE, not just the key: the previous `'accessToken' in s` test
 * asserted `s is Session` for any object that merely had the property — a
 * `{ accessToken: undefined }` placeholder included — so callers got a
 * non-optional-looking token that was empty at runtime.
 */
export function hasAccessToken(s: unknown): s is Session & { accessToken: string } {
  if (typeof s !== 'object' || s === null) return false;
  const accessToken = (s as { accessToken?: unknown }).accessToken;
  return typeof accessToken === 'string' && accessToken.length > 0;
}
