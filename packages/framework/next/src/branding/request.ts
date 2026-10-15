import 'server-only';

import { cookies } from 'next/headers';

import type { IGRPBranding, IGRPConfigArgs } from '@igrp/framework-next-types';

import { igrpGetBranding } from './get-branding.js';
import { resolveBrandingToken } from './token.js';

export const BRAND_FRESHNESS_COOKIE = 'igrp_brand_v';

/**
 * The Brand for the current request, or `null` when the flag is off, preview
 * mode is on, or the Brand is absent. When the flag is off this returns before
 * touching cookies or the network.
 */
export async function igrpResolveRequestBranding(config: IGRPConfigArgs): Promise<IGRPBranding | null> {
  if (config.branding?.enabled !== true || config.previewMode) return null;
  const store = await cookies();
  const savedAt = Number(store.get(BRAND_FRESHNESS_COOKIE)?.value ?? 0);
  return igrpGetBranding({
    baseUrl: config.apiManagementConfig?.baseUrl ?? '',
    token: resolveBrandingToken(config),
    savedAt: Number.isFinite(savedAt) ? savedAt : 0,
  });
}
