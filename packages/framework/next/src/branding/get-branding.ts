import 'server-only';

import { igrpParseBranding } from '@igrp/framework-next-ui';
import type { IGRPBranding } from '@igrp/framework-next-types';
import {
  AccessManagementClient,
  GlobalConfigurationType,
} from '@igrp/platform-access-management-client-ts';

export const BRANDING_TTL_MS = 5 * 60_000;
export const BRANDING_RETRY_COOLDOWN_MS = 60_000;
export const BRANDING_FETCH_TIMEOUT_MS = 3_000;

type Entry = {
  value: IGRPBranding | null;
  fetchedAt: number;
  retryAfter: number;
  inflight?: Promise<void>;
};
const cache = new Map<string, Entry>();

export interface IGRPGetBrandingArgs {
  baseUrl: string;
  /** Signed-in user's access token. Absent on public pages, which never fetch. */
  token?: string;
  /** Epoch ms from the `igrp_brand_v` cookie. A value newer than the cache forces a refetch. */
  savedAt?: number;
  timeout?: number;
}

const statusOf = (error: unknown): number | undefined =>
  typeof error === 'object' && error !== null && 'status' in error
    ? (error as { status?: number }).status
    : undefined;

function store(key: string, next: Entry): void {
  cache.set(key, next);
}

async function refresh(key: string, args: IGRPGetBrandingArgs): Promise<void> {
  const client = AccessManagementClient.create({
    baseUrl: key,
    timeout: args.timeout ?? BRANDING_FETCH_TIMEOUT_MS,
    headers: { Authorization: `Bearer ${args.token}` },
  });
  try {
    const response = await client.globalConfiguration.getGlobalConfiguration(
      GlobalConfigurationType.ORGANIZATION,
    );
    const parsed = igrpParseBranding(response.data.config);
    if (parsed.dropped > 0) {
      console.warn(
        JSON.stringify({ event: 'igrp.branding.dropped_fields', count: parsed.dropped }),
      );
    }
    if (!parsed.branding) {
      console.warn(JSON.stringify({ event: 'igrp.branding.invalid_config' }));
    }
    store(key, { value: parsed.branding, fetchedAt: Date.now(), retryAfter: 0 });
  } catch (error) {
    const status = statusOf(error);
    if (status === 404) {
      store(key, { value: null, fetchedAt: Date.now(), retryAfter: 0 });
      return;
    }
    console.error(
      JSON.stringify({ event: 'igrp.branding.fetch_failed', status: status ?? 'network' }),
    );
    const previous = cache.get(key);
    store(key, {
      value: previous?.value ?? null,
      fetchedAt: previous?.fetchedAt ?? 0,
      retryAfter: Date.now() + BRANDING_RETRY_COOLDOWN_MS,
    });
  }
}

/**
 * The organization Brand for this request. Fresh entries are served from
 * memory. A stale or newer-than-cached entry is served with its previous value
 * while one background refresh runs. The first request on a process waits for
 * its fetch so the first paint is branded. Public requests never fetch.
 */
export async function igrpGetBranding(args: IGRPGetBrandingArgs): Promise<IGRPBranding | null> {
  const key = args.baseUrl;
  const entry = cache.get(key);
  if (!args.token) return entry?.value ?? null;

  const now = Date.now();
  const stale =
    !entry || now - entry.fetchedAt >= BRANDING_TTL_MS || (args.savedAt ?? 0) > entry.fetchedAt;
  if (!stale || (entry && now < entry.retryAfter)) return entry?.value ?? null;

  if (!entry) {
    await refresh(key, args);
    return cache.get(key)?.value ?? null;
  }
  if (!entry.inflight) {
    entry.inflight = refresh(key, args).finally(() => {
      const current = cache.get(key);
      if (current) current.inflight = undefined;
    });
  }
  return entry.value;
}

/** Drops the cached entry for `baseUrl`, or every entry when omitted. */
export function igrpInvalidateBranding(baseUrl?: string): void {
  if (baseUrl) cache.delete(baseUrl);
  else cache.clear();
}

/** Test seam: clears the cache between tests. */
export function igrpResetBrandingCache(): void {
  cache.clear();
}
