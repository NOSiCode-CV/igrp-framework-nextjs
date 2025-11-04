'use client';

import { useSession as useSessionBase } from 'next-auth/react';
import type { Session } from './session';

export {
  SessionProvider,
  type SessionProviderProps,
  useSession,
  signIn,
  signOut,
  getCsrfToken,
  getProviders,
  getSession,
} from 'next-auth/react';

export type { User } from 'next-auth';

export function useSafeSession() {
  const { data, status, update } = useSessionBase();
  const session: Session | null = data as Session | null;
  return { session, status, update };
}
