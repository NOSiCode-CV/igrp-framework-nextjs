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
}

export { getToken, decode, encode } from 'next-auth/jwt';
