import type { User as NextAuthUser } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';
import type { AuthProviderId } from './providers';

export interface JWT extends DefaultJWT {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  authProviderId?: AuthProviderId;
  expiresAt?: number;
  error?: 'RefreshAccessTokenError' | string;
  forceLogout?: boolean;
  user?: NextAuthUser;
}

export { getToken, decode, encode } from 'next-auth/jwt';
