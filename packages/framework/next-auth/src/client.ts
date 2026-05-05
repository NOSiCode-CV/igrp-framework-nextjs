import { useSession as useSessionBase, signOut } from 'next-auth/react';
import { useEffect, useRef } from 'react';
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

export function useSafeSession({
  forceLogoutCallbackUrl = '/login',
}: { forceLogoutCallbackUrl?: string } = {}) {
  const { data, status, update } = useSessionBase();
  const session: Session | null = data as Session | null;
  const signingOut = useRef(false);

  // When the server sets forceLogout (refresh token expired or failed),
  // the next session poll delivers it here. Sign out immediately so the
  // user is redirected to /login without needing to navigate.
  // signingOut guard prevents double calls if the session refetches
  // between signOut and redirect completing.
  useEffect(() => {
    if (!signingOut.current && (session?.forceLogout || session?.error === 'RefreshAccessTokenError')) {
      signingOut.current = true;
      void signOut({ callbackUrl: forceLogoutCallbackUrl });
    }
  }, [session?.forceLogout, session?.error, forceLogoutCallbackUrl]);

  return { session, status, update };
}
