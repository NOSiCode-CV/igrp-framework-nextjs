# Refresh-token Rotation Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the spurious logout caused by the IdP rotating refresh tokens during an RSC refresh that can't persist its cookie, by recovering the rotated token on the next persist-capable read.

**Architecture:** Add an in-memory, TTL-bounded recovery cache to `@igrp/framework-next-auth`'s `oidc.ts`, keyed by the *consumed* refresh token. `refreshOidcAccessToken` populates it on a rotating refresh; a new `getRecoveredToken` peeks it. The jwt callback in `config.ts` checks recovery *before* introspection (load-bearing: a rotated old token reads `active: false`). No template change.

**Tech Stack:** TypeScript, NextAuth v4, tsup, Vitest. Package: `packages/framework/next-auth`. Lint/format: Prettier. Commands run from the repo root unless noted.

---

## File Structure

- **Modify** `packages/framework/next-auth/src/oidc.ts` — add `recoveryStore` (the in-memory seam), `RECOVERY_TTL_MS`/`RECOVERY_MAX_ENTRIES`, exported `getRecoveredToken`; populate the cache inside `performRefresh` on rotation; remove the temporary `rotated` diagnostic.
- **Modify** `packages/framework/next-auth/src/config.ts` — import `getRecoveredToken`; reorder the jwt-callback expired branch to check recovery before introspection.
- **Modify** `packages/framework/next-auth/src/__tests__/oidc.test.ts` — unit tests for the cache.
- **Modify** `packages/framework/next-auth/src/__tests__/config.test.ts` — add `getRecoveredToken` to the `../oidc` mock; integration tests for the callback reorder.
- **Modify** `.changeset/refresh-retry-secret-fallback.md` — append a bullet (same release, `@igrp/framework-next-auth`, `patch`).

---

## Task 1: Recovery cache + populate in `oidc.ts`

**Files:**
- Modify: `packages/framework/next-auth/src/oidc.ts`
- Test: `packages/framework/next-auth/src/__tests__/oidc.test.ts`

- [ ] **Step 1: Write the failing tests**

Add this block to `packages/framework/next-auth/src/__tests__/oidc.test.ts`, immediately before the `describe('buildEndSessionUrl', () => {` line:

```ts
describe('refreshOidcAccessToken — rotation recovery cache', () => {
  it('caches the rotated result so getRecoveredToken returns it for the old token', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      {
        url: MOCK_DISCOVERY.token_endpoint,
        body: { access_token: 'new-at', refresh_token: 'new-rt', expires_in: 3600, id_token: 'new-id' },
      },
    ]);
    const { refreshOidcAccessToken, getRecoveredToken } = await import('../oidc');

    const result = await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);
    expect(result.refreshToken).toBe('new-rt');

    const recovered = getRecoveredToken('old-rt');
    expect(recovered).not.toBeNull();
    expect(recovered!.refreshToken).toBe('new-rt');
    expect(recovered!.accessToken).toBe('new-at');
    expect(recovered!.error).toBeUndefined();
    expect(recovered!.forceLogout).toBe(false);
  });

  it('does not cache when the refresh token is reused (no rotation)', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      {
        url: MOCK_DISCOVERY.token_endpoint,
        body: { access_token: 'new-at', refresh_token: 'old-rt', expires_in: 3600, id_token: 'new-id' },
      },
    ]);
    const { refreshOidcAccessToken, getRecoveredToken } = await import('../oidc');

    await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);
    expect(getRecoveredToken('old-rt')).toBeNull();
  });

  it('expires a cached rotation after the TTL', async () => {
    vi.useFakeTimers();
    try {
      mockFetch([
        { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
        {
          url: MOCK_DISCOVERY.token_endpoint,
          body: { access_token: 'new-at', refresh_token: 'new-rt', expires_in: 3600 },
        },
      ]);
      const { refreshOidcAccessToken, getRecoveredToken } = await import('../oidc');

      await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);
      expect(getRecoveredToken('old-rt')).not.toBeNull();

      vi.advanceTimersByTime(180_000 + 1000);
      expect(getRecoveredToken('old-rt')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('getRecoveredToken returns null for an unknown or missing token', async () => {
    const { getRecoveredToken } = await import('../oidc');
    expect(getRecoveredToken('never-seen')).toBeNull();
    expect(getRecoveredToken(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd packages/framework/next-auth && npx vitest run src/__tests__/oidc.test.ts -t "rotation recovery cache"`
Expected: FAIL — `getRecoveredToken is not a function` / `not exported`.

- [ ] **Step 3: Add the recovery store + `getRecoveredToken`**

In `packages/framework/next-auth/src/oidc.ts`, immediately after the `inflightRefreshes` declaration (the line `const inflightRefreshes = new Map<string, Promise<JWT>>();`), insert:

```ts
// Rotation-result recovery cache. NextAuth runs the jwt callback on every
// session read, including RSC renders where `cookies()` is read-only. When the
// IdP ROTATES refresh tokens, a refresh that runs inside an RSC render rotates
// the token but cannot persist it; the next read replays the consumed token and
// the IdP rejects it with `invalid_grant`, logging the user out of a healthy
// session. Keyed by the CONSUMED refresh token, this remembers the rotated
// result for a short window so the next persist-capable read (the client
// session poll or a server action) can recover and persist it.
//
// Where `inflightRefreshes` collapses CONCURRENT refreshes, this bridges
// SEQUENTIAL ones (an RSC render, then a later poll) — the gap the dedup misses.
//
// TTL is coupled to the access-token lifetime / session poll interval: the entry
// must outlive the gap between an RSC rotation and the next persisting poll.
// With a ~180s access token and a 150s poll, 180s comfortably bridges it while
// holding a soon-stale refresh token in memory only briefly.
//
// In-memory only; multi-instance deployments without sticky sessions can still
// race across pods (same limitation as `inflightRefreshes`). The `recoveryStore`
// object is the seam where a shared store (e.g. Redis) could later drop in.
const RECOVERY_TTL_MS = 180_000;
const RECOVERY_MAX_ENTRIES = 5000;

type RecoveryEntry = { result: JWT; expiresAt: number };

const recoveryStore = (() => {
  const entries = new Map<string, RecoveryEntry>();

  function sweepExpired(now: number) {
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) entries.delete(key);
    }
  }

  return {
    get(refreshToken: string | undefined): JWT | null {
      if (!refreshToken) return null;
      const entry = entries.get(refreshToken);
      if (!entry) return null;
      if (entry.expiresAt <= Date.now()) {
        entries.delete(refreshToken);
        return null;
      }
      return entry.result;
    },
    set(refreshToken: string, result: JWT) {
      const now = Date.now();
      if (entries.size >= RECOVERY_MAX_ENTRIES) {
        sweepExpired(now);
        if (entries.size >= RECOVERY_MAX_ENTRIES) {
          // Still full after sweeping — drop the oldest insertion (Map preserves order).
          const oldest = entries.keys().next().value;
          if (oldest !== undefined) entries.delete(oldest);
        }
      }
      entries.set(refreshToken, { result, expiresAt: now + RECOVERY_TTL_MS });
    },
  };
})();

/**
 * Returns a rotated token previously cached by {@link refreshOidcAccessToken}
 * for the given (now-consumed) refresh token, or null if absent/expired. Pure
 * peek — no network, no deletion-on-read (both an RSC read and the persisting
 * poll may need the same entry before one persists; it self-evicts by TTL).
 */
export function getRecoveredToken(refreshToken: string | undefined): JWT | null {
  return recoveryStore.get(refreshToken);
}
```

- [ ] **Step 4: Populate the cache on a rotating refresh**

In the same file, in `performRefresh`, replace the final return block:

```ts
  return {
    ...token,
    accessToken: refreshedToken.access_token,
    idToken: refreshedToken.id_token || token.idToken,
    expiresAt: Date.now() + (refreshedToken.expires_in ?? 3600) * 1000,
    refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
    authProviderId: providerId,
    error: undefined,
    forceLogout: false,
  };
```

with:

```ts
  const oldRefreshToken = token.refreshToken;
  const newRefreshToken: string = refreshedToken.refresh_token ?? token.refreshToken;
  const refreshed: JWT = {
    ...token,
    accessToken: refreshedToken.access_token,
    idToken: refreshedToken.id_token || token.idToken,
    expiresAt: Date.now() + (refreshedToken.expires_in ?? 3600) * 1000,
    refreshToken: newRefreshToken,
    authProviderId: providerId,
    error: undefined,
    forceLogout: false,
  };

  // The IdP rotated the refresh token. If this refresh ran where the cookie
  // can't be persisted (an RSC render), the rotated token would be lost and the
  // next read would replay the consumed one → invalid_grant → logout. Remember
  // the outcome keyed by the CONSUMED token so the next persist-capable read can
  // recover it. Skip when the token was reused (the cookie's token still works).
  if (newRefreshToken !== oldRefreshToken) {
    recoveryStore.set(oldRefreshToken, refreshed);
  }

  return refreshed;
```

- [ ] **Step 5: Remove the temporary rotation diagnostic**

In the same file, inside `performRefresh`'s dev-mode block, remove the temporary diagnostic. Delete exactly this segment (leave the preceding `console.debug('[oidc.refreshOidcAccessToken] refresh returned a fresh id_token');` and its closing `}` intact):

```ts

    // TEMP DIAGNOSTIC (dev-only): does the IdP rotate refresh tokens? When the
    // returned refresh_token differs from the one we sent, the IdP rotates
    // (`reuseRefreshTokens=false`) — which makes the RSC-refresh-can't-persist
    // path a real logout risk (see docs/2026-06-03-refresh-token-flow-review.md
    // #1). `rotated: false` means the IdP reuses the token and that path is
    // merely a redundant round-trip. Logs a boolean only — never the token.
    // Remove once the rotation behavior is confirmed.
    const rotated =
      typeof refreshedToken.refresh_token === 'string' &&
      refreshedToken.refresh_token.length > 0 &&
      refreshedToken.refresh_token !== token.refreshToken;
    console.debug('[oidc.refreshOidcAccessToken] refresh-token rotation', { rotated });
```

- [ ] **Step 6: Run the new tests to verify they pass**

Run: `cd packages/framework/next-auth && npx vitest run src/__tests__/oidc.test.ts -t "rotation recovery cache"`
Expected: PASS (4 tests).

- [ ] **Step 7: Run the full package suite (no regressions)**

Run: `pnpm --filter @igrp/framework-next-auth test`
Expected: PASS — all prior tests plus the 4 new ones.

- [ ] **Step 8: Format**

Run: `cd packages/framework/next-auth && npx prettier --write src/oidc.ts "src/__tests__/oidc.test.ts"`
Expected: files reported formatted; re-run `npx prettier --check src/oidc.ts "src/__tests__/oidc.test.ts"` → "All matched files use Prettier code style!".

- [ ] **Step 9: Commit**

```bash
git add packages/framework/next-auth/src/oidc.ts packages/framework/next-auth/src/__tests__/oidc.test.ts
git commit -m "feat(next-auth): add in-memory rotation-result recovery cache

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Reorder the jwt callback (recovery before introspection)

**Files:**
- Modify: `packages/framework/next-auth/src/config.ts`
- Test: `packages/framework/next-auth/src/__tests__/config.test.ts`

- [ ] **Step 1: Add `getRecoveredToken` to the `../oidc` mock**

In `packages/framework/next-auth/src/__tests__/config.test.ts`, the `vi.mock('../oidc', …)` factory returns an object. Add a `getRecoveredToken` entry so the real (cache-backed) implementation isn't used and existing tests are unaffected. Change:

```ts
  return {
    ...original,
    revokeOidcSession: vi.fn().mockResolvedValue(undefined),
    introspectOidcToken: vi.fn().mockResolvedValue(true),
    refreshOidcAccessToken: vi.fn().mockResolvedValue({ accessToken: 'refreshed-at', forceLogout: false }),
  };
```

to:

```ts
  return {
    ...original,
    revokeOidcSession: vi.fn().mockResolvedValue(undefined),
    introspectOidcToken: vi.fn().mockResolvedValue(true),
    refreshOidcAccessToken: vi.fn().mockResolvedValue({ accessToken: 'refreshed-at', forceLogout: false }),
    getRecoveredToken: vi.fn().mockReturnValue(null),
  };
```

- [ ] **Step 2: Write the failing integration tests**

Append this block to the end of `packages/framework/next-auth/src/__tests__/config.test.ts`:

```ts
describe('withIGRPAuth — jwt callback rotation recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses a recovered token and skips introspection + refresh on a cache hit', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const jwtCb = instance.authOptions.callbacks?.jwt;
    expect(jwtCb).toBeDefined();

    const recoveredToken = {
      refreshToken: 'new-rt',
      accessToken: 'new-at',
      expiresAt: Date.now() + 180_000,
      error: undefined,
      forceLogout: false,
    };
    (oidcModule.getRecoveredToken as ReturnType<typeof vi.fn>).mockReturnValue(recoveredToken);

    // Expired access token; the cookie still holds the OLD refresh token.
    const expiredToken = { refreshToken: 'old-rt', accessToken: 'old-at', expiresAt: Date.now() - 1000 };

    const result = (await jwtCb!({ token: expiredToken, account: undefined } as any)) as any;

    expect(oidcModule.getRecoveredToken).toHaveBeenCalledWith('old-rt');
    expect(oidcModule.introspectOidcToken).not.toHaveBeenCalled();
    expect(oidcModule.refreshOidcAccessToken).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('new-at');
    expect(result.refreshToken).toBe('new-rt');
    expect(result.forceLogout).toBe(false);
  });

  it('falls through to introspect + refresh when there is no recovered token', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const jwtCb = instance.authOptions.callbacks?.jwt;

    (oidcModule.getRecoveredToken as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const expiredToken = { refreshToken: 'old-rt', accessToken: 'old-at', expiresAt: Date.now() - 1000 };
    await jwtCb!({ token: expiredToken, account: undefined } as any);

    expect(oidcModule.introspectOidcToken).toHaveBeenCalled();
    expect(oidcModule.refreshOidcAccessToken).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd packages/framework/next-auth && npx vitest run src/__tests__/config.test.ts -t "rotation recovery"`
Expected: FAIL — the first test fails because the callback still introspects/refreshes before checking recovery (introspection IS called; recovered token NOT used).

- [ ] **Step 4: Import `getRecoveredToken` in `config.ts`**

In `packages/framework/next-auth/src/config.ts`, change the oidc import:

```ts
import { introspectOidcToken, refreshOidcAccessToken, revokeOidcSession } from './oidc';
```

to:

```ts
import { getRecoveredToken, introspectOidcToken, refreshOidcAccessToken, revokeOidcSession } from './oidc';
```

- [ ] **Step 5: Reorder the expired-token branch**

In the same file, in the jwt callback, replace this block:

```ts
        // Access token expired (or within its refresh buffer). Introspect the
        // refresh token first to catch a server-side revocation before we try
        // to use it (fail-open: a flaky introspection must never block refresh).
        const refreshTokenActive = await introspectOidcToken(igrpToken, env).catch(() => true);
        if (!refreshTokenActive) {
          igrpToken = { ...igrpToken, error: 'RefreshAccessTokenError', forceLogout: true };
        } else {
          try {
            igrpToken = await refreshOidcAccessToken(igrpToken, env);
          } catch {
            igrpToken = { ...igrpToken, error: 'RefreshAccessTokenError', forceLogout: true };
          }
        }
```

with:

```ts
        // Access token expired (or within its refresh buffer).
        //
        // First, try to recover a rotated token from a recent refresh that
        // could not persist its cookie (e.g. a refresh that ran inside an RSC
        // render). This MUST run before introspection: after rotation the old
        // refresh token reads `active: false`, so introspecting here would
        // short-circuit a recoverable session straight to forceLogout.
        const recovered = getRecoveredToken(igrpToken.refreshToken);
        if (recovered) {
          if (env.NODE_ENV !== 'production') {
            console.debug('[next-auth.jwt] recovered rotated refresh token from cache', {
              recovered: true,
            });
          }
          igrpToken = recovered;
        } else {
          // Introspect the refresh token to catch a server-side revocation
          // before we try to use it (fail-open: a flaky introspection must
          // never block refresh).
          const refreshTokenActive = await introspectOidcToken(igrpToken, env).catch(() => true);
          if (!refreshTokenActive) {
            igrpToken = { ...igrpToken, error: 'RefreshAccessTokenError', forceLogout: true };
          } else {
            try {
              igrpToken = await refreshOidcAccessToken(igrpToken, env);
            } catch {
              igrpToken = { ...igrpToken, error: 'RefreshAccessTokenError', forceLogout: true };
            }
          }
        }
```

- [ ] **Step 6: Run the integration tests to verify they pass**

Run: `cd packages/framework/next-auth && npx vitest run src/__tests__/config.test.ts -t "rotation recovery"`
Expected: PASS (2 tests).

- [ ] **Step 7: Run the full package suite (no regressions)**

Run: `pnpm --filter @igrp/framework-next-auth test`
Expected: PASS — all tests.

- [ ] **Step 8: Format**

Run: `cd packages/framework/next-auth && npx prettier --write src/config.ts "src/__tests__/config.test.ts"`
Then: `cd packages/framework/next-auth && npx prettier --check src/config.ts "src/__tests__/config.test.ts"`
Expected: "All matched files use Prettier code style!".

> Note: Prettier may reformat pre-existing lines in `config.ts`. After formatting, run `git diff packages/framework/next-auth/src/config.ts` and confirm only the import line and the reordered branch changed. If Prettier touched unrelated lines, `git checkout -- packages/framework/next-auth/src/config.ts` and re-apply Steps 4–5 by hand (the file had pre-existing style drift).

- [ ] **Step 9: Commit**

```bash
git add packages/framework/next-auth/src/config.ts packages/framework/next-auth/src/__tests__/config.test.ts
git commit -m "fix(next-auth): check rotation recovery before introspection in jwt callback

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Changeset + ordered build verification

**Files:**
- Modify: `.changeset/refresh-retry-secret-fallback.md`

- [ ] **Step 1: Append the recovery-cache bullet to the existing changeset**

Open `.changeset/refresh-retry-secret-fallback.md`. Immediately before its final line (the one beginning `- Removed the unreachable`), the file is a bullet list under the `@igrp/framework-next-auth: patch` frontmatter. Add this bullet to the list (keep it grouped with the others; order among bullets is cosmetic):

```md
- `refreshOidcAccessToken` now caches a rotated refresh-token result in-process (keyed by the consumed token, ~180s TTL) and the jwt callback consults it via `getRecoveredToken` **before** introspection. When the IdP rotates refresh tokens, a refresh that runs in a read-only RSC render no longer orphans the rotated token: the next persist-capable read (the client session poll or a server action) recovers and persists it instead of replaying the consumed token and forcing a logout. In-memory only — multi-instance deployments without sticky sessions can still race across pods.
```

- [ ] **Step 2: Build the package (type-check the public surface)**

Run: `pnpm build:auth`
Expected: `ESM ⚡️ Build success` and `DTS ⚡️ Build success`, no errors. Confirms `getRecoveredToken` emits a valid `.d.ts`.

- [ ] **Step 3: Ordered downstream build**

Run: `pnpm build:framework`
Expected: all packages build in order (`next-auth → next-types → design-system → next-ui → next`) with no errors. Confirms the additive export didn't break downstream consumers.

- [ ] **Step 4: Final full test run**

Run: `pnpm --filter @igrp/framework-next-auth test`
Expected: PASS — full suite green.

- [ ] **Step 5: Update the review/spec status docs**

In `docs/2026-06-03-refresh-token-flow-review.md`, the `## Status` section has a `#1` entry noting the temporary diagnostic. Replace its body so it records the outcome and the implemented fix. Change the `#1` bullet to:

```md
- **#1 (IdP `reuseRefreshTokens`) — CONFIRMED rotating; FIXED in-process.** The
  dev diagnostic returned `rotated: true` (IdP rotates). Implemented an in-memory
  rotation-result recovery cache in `oidc.ts` (`getRecoveredToken` + populate on
  rotation) and reordered the jwt callback to check recovery before
  introspection, so an RSC-render rotation is recovered+persisted by the next
  poll instead of forcing logout. Temporary `rotated` diagnostic removed. Design:
  `docs/superpowers/specs/2026-06-03-refresh-token-rotation-recovery-design.md`.
  Multi-pod-without-stickiness remains a documented limitation (in-memory).
```

- [ ] **Step 6: Commit**

```bash
git add .changeset/refresh-retry-secret-fallback.md docs/2026-06-03-refresh-token-flow-review.md
git commit -m "chore(next-auth): changeset + docs for rotation recovery cache

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Out of scope / explicitly NOT done

- **No release.** Do not run `pnpm version:changesets` or any `release` script — publishing is deferred by prior user decision.
- **No template change.** The template's client poll already persists; the fix is entirely in `framework-next-auth`.
- **No shared-store (Redis) implementation.** The `recoveryStore` object is the seam for it later; in-memory ships now.
- **No middleware self-healing** (the rejected Approach 2).

## Self-review notes

- **Spec coverage:** recovery cache (Task 1), populate-on-rotation-only (Task 1 Step 4), TTL + size cap (Task 1 Step 3), `getRecoveredToken` peek-no-delete (Task 1 Step 3), recovery-before-introspection reorder (Task 2), no-template-change (Out of scope), changeset extension (Task 3), diagnostic removal (Task 1 Step 5), tests (Tasks 1 & 2). All spec sections map to a task.
- **Type consistency:** `getRecoveredToken(refreshToken: string | undefined): JWT | null` and `recoveryStore.get/set` signatures match across the impl (Task 1) and the `config.ts` call site + mock (Task 2). `recoveryStore.set` takes `(refreshToken: string, result: JWT)`; populate passes `(oldRefreshToken, refreshed)` both typed `string`/`JWT`.
- **No placeholders:** every code step shows complete code; every run step shows the command and expected result.
