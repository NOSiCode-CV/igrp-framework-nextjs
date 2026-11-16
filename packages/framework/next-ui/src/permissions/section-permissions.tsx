'use client';

import { createContext, use, useMemo, useState, type ReactNode } from 'react';
import { useIGRPSession } from '@igrp/framework-next-auth/client';
import type { IGRPClaimsState } from '@igrp/framework-next-auth/claims';

import { resolveLiveClaims, type LiveClaimsSession } from './resolve-live-claims.js';

type PermissionsContextValue = {
  state: IGRPClaimsState;
  /**
   * @deprecated Nothing consumes it and it is not a supported way to change
   * claims; it will be removed. Claims follow the session — refresh it instead.
   */
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
 * The session is read through `useIGRPSession()` from
 * `@igrp/framework-next-auth/client`, NOT `useSession()`, which throws without
 * a provider — this component works standalone today and must keep working.
 * That helper lives behind the auth package's client entry rather than here so
 * this package does not reach into `next-auth/react` directly.
 *
 * `setState` (deprecated) sets an explicit override that wins over both the
 * seed and the live decode; nothing consumes it.
 */
export function IGRPSectionPermissions({
  state: seeded,
  children,
}: {
  state: IGRPClaimsState;
  children: ReactNode;
}) {
  const [override, setOverride] = useState<IGRPClaimsState | null>(null);

  const session = useIGRPSession();
  const status = session?.state.status;
  const accessToken = session?.state.accessToken;

  // Last settled session, tracked during render (no effect) so a refetch that
  // flips `status` back to `loading` keeps gating on the live claims.
  const [lastSettled, setLastSettled] = useState<LiveClaimsSession | null>(null);
  if (
    status &&
    status !== 'loading' &&
    (status !== lastSettled?.status || accessToken !== lastSettled?.accessToken)
  ) {
    setLastSettled({ status, accessToken });
  }
  // Only read while loading, so recording a settled session does not rebuild `live`.
  const settledWhileLoading = status === 'loading' ? lastSettled : null;

  const live = useMemo(
    () =>
      resolveLiveClaims({
        seeded,
        session: status ? { status, accessToken } : null,
        lastSettled: settledWhileLoading,
      }),
    [seeded, status, accessToken, settledWhileLoading],
  );

  const value = useMemo<PermissionsContextValue>(
    () => ({ state: override ?? live, setState: setOverride }),
    [override, live],
  );

  return <PermissionsContext value={value}>{children}</PermissionsContext>;
}

export function usePermissionsContext(): PermissionsContextValue {
  const ctx = use(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within <IGRPSectionPermissions>');
  }
  return ctx;
}
