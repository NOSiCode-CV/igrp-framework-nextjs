'use client';

import type { ReactNode } from 'react';

import { IGRPForbidden } from './forbidden';
import { usePermissions } from './use-permissions';

/**
 * Client-side page convenience guard. Renders IGRPForbidden when denied.
 * NOTE: the authoritative page gate is the server-side `igrpAssertAuthorize`;
 * use this only for client-rendered pages.
 */
export function IGRPGuardPage({
  permission,
  children,
}: {
  /** All listed permissions must be held. Use <IGRPAuthorization mode="any"> for any-of semantics. */
  permission: string | string[];
  children: ReactNode;
}) {
  const { can } = usePermissions();
  const names = Array.isArray(permission) ? permission : [permission];
  const allowed = names.every((n) => can(n));
  return <>{allowed ? children : <IGRPForbidden />}</>;
}
