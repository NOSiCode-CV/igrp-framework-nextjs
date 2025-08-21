'use client';

import { useSession as useSessionBase } from 'next-auth/react';
import type { Session as DefaultSession, User as NextAuthUser } from 'next-auth';

export {
  SessionProvider,
  type SessionProviderProps,
  useSession,
  signIn,
  signOut,
  getCsrfToken,
  getProviders,  
} from 'next-auth/react';

export type { Session, User } from 'next-auth';


export function useSafeSession() {
  const { data, status } = useSessionBase();
  return { session: data ?? null, status };
}

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