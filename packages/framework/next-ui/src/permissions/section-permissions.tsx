'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useOptionalSession } from '@igrp/framework-next-auth/client';
import type { IGRPClaimsState } from '@igrp/framework-next-auth/claims';

import { resolveLiveClaims } from './resolve-live-claims.js';

type PermissionsContextValue = {
  state: IGRPClaimsState;
  setState: (next: IGRPClaimsState) => void;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

/**
 * Seeds permission claims into client context, then keeps them live.
 *
 * `state` is the server-rendered `IGRPClaimsState` (from `igrpGetClaims()`) and
 * remains the SSR/initial value. Because that prop only ever arrives once per
 * full page load, the claims are additionally re-decoded from the live session
 * — see `resolveLiveClaims` for the three guards (no provider / loading /
 * non-JWT token) and why each is required.
 *
 * The session is read through `useOptionalSession()` from
 * `@igrp/framework-next-auth/client`, NOT `useSession()`, which throws without
 * a provider — this component works standalone today and must keep working.
 * That helper lives behind the auth package's client entry rather than here so
 * this package does not reach into `next-auth/react` directly.
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

  const sessionCtx = useOptionalSession();
  const status = sessionCtx?.status;
  const accessToken = (sessionCtx?.data as { accessToken?: string } | null | undefined)
    ?.accessToken;

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
