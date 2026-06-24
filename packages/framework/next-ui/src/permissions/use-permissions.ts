'use client';

import { claimsAllow } from '@igrp/framework-next-auth/claims';

import { usePermissionsContext } from './section-permissions';

/** Read permission claims from context. `can(name)` follows the matching rule. */
export function usePermissions() {
  const { state } = usePermissionsContext();
  const ok = state.status === 'ok';
  return {
    can: (name: string): boolean => ok && claimsAllow(state.claims, name),
    permissions: ok ? state.claims.permissions : [],
    roles: ok ? state.claims.roles : [],
    selectedRole: ok ? state.claims.selectedRole : undefined,
    isSuperAdmin: ok ? state.claims.isSuperAdmin : false,
    status: state.status,
    error: state.status === 'error' ? state.error : undefined,
  };
}
