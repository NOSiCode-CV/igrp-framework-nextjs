import type { User as NextAuthUser } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';

export interface ExtendedJWT extends DefaultJWT {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  error?: 'RefreshAccessTokenError' | string;
  user?: {
    id?: string;
  } & NextAuthUser;
}

export { getToken, decode, encode } from 'next-auth/jwt';
export type { JWT } from 'next-auth/jwt';
