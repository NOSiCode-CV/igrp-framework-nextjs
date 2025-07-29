import type { Session as DefaultSession, User as NextAuthUser } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';


export interface ExtendedSession extends DefaultSession {
  accessToken?: string;
  idToken?: string;
  expiresAt?: number;
  error?: string;
  user?: {
    id?: string;
  } & DefaultSession['user'];
}

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