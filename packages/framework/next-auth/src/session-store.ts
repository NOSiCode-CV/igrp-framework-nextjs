// ─────────────────────────────────────────────────────────────────────────────
// @igrp/framework-next-auth/session-store
//
// Server-side storage for the session's token material, so the session COOKIE
// carries only an opaque id plus the few claims middleware needs.
//
// Edge-safe: imports only `next-auth/jwt` (jose) and pure local modules. The
// store IMPLEMENTATION is the consumer's, and is expected to be registered from
// Node-only code (`instrumentation.ts`), never from a module middleware loads.
// ─────────────────────────────────────────────────────────────────────────────

import { decode as nextAuthDecode, encode as nextAuthEncode } from 'next-auth/jwt';
import type { JWTDecodeParams, JWTEncodeParams } from 'next-auth/jwt';

import { globalSlot, warnOnce } from './_global-state';
import type { JWT } from './jwt';

/**
 * Key/value store holding each session's token material.
 *
 * WHY this exists: a NextAuth JWT session keeps the access, refresh and id
 * tokens inside the encrypted session cookie, 3–4 KB per app. Co-hosted apps
 * share the browser's cookie jar, and a root-path app's cookie (`Path=/`)
 * reaches every app on the host, so a request to one app routinely carried
 * 8 KB of cookies — the default request-header ceiling of nginx
 * (`large_client_header_buffers 4 8k`), Apache and Tomcat, answered with
 * `400 Request Header Or Cookie Too Large`. With a store the cookie is a few
 * hundred bytes whatever the token size, permission count or number of apps.
 *
 * Values are opaque strings that are ALREADY ENCRYPTED with the app's
 * `NEXTAUTH_SECRET` (a JWE, under a salt distinct from the cookie's), so a
 * store never holds bearer material in plaintext. Keys are random session ids
 * that only ever travel inside the encrypted cookie.
 *
 * Implementations must be shared by every replica of the app (Redis, a
 * database…), and must expire entries on `ttlSeconds`. Thrown errors are
 * handled: a failed `set` falls back to a full cookie for that response, a
 * failed `get` reads as "no session".
 */
export type IGRPSessionStore = {
  /** The stored value for `key`, or `null` when absent or expired. */
  get(key: string): Promise<string | null>;
  /** Stores `value` under `key`, replacing any previous value, for `ttlSeconds`. */
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  /** Removes `key`. Called on sign-out, so a signed-out session id stops resolving. */
  delete(key: string): Promise<void>;
  /**
   * OPTIONAL cross-replica mutex, used to let only one replica refresh a
   * session at a time (see {@link refreshUnderSessionLock}). Sets `key` to
   * `owner` only if `key` is absent, expiring after `ttlMs`; resolves `true`
   * when this call took the lock. On Redis: `SET key owner NX PX ttlMs`.
   *
   * Implement both lock methods or neither. Without them refresh behaves as it
   * always did: concurrent replicas may each spend the same refresh token.
   */
  acquireLock?(key: string, owner: string, ttlMs: number): Promise<boolean>;
  /**
   * Releases `key` ONLY if it still holds `owner` — a lock that expired and was
   * re-taken by another replica must not be released by the late first owner.
   * On Redis this needs an atomic compare-and-delete (a Lua script).
   */
  releaseLock?(key: string, owner: string): Promise<void>;
};

/**
 * Field on the cookie's JWT that names the store entry. Its presence is what
 * marks a cookie as store-backed; a cookie without it is a full, self-contained
 * session (written before a store was configured) and is read as-is.
 */
export const SESSION_ID_CLAIM = 'igrpSid';

/** Prefix of every store key, so a store shared with other data stays readable. */
export const SESSION_STORE_KEY_PREFIX = 'igrp:session:';

/**
 * Salt for the store value's encryption key. Distinct from the cookie's (empty)
 * salt, so a stored value can never be replayed as a session cookie, nor a
 * cookie decoded as a stored value.
 */
const STORE_VALUE_SALT = 'igrp.session-store';

/** NextAuth's own default session lifetime, used when `maxAge` is not passed. */
const DEFAULT_MAX_AGE_S = 30 * 24 * 60 * 60;

/**
 * Token fields that move to the store. These are the bulk of the cookie.
 *
 * `expiresAt`, `error` and `forceLogout` are stored AND kept in the cookie:
 * Edge middleware cannot reach the store and needs them to decide whether to
 * bounce a request to /login, while the stored copy is authoritative for every
 * Node read (a refresh inside an RSC render updates the store even though it
 * cannot rewrite the cookie).
 */
const STORED_FIELDS = [
  'accessToken',
  'refreshToken',
  'idToken',
  'expiresAt',
  'error',
  'forceLogout',
] as const;
const COOKIE_ONLY_EXCLUDED = new Set<string>(['accessToken', 'refreshToken', 'idToken']);

type StoredFields = Pick<JWT, (typeof STORED_FIELDS)[number]>;

// ─── Registration ────────────────────────────────────────────────────────────

const registration = () =>
  globalSlot('sessionStore', () => ({ store: null as IGRPSessionStore | null }));

/**
 * Registers the process-wide session store. Pass `null` to unregister.
 *
 * Call it from Node-only startup code — `instrumentation.ts`'s `register()`,
 * behind `process.env.NEXT_RUNTIME === 'nodejs'` — so that the store and its
 * client library never enter the Edge middleware bundle. Middleware does not
 * need the store: the cookie still carries the expiry and error claims it reads.
 *
 * Every instance of this package in the process (the `/config` and `/jwt`
 * chunks, `@igrp/framework-next`'s cookie fallback) sees the same store.
 *
 * Every replica must register the same shared store. A cookie written by a
 * replica with a store cannot be read by one without: it carries no tokens, so
 * the user reads as signed out there.
 */
export function configureIGRPSessionStore(store: IGRPSessionStore | null): void {
  registration().store = store;
}

/** The registered store, or `null`. */
export function getIGRPSessionStore(): IGRPSessionStore | null {
  return registration().store;
}

// ─── Codec ───────────────────────────────────────────────────────────────────

function storeKey(sessionId: string): string {
  return `${SESSION_STORE_KEY_PREFIX}${sessionId}`;
}

/** 256 bits from the platform CSPRNG, base64url. Works in Node and Edge. */
function newSessionId(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pickStored(token: JWT): StoredFields {
  const stored: StoredFields = {};
  for (const field of STORED_FIELDS) {
    if (token[field] !== undefined) (stored as Record<string, unknown>)[field] = token[field];
  }
  return stored;
}

function withoutStoredTokens(token: JWT): JWT {
  const slim: JWT = {};
  for (const [key, value] of Object.entries(token)) {
    if (!COOKIE_ONLY_EXCLUDED.has(key)) slim[key] = value;
  }
  return slim;
}

function hasTokenMaterial(token: JWT): boolean {
  return Boolean(token.accessToken || token.refreshToken || token.idToken);
}

async function readStored(
  store: IGRPSessionStore,
  sessionId: string,
  secret: JWTDecodeParams['secret'],
): Promise<StoredFields | null> {
  const value = await store.get(storeKey(sessionId));
  if (!value) return null;
  return (await nextAuthDecode({ token: value, secret, salt: STORE_VALUE_SALT })) as StoredFields;
}

async function writeStored(
  store: IGRPSessionStore,
  sessionId: string,
  stored: StoredFields,
  secret: JWTEncodeParams['secret'],
  maxAge: number,
): Promise<void> {
  const value = await nextAuthEncode({ token: stored, secret, maxAge, salt: STORE_VALUE_SALT });
  await store.set(storeKey(sessionId), value, maxAge);
}

type CodecOptions = {
  /** Instance-level store; falls back to the registered one. */
  store?: IGRPSessionStore | null;
};

/**
 * NextAuth `jwt.encode` that keeps the token material in the session store.
 *
 * With no store (none passed, none registered) this is exactly NextAuth's own
 * encode, so installing it changes nothing until a store exists.
 *
 * The session id survives refreshes (it is a claim of the decoded token, which
 * the jwt callback carries forward) and is minted afresh at sign-in, where
 * NextAuth builds the token from scratch.
 */
export function createSessionTokenEncoder(options: CodecOptions = {}) {
  return async function encode(params: JWTEncodeParams): Promise<string> {
    const store = options.store ?? getIGRPSessionStore();
    const token = (params.token ?? {}) as JWT;
    // A salted token is not a session cookie (NextAuth uses salts for other
    // JWTs); a session with no tokens (a provider without them) has nothing to
    // move. Both are written exactly as NextAuth would.
    if (!store || params.salt || !hasTokenMaterial(token)) return nextAuthEncode(params);

    const maxAge = params.maxAge ?? DEFAULT_MAX_AGE_S;
    const existingId = typeof token[SESSION_ID_CLAIM] === 'string' ? token[SESSION_ID_CLAIM] : '';
    const sessionId = existingId || newSessionId();

    let stored = pickStored(token);
    try {
      // A failed refresh must not overwrite a newer, healthy rotation made by a
      // concurrent request (another replica, another tab). That request
      // consumed the refresh token this one tried, which is WHY this one
      // failed — and the store, unlike a cookie, is shared, so a blind write
      // would log out the session the winner just renewed.
      if (stored.error && existingId) {
        const current = await readStored(store, existingId, params.secret);
        if (current && !current.error && current.refreshToken !== stored.refreshToken) {
          stored = current;
        }
      }
      await writeStored(store, sessionId, stored, params.secret, maxAge);
    } catch (error) {
      // Keep the user signed in: a full cookie is too big for some proxies, but
      // a store outage is better answered by a large cookie than by a logout.
      warnOnce('sessionStore.setFailed', () =>
        console.error(
          '[igrp session-store] writing the session to the store failed — falling back to a ' +
            'full session cookie until the store recovers:',
          error,
        ),
      );
      const { [SESSION_ID_CLAIM]: _dropped, ...full } = token;
      return nextAuthEncode({ ...params, token: full });
    }

    return nextAuthEncode({
      ...params,
      token: {
        ...withoutStoredTokens(token),
        ...pickCookieClaims(stored),
        [SESSION_ID_CLAIM]: sessionId,
      },
    });
  };
}

/** The stored fields the cookie keeps a copy of (see {@link STORED_FIELDS}). */
function pickCookieClaims(stored: StoredFields): JWT {
  return { expiresAt: stored.expiresAt, error: stored.error, forceLogout: stored.forceLogout };
}

/**
 * NextAuth `jwt.decode` that restores the token material from the store.
 *
 * - A cookie without a session id (a full cookie) is returned as-is, so
 *   sessions written before the store existed keep working and move to the
 *   store on their next write.
 * - `hydrate: 'required'` (Node: route handler, server session, token helpers)
 *   returns `null` — signed out — when the store has no entry: the session was
 *   signed out, expired, or the store is unreachable or not registered.
 * - `hydrate: 'optional'` (Edge middleware) returns the cookie's claims alone
 *   when the store is unavailable; they carry the expiry and error flags,
 *   which is all middleware decides on. They carry no access token.
 */
export function createSessionTokenDecoder(
  options: CodecOptions & { hydrate?: 'required' | 'optional' } = {},
) {
  const hydrate = options.hydrate ?? 'required';
  return async function decode(params: JWTDecodeParams): Promise<JWT | null> {
    const token = (await nextAuthDecode(params)) as JWT | null;
    if (!token || params.salt) return token;
    const sessionId = token[SESSION_ID_CLAIM];
    if (typeof sessionId !== 'string' || !sessionId) return token;

    const store = options.store ?? getIGRPSessionStore();
    if (!store) {
      if (hydrate === 'optional') return token;
      warnOnce('sessionStore.missing', () =>
        console.error(
          '[igrp session-store] a store-backed session cookie arrived but no session store is ' +
            'registered in this process — the user reads as signed out. Register the same store ' +
            'on every replica (configureIGRPSessionStore in instrumentation.ts).',
        ),
      );
      return null;
    }

    let stored: StoredFields | null;
    try {
      stored = await readStored(store, sessionId, params.secret);
    } catch (error) {
      if (hydrate === 'optional') return token;
      console.error('[igrp session-store] reading the session from the store failed:', error);
      return null;
    }
    if (!stored) return hydrate === 'optional' ? token : null;
    return { ...token, ...stored };
  };
}

/**
 * Store-aware decode for `getToken({ decode })` outside `withIGRPAuth`, using
 * the registered store. Use it wherever the session cookie is read directly
 * (e.g. `@igrp/framework-next`'s access-token fallback): plain `getToken` on a
 * store-backed cookie returns a token without `accessToken`.
 */
export const decodeIGRPSessionToken = createSessionTokenDecoder();

/**
 * Removes a session's store entry. Called on sign-out; a no-op for a cookie
 * that was never store-backed or when no store is registered.
 */
export async function deleteStoredSession(
  token: JWT | null | undefined,
  options: CodecOptions = {},
): Promise<void> {
  const sessionId = token?.[SESSION_ID_CLAIM];
  const store = options.store ?? getIGRPSessionStore();
  if (!store || typeof sessionId !== 'string' || !sessionId) return;
  try {
    await store.delete(storeKey(sessionId));
  } catch (error) {
    console.error('[igrp session-store] deleting the signed-out session failed:', error);
  }
}

// ─── Refresh lock ────────────────────────────────────────────────────────────

/**
 * Lock keys live under the session prefix (`igrp:session:lock:<sid>`), so one
 * ACL key pattern (`~igrp:session:*`) covers both. Session ids are base64url
 * and never contain `:`, so a lock key cannot collide with a session key.
 */
const LOCK_KEY_PREFIX = `${SESSION_STORE_KEY_PREFIX}lock:`;

/**
 * Lock lifetime. Covers a refresh's remote hops with margin: discovery and
 * introspection (4 s each) plus the token call (8 s) and its one pre-send
 * retry. A holder that dies just lets the lock expire.
 */
export const REFRESH_LOCK_TTL_MS = 20_000;

/**
 * How long a replica that lost the race waits for the winner's result. Longer
 * than the lock's TTL, so a waiter always outlives a dead holder's lock and can
 * take it over instead of refreshing without it.
 */
export const REFRESH_LOCK_WAIT_MS = REFRESH_LOCK_TTL_MS + 2_000;

const REFRESH_LOCK_POLL_MS = 150;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The stored session was refreshed after `token` was read: its access token
 * expires later and it carries no failure. Comparing expiries (not refresh
 * tokens) also covers an IdP that does not rotate refresh tokens.
 */
function isNewerHealthy(stored: StoredFields | null, token: JWT): stored is StoredFields {
  return Boolean(
    stored &&
    !stored.error &&
    stored.accessToken &&
    (stored.expiresAt ?? 0) > (token.expiresAt ?? 0),
  );
}

export type SessionRefreshLockOptions = CodecOptions & {
  /** Key material for the stored value — the instance's `NEXTAUTH_SECRET`. */
  secret: JWTEncodeParams['secret'] | undefined;
  /** Session lifetime in seconds, for the store entry written inside the lock. */
  maxAge?: number;
  /** How long a replica that lost the race waits. Defaults to {@link REFRESH_LOCK_WAIT_MS}. */
  waitMs?: number;
};

/**
 * Runs `refresh` so that, across every replica sharing the store, only ONE
 * refreshes a given session at a time.
 *
 * WHY: with several replicas, two concurrent requests for the same session can
 * each find the access token expiring and each spend the SAME refresh token.
 * With rotation, the second call is a reuse of a consumed token: the IdP
 * rejects it, and its reuse detection may revoke the whole token family —
 * logging out a session nothing was wrong with. The in-process dedup in
 * `./oidc` cannot see other replicas; the shared store can.
 *
 * - The winner re-reads the store first (a refresh may have landed between its
 *   read and the lock), then refreshes and writes the result to the store
 *   BEFORE releasing, so waiters find it.
 * - A loser polls the store for up to {@link REFRESH_LOCK_WAIT_MS} and adopts
 *   the winner's tokens. It never refreshes while the lock is held: a winner
 *   that died lets its lock expire and the loser takes it over; a winner that
 *   is merely slow makes the loser return the session unchanged for this
 *   request. Refreshing anyway would present a refresh token the winner may
 *   already have spent — which the IdP treats as reuse and revokes.
 * - No store, a store without lock methods, a cookie that is not store-backed,
 *   or a store error: `refresh(token)` runs directly, exactly as before.
 *
 * `refresh` receives the token to refresh and returns the result, failures
 * included (an error-flagged token), as the jwt callback's refresh path does.
 */
export async function refreshUnderSessionLock(
  token: JWT,
  options: SessionRefreshLockOptions,
  refresh: (token: JWT) => Promise<JWT>,
): Promise<JWT> {
  const store = options.store ?? getIGRPSessionStore();
  const sessionId = token[SESSION_ID_CLAIM];
  const { secret } = options;
  if (
    !store?.acquireLock ||
    !store.releaseLock ||
    typeof sessionId !== 'string' ||
    !sessionId ||
    // No key, no stored values to read or write (development without a secret).
    !secret
  ) {
    return refresh(token);
  }

  const lockKey = `${LOCK_KEY_PREFIX}${sessionId}`;
  const owner = newSessionId();
  let acquired: boolean;
  try {
    acquired = await store.acquireLock(lockKey, owner, REFRESH_LOCK_TTL_MS);
  } catch (error) {
    warnOnce('sessionStore.lockFailed', () =>
      console.error(
        '[igrp session-store] taking the refresh lock failed — refreshing without it:',
        error,
      ),
    );
    return refresh(token);
  }

  if (!acquired) {
    // NEVER refresh while another replica holds the lock: that is the very
    // reuse the lock exists to prevent. Wait for its result; if the holder
    // dies, its lock expires and this replica takes it over, then refreshes
    // properly under it.
    const deadline = Date.now() + (options.waitMs ?? REFRESH_LOCK_WAIT_MS);
    while (!acquired && Date.now() < deadline) {
      await sleep(REFRESH_LOCK_POLL_MS);
      const current = await readStored(store, sessionId, secret).catch(() => null);
      if (isNewerHealthy(current, token)) return { ...token, ...current };
      acquired = await store.acquireLock(lockKey, owner, REFRESH_LOCK_TTL_MS).catch(() => false);
    }
    if (!acquired) {
      // The holder is alive but slower than the whole wait. Give up on THIS
      // request without refreshing: return the session as it is (no error
      // flag, so it is not logged out). The next session read retries — a slow
      // request is far cheaper than a revoked session.
      warnOnce('sessionStore.lockWaitExceeded', () =>
        console.warn(
          '[igrp session-store] another replica held the refresh lock for longer than ' +
            `${options.waitMs ?? REFRESH_LOCK_WAIT_MS}ms — not refreshing on this request.`,
        ),
      );
      return token;
    }
  }

  try {
    const current = await readStored(store, sessionId, secret).catch(() => null);
    if (isNewerHealthy(current, token)) return { ...token, ...current };

    const result = await refresh(token);
    if (!result.error) {
      await writeStored(
        store,
        sessionId,
        pickStored(result),
        secret,
        options.maxAge ?? DEFAULT_MAX_AGE_S,
      ).catch(() => {
        // The encode that follows the jwt callback writes it again; waiters
        // that miss it fall back to refreshing themselves.
      });
    }
    return result;
  } finally {
    await store.releaseLock(lockKey, owner).catch(() => {
      // Expires on its own after REFRESH_LOCK_TTL_MS.
    });
  }
}

// ─── In-memory store ─────────────────────────────────────────────────────────

/**
 * Per-process store for development and single-instance deployments.
 *
 * NOT for anything with more than one replica, or with restarts users should
 * survive: entries live in this process only, so another replica — or this one
 * after a restart — reads every store-backed cookie as signed out.
 */
export function createMemorySessionStore(): IGRPSessionStore {
  const entries = new Map<string, { value: string; expiresAt: number }>();
  return {
    async get(key) {
      const entry = entries.get(key);
      if (!entry) return null;
      if (entry.expiresAt <= Date.now()) {
        entries.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, ttlSeconds) {
      entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
    async delete(key) {
      entries.delete(key);
    },
    async acquireLock(key, owner, ttlMs) {
      const entry = entries.get(key);
      if (entry && entry.expiresAt > Date.now()) return false;
      entries.set(key, { value: owner, expiresAt: Date.now() + ttlMs });
      return true;
    },
    async releaseLock(key, owner) {
      if (entries.get(key)?.value === owner) entries.delete(key);
    },
  };
}
