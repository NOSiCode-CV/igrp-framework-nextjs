'use client';

import type { ReactNode } from 'react';

import { IGRPForbidden, type IGRPForbiddenProps } from './forbidden.js';
import { igrpIsAllowedBy } from './authorization.js';
import { usePermissions } from './use-permissions.js';

/**
 * Client-side page convenience guard. Renders IGRPForbidden when denied.
 * NOTE: the authoritative page gate is the server-side `igrpAssertAuthorize`;
 * use this only for client-rendered pages.
 */
export interface IGRPGuardPageProps {
  /** All listed permissions must be held. Use <IGRPAuthorization mode="any"> for any-of semantics. */
  permission: string | string[];
  /**
   * Props forwarded to the built-in 403 screen. Without this its pt-PT copy was
   * unreachable through the guard, even though `IGRPForbidden` exposes it.
   */
  forbiddenProps?: IGRPForbiddenProps;
  /** Replaces the 403 screen entirely. Wins over `forbiddenProps`. */
  fallback?: ReactNode;
  children: ReactNode;
}

export function IGRPGuardPage({
  permission,
  forbiddenProps,
  fallback,
  children,
}: IGRPGuardPageProps) {
  const { isAllowed } = usePermissions();
  const names = Array.isArray(permission) ? permission : [permission];
  // Shares IGRPAuthorization's decision, empty-list denial included.
  const allowed = igrpIsAllowedBy(names, 'all', isAllowed);
  if (allowed) return <>{children}</>;
  return <>{fallback ?? <IGRPForbidden {...forbiddenProps} />}</>;
}
