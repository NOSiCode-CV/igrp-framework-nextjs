'use client';

// This entry is a real client boundary, not just a naming convention.
// `next-auth`'s own `react` entry (v4, CJS) ships no directive, so without
// this line the module graph below is server-first: importing
// `SessionProvider` or `useSafeSession` from a file that isn't already
// marked `'use client'` fails at render with a confusing RSC error instead
// of being handled by the bundler. Keep it as the first statement.

import { useSession as useSessionBase } from 'next-auth/react';
import type { Session } from './session';

export { AUTH_PROVIDER_IDS, IGRP_AUTH_PROVIDER_ID, NONE_PROVIDER_ID } from './providers';
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

// Force-logout on `session.error === 'RefreshAccessTokenError'` is owned
// by IGRPSessionWatcher (in @igrp/framework-next-ui), which is path-aware
// (doesn't bounce while already on /login or /logout) and routes to /logout
// for a clean IdP single-logout. Calling `signOut()` from a hook here in
// addition to the watcher caused two concurrent POST /api/auth/signout calls
// whenever a layout consumer mounted alongside the logout page, racing the
// page's own end-session redirect.
//
// `forceLogoutCallbackUrl` is kept in the type signature as a no-op for
// backwards-compatibility with existing call sites; new code should drop it.
export function useSafeSession(_options: { forceLogoutCallbackUrl?: string } = {}) {
  const { data, status, update } = useSessionBase();
  const session: Session | null = data as Session | null;
  return { session, status, update };
}
