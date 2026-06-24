import { cache } from 'react';
import { forbidden } from 'next/navigation';
import {
  decodeIgrpClaims,
  claimsAllow,
  type IGRPAccessClaims,
  type IGRPClaimsState,
} from '@igrp/framework-next-auth/claims';

import { igrpGetAccessClientConfig } from './api-config';

const SUPER_ADMIN_MOCK: IGRPAccessClaims = { permissions: [], roles: [], isSuperAdmin: true };

/** True when auth is bypassed (preview mode or AUTH_PROVIDER=none). */
export function isIgrpAuthBypass(env: Record<string, string | undefined> = process.env): boolean {
  const preview =
    String(env.IGRP_PREVIEW_MODE ?? '')
      .trim()
      .replace(/^["']|["']$/g, '')
      .toLowerCase() === 'true';
  const noneProvider =
    String(env.AUTH_PROVIDER ?? '')
      .trim()
      .toLowerCase() === 'none';
  return preview || noneProvider;
}

/**
 * Resolve the current request's permission claims. Bypass → super-admin mock
 * (does NOT attempt to decode the non-JWT preview token). Otherwise decode the
 * per-request access token; a decode failure becomes a distinguishable error
 * state (never silently "no permissions"). Deduped per render via React.cache.
 */
export const igrpGetClaims = cache(async function igrpGetClaims(): Promise<IGRPClaimsState> {
  if (isIgrpAuthBypass()) {
    return { status: 'ok', claims: { ...SUPER_ADMIN_MOCK } };
  }
  try {
    const { token } = igrpGetAccessClientConfig();
    return { status: 'ok', claims: decodeIgrpClaims(token) };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'claims decode failed',
    };
  }
});

/** Boolean permission check (token claims). Fail-closed on error. */
export async function igrpAuthorize(name: string): Promise<boolean> {
  const state = await igrpGetClaims();
  return state.status === 'ok' && claimsAllow(state.claims, name);
}

/**
 * Page/render guard. Missing permission → forbidden() (403 → forbidden.tsx).
 * A claims decode error is NOT "forbidden" — it throws so the nearest
 * error.tsx renders a 5xx instead of mislabeling an outage as 403.
 */
export async function igrpAssertAuthorize(name: string): Promise<void> {
  const state = await igrpGetClaims();
  if (state.status === 'error') {
    throw new Error(`igrpAssertAuthorize: cannot determine permissions: ${state.error}`);
  }
  if (!claimsAllow(state.claims, name)) {
    forbidden();
  }
}
