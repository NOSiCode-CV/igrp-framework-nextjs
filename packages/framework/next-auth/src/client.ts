'use client';

import { useSession as useSessionBase } from 'next-auth/react';
import type { Session } from './session';
export {
  AUTH_PROVIDER_IDS,
  AUTENTIKA_PROVIDER_ID,
  KEYCLOAK_PROVIDER_ID,
} from './providers';
export type { AuthProviderId } from './providers';

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
