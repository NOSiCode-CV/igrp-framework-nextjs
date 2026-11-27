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
/** Minimum gap between cookie-driven refetches, so a cookie that changes every request cannot keep one in flight. */
const BRANDING_COOKIE_REFETCH_FLOOR_MS = 5_000;

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
/** Bumped by `igrpInvalidateBranding`; a fetch started before the bump never writes. */
const generation = new Map<string, number>();

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
  // The response reflects AM as of the request, not its arrival: a save that
  // lands while this fetch runs must still read as newer than the cache.
  const startedAt = Date.now();
  const startGeneration = generation.get(key);
  const save = (next: Omit<Entry, 'honoredSavedAt'>) => {
    if (generation.get(key) === startGeneration) store(key, next);
  };
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
    save({ value: parsed.branding, fetchedAt: startedAt, retryAfter: 0 });
  } catch (error) {
    const status = statusOf(error);
    if (status === 404) {
      save({ value: null, fetchedAt: startedAt, retryAfter: 0 });
      return;
    }
    console.error(
      JSON.stringify({ event: 'igrp.branding.fetch_failed', status: status ?? 'network' }),
    );
    const previous = cache.get(key);
    save({
      value: previous?.value ?? null,
      fetchedAt: previous?.fetchedAt ?? 0,
      retryAfter: Date.now() + BRANDING_RETRY_COOLDOWN_MS,
    });
  }
}

function startRefresh(key: string, args: IGRPGetBrandingArgs): Promise<void> {
  const running = pending.get(key);
  if (running) return running;
  const started: Promise<void> = refresh(key, args).finally(() => {
    // An invalidate may have replaced this fetch with a newer one.
    if (pending.get(key) === started) pending.delete(key);
  });
  pending.set(key, started);
  return started;
}

/**
 * Whether the freshness cookie asks for a refetch: newer than the cache, not
 * already honoured, plausible (not far in the future, not past its max age),
 * and the last fetch is at least BRANDING_COOKIE_REFETCH_FLOOR_MS old. A cookie
 * value that changes on every request therefore costs at most one fetch per
 * floor interval per process.
 */
function cookieWantsRefetch(entry: Entry, savedAt: number | undefined, now: number): boolean {
  if (!savedAt || savedAt <= entry.fetchedAt || savedAt === entry.honoredSavedAt) return false;
  if (now - entry.fetchedAt < BRANDING_COOKIE_REFETCH_FLOOR_MS) return false;
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

/**
 * Drops the cached entry for `baseUrl`, or every entry when omitted, and
 * discards a fetch already running for it: that fetch may predate the save.
 */
export function igrpInvalidateBranding(baseUrl?: string): void {
  for (const key of baseUrl ? [baseUrl] : [...pending.keys()]) {
    generation.set(key, (generation.get(key) ?? 0) + 1);
    pending.delete(key);
  }
  if (baseUrl) cache.delete(baseUrl);
  else cache.clear();
}

/** Test seam: clears the cache between tests. */
export function igrpResetBrandingCache(): void {
  cache.clear();
  pending.clear();
}
