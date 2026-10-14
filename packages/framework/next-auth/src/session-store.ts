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
      const value = await nextAuthEncode({
        token: stored,
        secret: params.secret,
        maxAge,
        salt: STORE_VALUE_SALT,
      });
      await store.set(storeKey(sessionId), value, maxAge);
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
  };
}
