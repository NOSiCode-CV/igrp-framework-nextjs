# Refresh Flow: Multi-Pod Recovery Store + Adaptive Refetch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the two documented limitations of the OIDC refresh_token flow: (1) the rotation-recovery cache is per-pod memory and breaks under multi-replica deployments without sticky sessions; (2) the client session-refetch cadence is a fixed interval that must be hand-tuned to the IdP's access-token TTL.

**Architecture:** (1) Extract the in-memory `recoveryStore` in `packages/framework/next-auth/src/oidc.ts` behind a new async `IGRPTokenRecoveryStore` interface in a new `token-store.ts` file (re-exported from the existing `./oidc` entry point — no packaging changes). Ship a default in-memory implementation (current behavior, unchanged semantics) plus a dependency-free `createRedisTokenRecoveryStore(client)` factory that accepts any node-redis-v4-shaped client. Add a `tokenRecoveryStore` option to `withIGRPAuth`. Also add cross-pod recovery: when the refresh grant fails with a permanent error, check the (now possibly shared) store before flagging `RefreshAccessTokenError` — another replica may have already rotated the token. (2) In `@igrp/framework-next-ui`'s `IGRPSessionWatcher` (already mounted in every IGRP app's provider tree), add an adaptive timer that reads `session.expiresAt` (already exposed by the `session` callback) and calls `getSession()` 45 s before access-token expiry — inside the jwt callback's 60 s proactive-refresh window. The existing fixed 150 s poll stays as a fallback; the template is **not** modified (no template-migrator migration needed).

**Tech Stack:** TypeScript, NextAuth v4, vitest (`@igrp/framework-next-auth` only — next-ui has no test runner; it is verified by build), tsup (next-auth), SWC+Babel (next-ui), pnpm workspace.

**Repo hard rules that apply:**
- pnpm only; never edit `dist/`; never import package internals.
- One changeset per package changed, **always `patch` type**.
- Do **NOT** run `pnpm version:changesets` or any publish step — releases require explicit user authorization.
- `framework-next-auth` is the dependency root: after changing it, run `pnpm build:framework` before trusting downstream builds.
- next-auth and next-ui use Prettier (not Biome). Format with each package's `pnpm format` if needed.
- Platform is Windows/PowerShell; all commands below run from the repo root `D:\nosi-projects\igrp3\igrp-framework-frontend\igrp-framework-nextjs`.

**Key design decisions (do not re-litigate during execution):**
- `inflightRefreshes` (the concurrent-dedup map of Promises) **stays in-memory** — promises can't be shared across processes. Cross-pod safety comes from the shared recovery store + the new failure-path recovery check.
- `getRecoveredToken` changes from sync to **async** (`Promise<JWT | null>`). Its only consumers are `config.ts` (internal) and tests. This is a public-API change on the `./oidc` entry; it is called out in the changeset text.
- Store outages must never break auth: every store call is wrapped in try/catch and degrades to a cache miss / no-op.
- The Redis factory hashes keys with SHA-256 (Web Crypto, edge-safe, no Node `crypto` import) so raw refresh tokens never appear as Redis keys. Values still contain tokens — that is inherent to the feature and documented in JSDoc.
- Adaptive timer fires at `expiresAt - 45_000` ms (inside the server's 60 s refresh buffer, with 45 s margin before expiry and 35 s before the middleware's 10 s grace), clamped to a minimum 5 s delay. Effect deps are primitives (`expiresAt`, `status`) so a failed refresh (which leaves `expiresAt` unchanged) cannot create a re-render/timer loop.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `packages/framework/next-auth/src/token-store.ts` | Create | `IGRPTokenRecoveryStore` interface, `createInMemoryTokenRecoveryStore()`, `IGRPRedisLikeClient`, `createRedisTokenRecoveryStore()` |
| `packages/framework/next-auth/src/__tests__/token-store.test.ts` | Create | Unit tests for both store implementations |
| `packages/framework/next-auth/src/oidc.ts` | Modify | Delegate `recoveryStore` to the pluggable store; `configureOidcTokenRecoveryStore()`; async `getRecoveredToken`; recovery-on-permanent-failure; re-export `token-store` |
| `packages/framework/next-auth/src/__tests__/oidc.test.ts` | Modify | Await the now-async `getRecoveredToken`; add custom-store + failure-recovery tests |
| `packages/framework/next-auth/src/config.ts` | Modify | `await getRecoveredToken(...)`; new `tokenRecoveryStore` option on `IGRPAuthOptions` wired in `withIGRPAuth` |
| `packages/framework/next-auth/src/__tests__/config.test.ts` | Modify | `mockReturnValue` → `mockResolvedValue` for the `getRecoveredToken` mock; new option test |
| `packages/framework/next-ui/src/components/templates/session-watcher.tsx` | Modify | Adaptive pre-expiry `getSession()` scheduler |
| `.changeset/*.md` | Create | Two patch changesets (next-auth, next-ui) |

---

### Task 1: `token-store.ts` — interface + in-memory implementation

**Files:**
- Create: `packages/framework/next-auth/src/token-store.ts`
- Create: `packages/framework/next-auth/src/__tests__/token-store.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/framework/next-auth/src/__tests__/token-store.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { JWT } from '../jwt';
import {
  createInMemoryTokenRecoveryStore,
  createRedisTokenRecoveryStore,
  type IGRPRedisLikeClient,
} from '../token-store';

function makeJwt(overrides: Partial<JWT> = {}): JWT {
  return {
    accessToken: 'at-new',
    refreshToken: 'rt-new',
    idToken: 'id-new',
    expiresAt: Date.now() + 180_000,
    ...overrides,
  } as JWT;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('createInMemoryTokenRecoveryStore', () => {
  it('returns null for an unknown key', async () => {
    const store = createInMemoryTokenRecoveryStore();
    expect(await store.get('never-seen')).toBeNull();
  });

  it('round-trips a stored result', async () => {
    const store = createInMemoryTokenRecoveryStore();
    const jwt = makeJwt();
    await store.set('consumed-rt', jwt, 180_000);
    expect(await store.get('consumed-rt')).toEqual(jwt);
  });

  it('expires entries after their TTL', async () => {
    vi.useFakeTimers();
    const store = createInMemoryTokenRecoveryStore();
    await store.set('consumed-rt', makeJwt(), 1_000);
    vi.advanceTimersByTime(1_001);
    expect(await store.get('consumed-rt')).toBeNull();
  });

  it('does not delete on read — two reads of the same entry both succeed', async () => {
    const store = createInMemoryTokenRecoveryStore();
    await store.set('consumed-rt', makeJwt(), 180_000);
    expect(await store.get('consumed-rt')).not.toBeNull();
    expect(await store.get('consumed-rt')).not.toBeNull();
  });

  it('evicts the oldest entry when full', async () => {
    const store = createInMemoryTokenRecoveryStore({ maxEntries: 2 });
    await store.set('rt-1', makeJwt(), 180_000);
    await store.set('rt-2', makeJwt(), 180_000);
    await store.set('rt-3', makeJwt(), 180_000);
    expect(await store.get('rt-1')).toBeNull();
    expect(await store.get('rt-3')).not.toBeNull();
  });
});

describe('createRedisTokenRecoveryStore', () => {
  function makeFakeRedis() {
    const data = new Map<string, string>();
    const client: IGRPRedisLikeClient = {
      get: vi.fn(async (key: string) => data.get(key) ?? null),
      set: vi.fn(async (key: string, value: string, _options: { PX: number }) => {
        data.set(key, value);
        return 'OK';
      }),
    };
    return { client, data };
  }

  it('round-trips a stored result through JSON', async () => {
    const { client } = makeFakeRedis();
    const store = createRedisTokenRecoveryStore(client);
    const jwt = makeJwt();
    await store.set('consumed-rt', jwt, 180_000);
    expect(await store.get('consumed-rt')).toEqual(jwt);
  });

  it('passes the TTL to the client as PX milliseconds', async () => {
    const { client } = makeFakeRedis();
    const store = createRedisTokenRecoveryStore(client);
    await store.set('consumed-rt', makeJwt(), 42_000);
    expect(client.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), {
      PX: 42_000,
    });
  });

  it('never uses the raw refresh token as a key (keys are hashed)', async () => {
    const { client, data } = makeFakeRedis();
    const store = createRedisTokenRecoveryStore(client);
    await store.set('consumed-rt-secret-value', makeJwt(), 180_000);
    for (const key of data.keys()) {
      expect(key).not.toContain('consumed-rt-secret-value');
      expect(key).toMatch(/^igrp:oidc:rotated:[0-9a-f]{64}$/);
    }
  });

  it('honors a custom keyPrefix', async () => {
    const { client, data } = makeFakeRedis();
    const store = createRedisTokenRecoveryStore(client, { keyPrefix: 'custom:' });
    await store.set('consumed-rt', makeJwt(), 180_000);
    expect([...data.keys()][0]).toMatch(/^custom:[0-9a-f]{64}$/);
  });

  it('returns null on malformed JSON instead of throwing', async () => {
    const { client, data } = makeFakeRedis();
    const store = createRedisTokenRecoveryStore(client);
    await store.set('consumed-rt', makeJwt(), 180_000);
    const key = [...data.keys()][0]!;
    data.set(key, 'not-json{');
    expect(await store.get('consumed-rt')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```powershell
pnpm --filter @igrp/framework-next-auth test -- token-store
```
Expected: FAIL — `Cannot find module '../token-store'` (or equivalent resolution error).

- [ ] **Step 3: Implement `token-store.ts`**

Create `packages/framework/next-auth/src/token-store.ts`:

```ts
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
      if (entries.size >= maxEntries) {
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
```

- [ ] **Step 4: Run the tests to verify they pass**

```powershell
pnpm --filter @igrp/framework-next-auth test -- token-store
```
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```powershell
git add packages/framework/next-auth/src/token-store.ts packages/framework/next-auth/src/__tests__/token-store.test.ts
git commit -m @'
feat(next-auth): add pluggable IGRPTokenRecoveryStore with in-memory and redis-like implementations

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 2: Wire the pluggable store into `oidc.ts`

**Files:**
- Modify: `packages/framework/next-auth/src/oidc.ts` (the `RECOVERY_TTL_MS`/`recoveryStore`/`getRecoveredToken` block at lines ~134–182, the rotation-cache write at ~326–328, and the failure branch at ~273–279)
- Modify: `packages/framework/next-auth/src/__tests__/oidc.test.ts`

- [ ] **Step 1: Update existing tests for async `getRecoveredToken` and add new tests**

In `packages/framework/next-auth/src/__tests__/oidc.test.ts`, in the `refreshOidcAccessToken — rotation recovery cache` describe block (line ~256), every `getRecoveredToken(...)` call becomes awaited. Apply these exact replacements:

```ts
// line ~275:   const recovered = getRecoveredToken('old-rt');
const recovered = await getRecoveredToken('old-rt');

// line ~299:   expect(getRecoveredToken('old-rt')).toBeNull();
expect(await getRecoveredToken('old-rt')).toBeNull();

// line ~315:   expect(getRecoveredToken('old-rt')).not.toBeNull();
expect(await getRecoveredToken('old-rt')).not.toBeNull();

// line ~318:   expect(getRecoveredToken('old-rt')).toBeNull();
expect(await getRecoveredToken('old-rt')).toBeNull();

// lines ~326-327:
expect(await getRecoveredToken('never-seen')).toBeNull();
expect(await getRecoveredToken(undefined)).toBeNull();
```

Then append this new describe block at the end of the file:

```ts
// ─── configureOidcTokenRecoveryStore ─────────────────────────────────────────

describe('configureOidcTokenRecoveryStore', () => {
  it('routes getRecoveredToken reads through the injected store', async () => {
    const { configureOidcTokenRecoveryStore, getRecoveredToken } = await import('../oidc');
    const stored = makeToken({ refreshToken: 'rt-from-store', accessToken: 'at-from-store' });
    configureOidcTokenRecoveryStore({
      get: vi.fn(async (key: string) => (key === 'consumed-rt' ? stored : null)),
      set: vi.fn(async () => {}),
    });

    expect(await getRecoveredToken('consumed-rt')).toEqual(stored);
    expect(await getRecoveredToken('other')).toBeNull();
  });

  it('writes rotated results through the injected store', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      {
        url: MOCK_DISCOVERY.token_endpoint,
        body: { access_token: 'new-at', refresh_token: 'new-rt', expires_in: 180 },
      },
    ]);
    const { configureOidcTokenRecoveryStore, refreshOidcAccessToken } = await import('../oidc');
    const set = vi.fn(async () => {});
    configureOidcTokenRecoveryStore({ get: vi.fn(async () => null), set });

    await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);

    expect(set).toHaveBeenCalledWith(
      'old-rt',
      expect.objectContaining({ accessToken: 'new-at', refreshToken: 'new-rt' }),
      expect.any(Number),
    );
  });

  it('recovers from a permanent refresh rejection when another replica already rotated', async () => {
    // 4xx from the token endpoint = invalid_grant (token consumed elsewhere).
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.token_endpoint, body: { error: 'invalid_grant' }, ok: false },
    ]);
    const { configureOidcTokenRecoveryStore, refreshOidcAccessToken } = await import('../oidc');
    const rotatedElsewhere = makeToken({
      refreshToken: 'new-rt-from-pod-a',
      accessToken: 'at-from-pod-a',
      expiresAt: Date.now() + 180_000,
    });
    configureOidcTokenRecoveryStore({
      get: vi.fn(async (key: string) => (key === 'old-rt' ? rotatedElsewhere : null)),
      set: vi.fn(async () => {}),
    });

    const result = await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);

    expect(result.error).toBeUndefined();
    expect(result.accessToken).toBe('at-from-pod-a');
    expect(result.refreshToken).toBe('new-rt-from-pod-a');
  });

  it('treats a throwing store as a cache miss and still fails closed on rejection', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.token_endpoint, body: { error: 'invalid_grant' }, ok: false },
    ]);
    const { configureOidcTokenRecoveryStore, refreshOidcAccessToken } = await import('../oidc');
    configureOidcTokenRecoveryStore({
      get: vi.fn(async () => {
        throw new Error('redis down');
      }),
      set: vi.fn(async () => {
        throw new Error('redis down');
      }),
    });

    const result = await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);

    expect(result.error).toBe('RefreshAccessTokenError');
    expect(result.forceLogout).toBe(true);
  });
});
```

Note: the existing `afterEach` already calls `vi.resetModules()`, so each test's dynamic `import('../oidc')` gets a fresh module with the default in-memory store — the injected store does not leak between tests.

- [ ] **Step 2: Run the oidc tests to verify the new ones fail**

```powershell
pnpm --filter @igrp/framework-next-auth test -- oidc
```
Expected: FAIL — `configureOidcTokenRecoveryStore` is not exported; the awaited-sync edits still pass (awaiting a non-promise is a no-op).

- [ ] **Step 3: Modify `oidc.ts`**

3a. Add the import after the existing imports at the top of the file (after the `./providers` import block, line ~7):

```ts
import { createInMemoryTokenRecoveryStore, type IGRPTokenRecoveryStore } from './token-store';

export * from './token-store';
```

3b. Replace the entire block from `const RECOVERY_TTL_MS = 180_000;` (line ~134) through the end of the current `getRecoveredToken` function (line ~182) — i.e. the `RECOVERY_TTL_MS`/`RECOVERY_MAX_ENTRIES` constants, the `RecoveryEntry` type, the `recoveryStore` IIFE, and the sync `getRecoveredToken` — with:

```ts
// TTL is coupled to the access-token lifetime / session poll interval: the entry
// must outlive the gap between an RSC rotation and the next persisting poll.
// With a ~180s access token and a 150s poll, 180s comfortably bridges it while
// holding a soon-stale refresh token only briefly.
const RECOVERY_TTL_MS = 180_000;

// Defaults to per-process memory (single instance / sticky routing). Replace
// via configureOidcTokenRecoveryStore with a shared store (e.g. Redis through
// createRedisTokenRecoveryStore) for multi-replica deployments without sticky
// sessions — that closes the cross-pod rotation race the in-memory store can't.
let recoveryStore: IGRPTokenRecoveryStore = createInMemoryTokenRecoveryStore();

/**
 * Replaces the rotation-recovery store. Call once at startup — `withIGRPAuth`
 * does this automatically when its `tokenRecoveryStore` option is set.
 */
export function configureOidcTokenRecoveryStore(store: IGRPTokenRecoveryStore): void {
  recoveryStore = store;
}

/**
 * Returns a rotated token previously cached by {@link refreshOidcAccessToken}
 * for the given (now-consumed) refresh token, or null if absent/expired. Pure
 * peek — no deletion-on-read (both an RSC read and the persisting poll may
 * need the same entry before one persists; it self-evicts by TTL). A store
 * failure degrades to a cache miss: the recovery path must never take a
 * session read down with it.
 */
export async function getRecoveredToken(refreshToken: string | undefined): Promise<JWT | null> {
  if (!refreshToken) return null;
  try {
    return await recoveryStore.get(refreshToken);
  } catch {
    return null;
  }
}
```

3c. In `performRefresh`, replace the failure branch (currently lines ~273–279):

```ts
  if (!response || !response.ok) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
      forceLogout: true,
    };
  }
```

with:

```ts
  if (!response || !response.ok) {
    // With a SHARED recovery store, a permanent rejection (invalid_grant) often
    // means another replica already rotated this refresh token — its result may
    // have landed in the store after our caller's pre-flight recovery check.
    // Peek once more before declaring the session dead. With the default
    // in-memory store this is a cheap no-op re-check.
    const recovered = await getRecoveredToken(token.refreshToken);
    if (recovered) return recovered;

    return {
      ...token,
      error: 'RefreshAccessTokenError',
      forceLogout: true,
    };
  }
```

3d. Replace the rotation-cache write (currently lines ~321–328):

```ts
  // The IdP rotated the refresh token. If this refresh ran where the cookie
  // can't be persisted (an RSC render), the rotated token would be lost and the
  // next read would replay the consumed one → invalid_grant → logout. Remember
  // the outcome keyed by the CONSUMED token so the next persist-capable read can
  // recover it. Skip when the token was reused (the cookie's token still works).
  if (newRefreshToken !== oldRefreshToken) {
    recoveryStore.set(oldRefreshToken, refreshed);
  }
```

with:

```ts
  // The IdP rotated the refresh token. If this refresh ran where the cookie
  // can't be persisted (an RSC render), the rotated token would be lost and the
  // next read would replay the consumed one → invalid_grant → logout. Remember
  // the outcome keyed by the CONSUMED token so the next persist-capable read —
  // possibly on another replica when the store is shared — can recover it.
  // Skip when the token was reused (the cookie's token still works). Awaited so
  // a shared store is consistent before the rotated cookie is written; a store
  // outage must not fail a successful refresh.
  if (newRefreshToken !== oldRefreshToken) {
    try {
      await recoveryStore.set(oldRefreshToken, refreshed, RECOVERY_TTL_MS);
    } catch {
      // Best-effort: losing the recovery entry re-opens only the RSC race window.
    }
  }
```

- [ ] **Step 4: Run the full next-auth test suite**

```powershell
pnpm --filter @igrp/framework-next-auth test
```
Expected: oidc + token-store tests PASS. `config.test.ts` may fail at this point if its mock of `getRecoveredToken` (sync `mockReturnValue`) trips the new `await` in config.ts — config.ts is untouched so far, so it should still pass; if anything fails outside oidc/token-store, stop and investigate before proceeding.

- [ ] **Step 5: Commit**

```powershell
git add packages/framework/next-auth/src/oidc.ts packages/framework/next-auth/src/__tests__/oidc.test.ts
git commit -m @'
feat(next-auth): pluggable rotation-recovery store with cross-replica recovery on invalid_grant

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 3: `config.ts` — await recovery + `tokenRecoveryStore` option

**Files:**
- Modify: `packages/framework/next-auth/src/config.ts` (imports line ~36–41, `IGRPAuthOptions` type ~line 158–179, `withIGRPAuth` destructuring ~line 430–440, jwt callback line ~537)
- Modify: `packages/framework/next-auth/src/__tests__/config.test.ts` (mock at line ~14, `mockReturnValue` call sites ~415 and ~439)

- [ ] **Step 1: Update the config tests**

In `packages/framework/next-auth/src/__tests__/config.test.ts`:

```ts
// line ~14 — module mock:
//   getRecoveredToken: vi.fn().mockReturnValue(null),
getRecoveredToken: vi.fn().mockResolvedValue(null),

// line ~415:
//   (oidcModule.getRecoveredToken as ReturnType<typeof vi.fn>).mockReturnValue(recoveredToken);
(oidcModule.getRecoveredToken as ReturnType<typeof vi.fn>).mockResolvedValue(recoveredToken);

// line ~439:
//   (oidcModule.getRecoveredToken as ReturnType<typeof vi.fn>).mockReturnValue(null);
(oidcModule.getRecoveredToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
```

Then add a new test at the end of the file. It must follow the file's existing mocking pattern — the file mocks `../oidc` via `vi.mock`, so add `configureOidcTokenRecoveryStore: vi.fn()` to that mock factory (alongside `getRecoveredToken` at line ~14), and append:

```ts
describe('withIGRPAuth — tokenRecoveryStore option', () => {
  it('forwards the store to configureOidcTokenRecoveryStore at construction', async () => {
    const oidcModule = await import('../oidc');
    const { withIGRPAuth } = await import('../config');
    const store = { get: vi.fn(async () => null), set: vi.fn(async () => {}) };

    withIGRPAuth({ env: VALID_ENV, tokenRecoveryStore: store });

    expect(oidcModule.configureOidcTokenRecoveryStore).toHaveBeenCalledWith(store);
  });

  it('leaves the default store alone when the option is absent', async () => {
    const oidcModule = await import('../oidc');
    const { withIGRPAuth } = await import('../config');

    withIGRPAuth({ env: VALID_ENV });

    expect(oidcModule.configureOidcTokenRecoveryStore).not.toHaveBeenCalled();
  });
});
```

(`VALID_ENV` already exists in this test file's fixtures; if the local name differs, reuse the file's existing valid-env fixture.)

- [ ] **Step 2: Run config tests to verify the new ones fail**

```powershell
pnpm --filter @igrp/framework-next-auth test -- config
```
Expected: FAIL — `configureOidcTokenRecoveryStore` missing from the mock until added, then `tokenRecoveryStore` option not honored.

- [ ] **Step 3: Modify `config.ts`**

3a. Extend the oidc import (lines ~36–41):

```ts
import {
  configureOidcTokenRecoveryStore,
  getRecoveredToken,
  introspectOidcToken,
  refreshOidcAccessToken,
  revokeOidcSession,
} from './oidc';
import type { IGRPTokenRecoveryStore } from './token-store';
```

3b. Add to the `IGRPAuthOptions` type, after the `onSessionExpired` member (line ~178):

```ts
  /**
   * Shared store for rotated refresh-token recovery. Defaults to an in-memory,
   * per-process store — correct for single-instance or sticky-routed
   * deployments. Multi-replica deployments without sticky sessions should
   * supply a shared store, e.g.:
   *
   * @example
   * import { createClient } from 'redis';
   * import { createRedisTokenRecoveryStore } from '@igrp/framework-next-auth/oidc';
   *
   * const redis = createClient({ url: process.env.REDIS_URL });
   * await redis.connect();
   * withIGRPAuth({ tokenRecoveryStore: createRedisTokenRecoveryStore(redis) });
   */
  tokenRecoveryStore?: IGRPTokenRecoveryStore;
```

3c. In `withIGRPAuth` (line ~430), add `tokenRecoveryStore` to the destructuring and wire it immediately after:

```ts
  const {
    provider,
    env = process.env,
    secret = process.env.NEXTAUTH_SECRET,
    pages,
    session: sessionConfig,
    callbacks: callbackExtensions = {},
    middleware: middlewareOptions = {},
    onSessionExpired,
    tokenRecoveryStore,
  } = options;

  if (tokenRecoveryStore) {
    configureOidcTokenRecoveryStore(tokenRecoveryStore);
  }
```

3d. In the jwt callback, await the recovery peek (line ~537):

```ts
        // before: const recovered = getRecoveredToken(igrpToken.refreshToken);
        const recovered = await getRecoveredToken(igrpToken.refreshToken);
```

- [ ] **Step 4: Run the full next-auth suite**

```powershell
pnpm --filter @igrp/framework-next-auth test
```
Expected: PASS (all files: config, oidc, providers, secure-cookie-name, token-store).

- [ ] **Step 5: Build the package to verify types and bundling**

```powershell
pnpm build:auth
```
Expected: tsup completes; `dist/oidc.d.ts` exports `IGRPTokenRecoveryStore`, `createInMemoryTokenRecoveryStore`, `createRedisTokenRecoveryStore`, `configureOidcTokenRecoveryStore`.

- [ ] **Step 6: Commit**

```powershell
git add packages/framework/next-auth/src/config.ts packages/framework/next-auth/src/__tests__/config.test.ts
git commit -m @'
feat(next-auth): add tokenRecoveryStore option to withIGRPAuth

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 4: Adaptive pre-expiry refresh scheduler in `IGRPSessionWatcher`

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/session-watcher.tsx`

No test runner exists in next-ui; verification is type-check + build (Step 2) and the runtime behavior is observable in the template via the dev tools network tab (a `/api/auth/session` call ~45 s before token expiry).

- [ ] **Step 1: Implement the scheduler**

In `packages/framework/next-ui/src/components/templates/session-watcher.tsx`:

1a. Extend the client import (line 5):

```ts
import { getSession, useSession } from '@igrp/framework-next-auth/client';
```

1b. Add the constants after `AUTH_UI_PATH` (line ~14):

```ts
/**
 * How long BEFORE access-token expiry the adaptive refresh fires. Must land
 * INSIDE the server jwt callback's 60s proactive-refresh buffer (so the call
 * actually triggers a refresh) while leaving margin before real expiry and the
 * middleware's 10s post-expiry grace. 45s satisfies both: 60 > 45 > 10.
 */
const ADAPTIVE_REFRESH_LEAD_MS = 45_000;

/**
 * Floor for the scheduled delay. An already-expired or nearly-expired token
 * still gets one prompt refresh attempt instead of a same-tick call storm.
 */
const ADAPTIVE_REFRESH_MIN_DELAY_MS = 5_000;
```

1c. Inside `IGRPSessionWatcher`, after the existing `useEffect` (line ~60), add:

```ts
  // Adaptive silent-refresh scheduler. The fixed SessionProvider poll
  // (IGRP_SESSION_REFETCH_INTERVAL, default 150s) only works when it is tuned
  // below the IdP access-token TTL; this timer derives the moment to refresh
  // from the token itself (`session.expiresAt`, set by the jwt/session
  // callbacks on every rotation), so correctness no longer depends on that
  // tuning. getSession() hits /api/auth/session — a route handler, which CAN
  // persist the rotated cookie — and broadcasts the new session to all
  // useSession consumers, which reschedules this effect with the new
  // expiresAt. On permanent refresh failure expiresAt is unchanged, so the
  // effect does NOT re-fire (no retry loop); the error-flag effect above
  // routes to /logout instead. The fixed poll stays on as a fallback.
  const expiresAt = (session as { expiresAt?: number } | null)?.expiresAt;
  useEffect(() => {
    if (status !== 'authenticated' || typeof expiresAt !== 'number') return;

    const delay = Math.max(
      expiresAt - ADAPTIVE_REFRESH_LEAD_MS - Date.now(),
      ADAPTIVE_REFRESH_MIN_DELAY_MS,
    );
    const timer = setTimeout(() => {
      // Errors surface through the session error flag, not here.
      getSession().catch(() => {});
    }, delay);
    return () => clearTimeout(timer);
  }, [expiresAt, status]);
```

- [ ] **Step 2: Build next-ui (includes type-check via build:types)**

```powershell
pnpm build:next-ui
```
Expected: SWC + Babel (React Compiler) + types all succeed. If the React Compiler errors on the new effect, retry with the package's `build:without_reactcompiler` script to isolate, fix the effect (the deps are primitives, so this is unexpected), and return to the normal build.

- [ ] **Step 3: Verify in the running template (preview off)**

This step requires a configured IdP (`IGRP_AUTH_ISSUER` etc. in `templates/demo-legacy/.env`, `IGRP_PREVIEW_MODE=false`). If the environment lacks IdP credentials, skip this step and note it in the final report — the executor must not fabricate a verification result.

```powershell
pnpm build:framework
pnpm dev:demo
```
Log in, open dev tools → Network, filter `session`. Expected: in addition to the 150 s poll, a `GET /api/auth/session` fires ~45 s before the token's `expiresAt`, and the session response after it carries a new `expiresAt`.

- [ ] **Step 4: Commit**

```powershell
git add packages/framework/next-ui/src/components/templates/session-watcher.tsx
git commit -m @'
feat(next-ui): adaptive pre-expiry session refresh in IGRPSessionWatcher

Derives the silent-refresh moment from session.expiresAt instead of relying
solely on the fixed refetchInterval poll, so refresh timing no longer needs
manual tuning to the IdP access-token TTL. The fixed poll remains as fallback.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 5: Changesets + full verification

**Files:**
- Create: `.changeset/refresh-multipod-recovery-store.md`
- Create: `.changeset/adaptive-session-refetch.md`

- [ ] **Step 1: Create the changesets (patch only — hard rule)**

Create `.changeset/refresh-multipod-recovery-store.md`:

```markdown
---
"@igrp/framework-next-auth": patch
---

Pluggable rotation-recovery store for multi-replica deployments. New on the `./oidc` entry: `IGRPTokenRecoveryStore`, `createInMemoryTokenRecoveryStore`, `createRedisTokenRecoveryStore` (accepts any node-redis-v4-shaped client; keys are SHA-256-hashed), and `configureOidcTokenRecoveryStore`. `withIGRPAuth` accepts a `tokenRecoveryStore` option. On a permanent refresh rejection (`invalid_grant`), the refresh now re-checks the store before flagging `RefreshAccessTokenError`, recovering sessions whose refresh token was rotated by another replica. API note: `getRecoveredToken` is now async (`Promise<JWT | null>`); default behavior without the new option is unchanged (in-memory, per-process).
```

Create `.changeset/adaptive-session-refetch.md`:

```markdown
---
"@igrp/framework-next-ui": patch
---

`IGRPSessionWatcher` now schedules an adaptive silent refresh 45s before access-token expiry, derived from `session.expiresAt`, so token-refresh timing no longer depends on hand-tuning `IGRP_SESSION_REFETCH_INTERVAL` to the IdP access-token TTL. The fixed `SessionProvider` poll remains as a fallback.
```

- [ ] **Step 2: Full ordered framework build**

```powershell
pnpm build:framework
```
Expected: all five packages build in order (next-auth → next-types → design-system → next-ui → next) with no errors.

- [ ] **Step 3: Full next-auth test suite one last time**

```powershell
pnpm --filter @igrp/framework-next-auth test
```
Expected: PASS, zero failures.

- [ ] **Step 4: Verify the template still compiles against the rebuilt packages**

```powershell
pnpm build:demo
```
Expected: Next.js build succeeds. (The template source is untouched; this guards against accidental public-API breakage. If it fails, report — do not silently patch the template, which would require a template-migrator migration.)

- [ ] **Step 5: Commit**

```powershell
git add .changeset/refresh-multipod-recovery-store.md .changeset/adaptive-session-refetch.md
git commit -m @'
chore: changesets for recovery-store seam and adaptive session refetch

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

- [ ] **Step 6: STOP — do not version or publish**

Per repo rules and standing user instruction: `pnpm version:changesets` and any `release` script require explicit user authorization per task. Report completion and wait.

---

## Out of scope (deliberate)

- **Template wiring of a Redis store** — the template works unchanged with the in-memory default; wiring `tokenRecoveryStore` there would require env plumbing, a `redis` dependency decision, and a template-migrator migration. Ship the seam first; wire a consumer when a real multi-replica deployment needs it.
- **Cross-pod dedup of in-flight refreshes** (distributed lock) — promises don't serialize; the shared recovery store + failure-path recovery makes the race benign (worst case: one redundant IdP round-trip that then recovers). YAGNI.
- **Removing the fixed poll / changing `get-session-args.ts` defaults** — the poll is the fallback for clock skew, tab sleep, and any path where `expiresAt` is missing; touching the template triggers the migration requirement.

## Self-review notes

- Spec coverage: limitation 1 → Tasks 1–3 (interface, in-memory, Redis factory, oidc wiring, withIGRPAuth option, cross-pod recovery); limitation 2 → Task 4 (adaptive scheduler). Both verified end-to-end in Task 5.
- Type consistency: `IGRPTokenRecoveryStore.get/set` signatures match across token-store.ts, oidc.ts delegate, config.ts option, and all test doubles. `getRecoveredToken(refreshToken: string | undefined): Promise<JWT | null>` matches all call sites (config.ts jwt callback, performRefresh failure branch, tests).
- Line numbers are anchors from the current `dev` branch (commit 381a2129); executors should locate the named code blocks rather than trusting offsets blindly.
