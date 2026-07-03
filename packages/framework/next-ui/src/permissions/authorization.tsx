'use client';

import type { ReactNode } from 'react';

import { usePermissions } from './use-permissions';

export interface IGRPAuthorizationProps {
  /** One permission, or several. */
  permission: string | string[];
  /** With an array: require all (default) or any. */
  mode?: 'all' | 'any';
  /** Rendered when denied. Defaults to nothing (unmount). */
  fallback?: ReactNode;
  children: ReactNode;
}

/** Renders children only when the current user holds the permission(s). */
export function IGRPAuthorization({
  permission,
  mode = 'all',
  fallback = null,
  children,
}: IGRPAuthorizationProps) {
  const { isAllowed } = usePermissions();
  const names = Array.isArray(permission) ? permission : [permission];
  const allowed =
    mode === 'any' ? names.some((n) => isAllowed(n)) : names.every((n) => isAllowed(n));
  return <>{allowed ? children : fallback}</>;
}
