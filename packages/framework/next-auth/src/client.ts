// ─────────────────────────────────────────────────────────────────────────────
// THIS FILE DELIBERATELY HAS NO `'use client'` DIRECTIVE.
//
// The shipped `dist/client.js` DOES have one — `tsup.config.ts` injects it in
// an `onSuccess` hook after bundling. Declaring it here as well achieved
// nothing (esbuild strips module-level directives when bundling) except a
// warning on every single build that reads as though the client boundary were
// broken:
//
//   dist/client.js (1:0): Module level directives cause errors when bundled,
//   "use client" in "dist/client.js" was ignored.
//
// This entry IS a real client boundary, not a naming convention: `next-auth`'s
// own `react` entry (v4, CJS) carries no directive either, so without the
// injected one the graph below is server-first and importing `SessionProvider`
// or `useSafeSession` from a file that is not already a client component fails
// at render with a confusing RSC error.
//
// The single source of truth is therefore the build, and it is enforced by
// `__tests__/dist-contract.test.ts`, which asserts the directive on the real
// output. That test is also what protects this arrangement: if anyone later
// replaces the hook with a directive-PRESERVING plugin, there will be no
// directive here to preserve and the test fails loudly rather than shipping a
// silently server-first entry.
// ─────────────────────────────────────────────────────────────────────────────

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
