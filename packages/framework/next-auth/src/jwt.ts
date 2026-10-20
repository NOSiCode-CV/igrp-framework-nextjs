import type { User as NextAuthUser } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';
import type { SessionAuthProviderId } from './providers';

export interface JWT extends DefaultJWT {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  authProviderId?: SessionAuthProviderId;
  expiresAt?: number;
  // `(string & {})` keeps the literal visible in completions; a bare `| string`
  // collapses the union to `string` and loses it.
  error?: 'RefreshAccessTokenError' | (string & {});
  forceLogout?: boolean;
  user?: NextAuthUser;
  /**
   * The identity provider's OIDC `locale` claim, carried raw (`pt-CV`, `en`,
   * …). Seeded at sign-in from the provider profile, replaced by a client
   * `update({ locale })`. Normalisation and validation belong to
   * `@igrp/framework-next/i18n`, never here.
   */
  locale?: string;
}

export { getToken, decode, encode } from 'next-auth/jwt';
