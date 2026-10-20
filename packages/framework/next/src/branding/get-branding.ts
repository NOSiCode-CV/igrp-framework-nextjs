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
/** Max age of the `igrp_brand_v` cookie; an older value no longer forces a refetch. */
export const BRANDING_COOKIE_MAX_AGE_MS = 300_000;
/** Clock skew tolerated between the instance that saved and the one reading. */
const BRANDING_COOKIE_SKEW_MS = 30_000;

type Entry = {
  value: IGRPBranding | null;
  fetchedAt: number;
  retryAfter: number;
  /** Last `savedAt` that triggered a refetch; each cookie value is honoured once. */
  honoredSavedAt?: number;
};
const cache = new Map<string, Entry>();
/** One fetch per `baseUrl` at a time, cold or warm. */
const pending = new Map<string, Promise<void>>();

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

function store(key: string, next: Omit<Entry, 'honoredSavedAt'>): void {
  cache.set(key, { ...next, honoredSavedAt: cache.get(key)?.honoredSavedAt });
}

/**
 * Bounds the whole call, body included: the SDK's own timeout stops at the
 * response headers, so a stalled body would otherwise block the first render.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('igrp.branding.timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function refresh(key: string, args: IGRPGetBrandingArgs): Promise<void> {
  const timeout = args.timeout ?? BRANDING_FETCH_TIMEOUT_MS;
  const client = AccessManagementClient.create({
    baseUrl: key,
    timeout,
    headers: { Authorization: `Bearer ${args.token}` },
  });
  try {
    const response = await withTimeout(
      client.globalConfiguration.getGlobalConfiguration(GlobalConfigurationType.ORGANIZATION),
      timeout,
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

function startRefresh(key: string, args: IGRPGetBrandingArgs): Promise<void> {
  let running = pending.get(key);
  if (!running) {
    running = refresh(key, args).finally(() => pending.delete(key));
    pending.set(key, running);
  }
  return running;
}

/**
 * Whether the freshness cookie asks for a refetch: newer than the cache, not
 * already honoured, and plausible (not far in the future, not past its max age).
 * A forged or skewed value therefore costs at most one fetch.
 */
function cookieWantsRefetch(entry: Entry, savedAt: number | undefined, now: number): boolean {
  if (!savedAt || savedAt <= entry.fetchedAt || savedAt === entry.honoredSavedAt) return false;
  return savedAt <= now + BRANDING_COOKIE_SKEW_MS && now - savedAt <= BRANDING_COOKIE_MAX_AGE_MS;
}

/**
 * The organization Brand for this request. Fresh entries are served from
 * memory. A stale or newer-than-cached entry is served with its previous value
 * while one background refresh runs. The first request on a process waits for
 * its fetch so the first paint is branded; concurrent first requests share it.
 * Public requests never fetch.
 */
export async function igrpGetBranding(args: IGRPGetBrandingArgs): Promise<IGRPBranding | null> {
  const key = args.baseUrl;
  const entry = cache.get(key);
  if (!args.token) return entry?.value ?? null;

  if (!entry) {
    await startRefresh(key, args);
    return cache.get(key)?.value ?? null;
  }

  const now = Date.now();
  if (now < entry.retryAfter) return entry.value;
  const cookie = cookieWantsRefetch(entry, args.savedAt, now);
  if (!cookie && now - entry.fetchedAt < BRANDING_TTL_MS) return entry.value;

  if (cookie) entry.honoredSavedAt = args.savedAt;
  void startRefresh(key, args);
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
  pending.clear();
}
