'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { SessionContext } from 'next-auth/react';
import type { IGRPClaimsState } from '@igrp/framework-next-auth/claims';

import { resolveLiveClaims, type LiveClaimsSession } from './resolve-live-claims';

type PermissionsContextValue = {
  state: IGRPClaimsState;
  setState: (next: IGRPClaimsState) => void;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

/**
 * Stand-in used when `next-auth/react` did not create its context (it declares
 * it with an optional-call `createContext?.(…)`, so it can be undefined). Keeps
 * the `useContext` call unconditional — a hook must never be called
 * conditionally.
 */
const NoSessionContext = createContext<unknown>(undefined);

/**
 * Seeds permission claims into client context, then keeps them live.
 *
 * `state` is the server-rendered `IGRPClaimsState` (from `igrpGetClaims()`) and
 * remains the SSR/initial value. Because that prop only ever arrives once per
 * full page load, the claims are additionally re-decoded from the live session
 * — see `resolveLiveClaims` for the three guards (no provider / loading /
 * non-JWT token) and why each is required.
 *
 * `setState` sets an explicit override that wins over both the seed and the
 * live decode. It is the seam for a future active-role switch; nothing consumes
 * it today.
 */
export function IGRPSectionPermissions({
  state: seeded,
  children,
}: {
  state: IGRPClaimsState;
  children: ReactNode;
}) {
  const [override, setOverride] = useState<IGRPClaimsState | null>(null);

  // Read the session context DIRECTLY. `useSession()` throws
  // ("must be wrapped in a <SessionProvider />") when no provider is mounted,
  // which would turn a standalone-capable component into one with a hard
  // precondition — a breaking change for existing consumers. `useSafeSession`
  // is not safe either: it delegates straight to the same hook.
  const sessionCtx = useContext((SessionContext ?? NoSessionContext) as typeof NoSessionContext) as
    | { data?: { accessToken?: string } | null; status?: LiveClaimsSession['status'] }
    | null
    | undefined;

  const status = sessionCtx?.status;
  const accessToken = sessionCtx?.data?.accessToken;

  const live = useMemo(
    () =>
      resolveLiveClaims({
        seeded,
        session: status ? { status, accessToken } : null,
      }),
    [seeded, status, accessToken],
  );

  const value = useMemo<PermissionsContextValue>(
    () => ({ state: override ?? live, setState: setOverride }),
    [override, live],
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissionsContext(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within <IGRPSectionPermissions>');
  }
  return ctx;
}
