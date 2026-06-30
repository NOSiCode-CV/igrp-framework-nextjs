'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { IGRPClaimsState } from '@igrp/framework-next-auth/claims';

type PermissionsContextValue = {
  state: IGRPClaimsState;
  setState: (next: IGRPClaimsState) => void;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

/**
 * Seeds permission claims into client context. Server-rendered parent passes
 * the decoded `IGRPClaimsState` (from `igrpGetClaims()`) as `state`. Held in
 * local state so it can be updated client-side later (Phase 2 role switch).
 */
export function IGRPSectionPermissions({
  state: initialState,
  children,
}: {
  state: IGRPClaimsState;
  children: ReactNode;
}) {
  const [state, setState] = useState<IGRPClaimsState>(initialState);
  return (
    <PermissionsContext.Provider value={{ state, setState }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within <IGRPSectionPermissions>');
  }
  return ctx;
}
