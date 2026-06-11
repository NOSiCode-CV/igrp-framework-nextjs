import type { JWT } from './jwt';

/**
 * Pluggable store for rotated-refresh-token recovery.
 *
 * When the IdP rotates refresh tokens, a refresh that runs where the session
 * cookie cannot be persisted (an RSC render) rotates the token but loses the
 * result; the next session read replays the consumed refresh token and the
 * IdP rejects it with `invalid_grant`, logging the user out of a healthy
 * session. The recovery store remembers the rotated result, keyed by the
 * CONSUMED refresh token, for a short TTL so a later persist-capable read —
 * possibly on a DIFFERENT replica — can recover and persist it.
 *
 * The default is an in-memory, per-process store (single instance / sticky
 * routing). Multi-replica deployments without sticky sessions should supply a
 * shared implementation (see {@link createRedisTokenRecoveryStore}) via the
 * `tokenRecoveryStore` option of `withIGRPAuth`.
 *
 * Implementations must be resilient: callers treat a thrown error as a cache
 * miss, but well-behaved stores should not throw on routine operations.
 */
export type IGRPTokenRecoveryStore = {
  /** Returns the rotated JWT cached for a consumed refresh token, or null. */
  get(consumedRefreshToken: string): Promise<JWT | null>;
  /** Caches the rotated JWT keyed by the consumed refresh token for `ttlMs`. */
  set(consumedRefreshToken: string, result: JWT, ttlMs: number): Promise<void>;
};

const IN_MEMORY_MAX_ENTRIES = 5000;

type RecoveryEntry = { result: JWT; expiresAt: number };

/**
 * Default per-process store. Entries self-evict by TTL; when the map is full,
 * expired entries are swept and, failing that, the oldest insertion is dropped
 * (Map preserves insertion order). Reads never delete — both an RSC read and
 * the persisting poll may need the same entry before one of them persists it.
 */
export function createInMemoryTokenRecoveryStore(
  options: { maxEntries?: number } = {},
): IGRPTokenRecoveryStore {
  const maxEntries = options.maxEntries ?? IN_MEMORY_MAX_ENTRIES;
  const entries = new Map<string, RecoveryEntry>();

  function sweepExpired(now: number) {
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) entries.delete(key);
    }
  }

  return {
    async get(consumedRefreshToken) {
      const entry = entries.get(consumedRefreshToken);
      if (!entry) return null;
      if (entry.expiresAt <= Date.now()) {
        entries.delete(consumedRefreshToken);
        return null;
      }
      return entry.result;
    },
    async set(consumedRefreshToken, result, ttlMs) {
      const now = Date.now();
      // Overwriting an existing key never grows the map — only evict for net-new keys.
      if (!entries.has(consumedRefreshToken) && entries.size >= maxEntries) {
        sweepExpired(now);
        if (entries.size >= maxEntries) {
          const oldest = entries.keys().next().value;
          if (oldest !== undefined) entries.delete(oldest);
        }
      }
      entries.set(consumedRefreshToken, { result, expiresAt: now + ttlMs });
    },
  };
}

/**
 * Minimal redis-like client surface — matches node-redis v4 (`createClient()`)
 * out of the box. ioredis users: wrap it —
 * `{ get: (k) => redis.get(k), set: (k, v, o) => redis.set(k, v, 'PX', o.PX) }`.
 */
export type IGRPRedisLikeClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options: { PX: number }): Promise<unknown>;
};

/** SHA-256 hex via Web Crypto — avoids Node `crypto` so the module stays edge-safe. */
async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Shared recovery store backed by a redis-like client, for multi-replica
 * deployments without sticky sessions.
 *
 * Keys are `keyPrefix + sha256(consumedRefreshToken)` so raw refresh tokens
 * never appear as Redis keys. Values are JSON-serialized JWTs and DO contain
 * live tokens — point this at a trusted, access-controlled Redis only, and
 * keep the TTL short (the caller passes ~180s).
 */
export function createRedisTokenRecoveryStore(
  client: IGRPRedisLikeClient,
  options: { keyPrefix?: string } = {},
): IGRPTokenRecoveryStore {
  const keyPrefix = options.keyPrefix ?? 'igrp:oidc:rotated:';

  return {
    async get(consumedRefreshToken) {
      const key = keyPrefix + (await sha256Hex(consumedRefreshToken));
      const raw = await client.get(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as JWT;
      } catch {
        return null;
      }
    },
    async set(consumedRefreshToken, result, ttlMs) {
      const key = keyPrefix + (await sha256Hex(consumedRefreshToken));
      await client.set(key, JSON.stringify(result), { PX: ttlMs });
    },
  };
}
