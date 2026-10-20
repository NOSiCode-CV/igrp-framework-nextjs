'use client';

import type { ReactNode } from 'react';

import { usePermissions } from './use-permissions.js';

export interface IGRPAuthorizationProps {
  /** One permission, or several. */
  permission: string | string[];
  /** With an array: require all (default) or any. */
  mode?: 'all' | 'any';
  /** Rendered when denied. Defaults to nothing (unmount). */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Decides a permission list against the current claims.
 *
 * An EMPTY list is a denial in both modes. `[].every(...)` is `true`, so `all`
 * used to render gated children to everyone while `any` denied them — the two
 * modes disagreed, and the one that disagreed in the unsafe direction was the
 * default. For a gate, "no permission named" is not "no permission required".
 */
export function igrpIsAllowedBy(
  names: string[],
  mode: 'all' | 'any',
  isAllowed: (name: string) => boolean,
): boolean {
  if (names.length === 0) return false;
  return mode === 'any' ? names.some(isAllowed) : names.every(isAllowed);
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
  const allowed = igrpIsAllowedBy(names, mode, isAllowed);
  return <>{allowed ? children : fallback}</>;
}
