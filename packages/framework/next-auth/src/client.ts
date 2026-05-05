import { useSession as useSessionBase, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import type { Session } from './session';

export {
  AUTH_PROVIDER_IDS,
  IGRP_AUTH_PROVIDER_ID,
  NONE_PROVIDER_ID,
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

  // When the server sets forceLogout (refresh token expired or failed),
  // the next session poll delivers it here. Sign out immediately so the
  // user is redirected to /login without needing to navigate.
  useEffect(() => {
    if (session?.forceLogout || session?.error === 'RefreshAccessTokenError') {
      void signOut({ callbackUrl: '/login' });
    }
  }, [session?.forceLogout, session?.error]);

  return { session, status, update };
}
