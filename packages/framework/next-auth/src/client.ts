'use client';

import { useSession as useSessionBase } from 'next-auth/react';

export {
  SessionProvider,
  type SessionProviderProps,
  useSession,
  signIn,
  signOut,
  getCsrfToken,
  getProviders,  
} from 'next-auth/react';

export type { User } from 'next-auth';

export function useSafeSession() {
  const { data, status } = useSessionBase();
  return { session: data ?? null, status };
}