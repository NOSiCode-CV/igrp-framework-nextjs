# Design — Refresh-token rotation recovery (in-memory)

- **Date:** 2026-06-03
- **Author:** Fidel da Luz (with Claude)
- **Status:** Approved design — pending implementation plan
- **Package:** `@igrp/framework-next-auth` (no template change)
- **Related:** `docs/2026-06-03-refresh-token-flow-review.md` (risk #1, now confirmed)

## Problem

The IGRP IdP (Spring Authorization Server) **rotates** refresh tokens
(`reuseRefreshTokens=false`) — confirmed live via a dev diagnostic:

```
[oidc.refreshOidcAccessToken] refresh-token rotation { rotated: true }
```

NextAuth v4 runs the jwt callback on every session read, including React Server
Component (RSC) layouts where `cookies()` is read-only. The template's
refresh-capable RSC read (`verifySession()` → `getServerSession()` in
`(igrp)/layout.tsx`) therefore refreshes but **cannot persist** the result.

With rotation this is a logout bug, reproduced end-to-end from a live log:

1. RSC navigation refreshes: IdP rotates `RT0 → RT1`. RSC cannot persist `RT1`;
   the cookie keeps the now-consumed `RT0`.
2. The next `/api/auth/session` poll decodes the stale cookie (`RT0`) and
   refreshes with it → IdP returns `invalid_grant` → `error:
   'RefreshAccessTokenError'`, `forceLogout: true`.
3. `IGRPSessionWatcher` redirects to `/logout` → IdP `/connect/logout` → HTTP
   401 page. The user is logged out of a healthy session ~one refresh cycle
   after login.

The 401 logout page is a **downstream symptom**, not the root cause. Fixing the
rotation race removes the spurious logout entirely.

## Goal

When a refresh rotates the token in a context that cannot persist it (RSC),
**recover** the rotated token on the next persist-capable read (the client
session poll or a server action) instead of replaying the consumed token and
logging the user out. Per the agreed behavior: *best-effort recover, then
proceed; log out only when the refresh token is genuinely dead.*

Non-goals: multi-pod-without-stickiness correctness (kept as a documented
limitation with a pluggable seam); any template change; changing the
introspection or logout semantics for genuinely-dead tokens.

## Approach (selected)

**In-memory rotation-result recovery cache**, extending the existing in-flight
dedup in `oidc.ts`.

- `inflightRefreshes` collapses **concurrent** refreshes sharing a token.
- The new `recoveryCache` bridges **sequential** refreshes — the RSC-then-poll
  gap the dedup misses.

Deployment assumption: **single instance or sticky sessions** — the same tier
the existing `inflightRefreshes` already assumes. Stateless multi-pod stays a
documented limitation.

### Data structure

A module-scoped map in `oidc.ts`, beside `inflightRefreshes`:

```
recoveryCache: Map<oldRefreshToken, { result: JWT; expiresAt: number }>
```

Keyed by the **consumed** refresh token; the value is the rotated `JWT` outcome
plus an absolute expiry timestamp.

### Control flow

The jwt callback's expired-token branch (`config.ts`) is reordered so recovery
runs **before** introspection. This is load-bearing: after rotation the old
refresh token reads `active: false`, so introspection would otherwise
short-circuit the stale-cookie poll straight to `forceLogout` and the recovery
cache would never be consulted.

```
1. getRecoveredToken(token.refreshToken)
     → hit:  use the recovered token. No introspection, no IdP call. Done.
2. else introspect the refresh token
     → inactive: { error: 'RefreshAccessTokenError', forceLogout: true }
3. else refreshOidcAccessToken(...)
     → on a ROTATING success (new RT ≠ old RT): populate recoveryCache[oldRT]
```

### Worked example (the reproduced bug, fixed)

- **RSC nav:** cache miss → introspect (old RT still active) → refresh → IdP
  rotates `RT0 → RT1`. RSC cannot persist `RT1`, but populates
  `recoveryCache[RT0] = { result: RT1-JWT, expiresAt }` and serves `RT1` for the
  current request.
- **Next poll** (persist-capable): decodes stale cookie (`RT0`) → cache **hit**
  → returns the `RT1` JWT → NextAuth persists it. Cookie heals. No introspection,
  no second IdP call, no `invalid_grant`, no logout.

### Invariants

- **Populate only on real rotation** (`new RT ≠ old RT`). On reuse the cookie's
  token still works, so nothing is cached.
- **Peek, do not delete on read.** Both the RSC read and the poll may hit the
  same entry before one persists; the entry self-evicts by TTL once the cookie
  holds `RT1`.
- **Cache hit returns the result verbatim.** If its access token is already
  stale, the system self-corrects on the next read (the cookie now holds a valid
  `RT1`) — no chaining logic in the cache.
- **`inflightRefreshes` is unchanged.** The two mechanisms are complementary.
- **Logout semantics unchanged.** A genuinely dead token (revoked/expired, not
  in the cache) still introspects inactive or returns a 4xx → `forceLogout`. The
  cache removes only the false-positive logout of a rotation race.

## Lifecycle

- **TTL:** `RECOVERY_TTL_MS = 180_000` (3 min). The entry must outlive the gap
  between an RSC rotation and the next persisting poll. With the poll at 150s and
  the access token ~180s, 180s guarantees a poll lands inside the window while
  keeping a soon-stale refresh token in memory only briefly. A code comment
  couples this constant to the access-token lifetime / poll interval.
- **Eviction:** opportunistic — drop entries past `expiresAt` on every
  `getRecoveredToken` and populate. Plus a hard size cap (`RECOVERY_MAX_ENTRIES
  = 5000`): on overflow, sweep expired entries, then drop oldest if still over. A
  runaway backstop, not an expected path.

## Security

- Refresh tokens sit in **server process memory** for ≤180s — the same tokens
  already transit memory during a normal refresh, so this widens the window
  modestly, not the exposure surface. In-memory only; nothing on disk; cleared on
  process exit.
- **Never logged.** The recovery path logs booleans/shape only (e.g.
  `{ recovered: true }`), never the token — consistent with existing diagnostics.
- Keyed by the consumed token, so a result is served only to a caller that
  already presented that exact token (i.e. already held the cookie).

## Multi-pod limitation & seam

In-memory state means a cross-pod sequential race (RSC on pod A, poll on pod B)
misses the cache → falls through to introspection/4xx → logout. This is the
**same** limitation already documented for `inflightRefreshes`.

The recovery logic is factored behind a small internal seam (a
`RecoveryStore`-shaped interface: `get(key)`, `set(key, result, ttlMs)`) so a
shared-store implementation (e.g. Redis) can drop in later without touching the
callback. We ship the in-memory implementation only.

## Public surface (oidc.ts)

- `getRecoveredToken(refreshToken: string | undefined): JWT | null` — returns a
  cached rotated result if present and unexpired; null otherwise. Pure peek (no
  delete, no network).
- `refreshOidcAccessToken(token, env)` — unchanged signature; gains a side
  effect: on a rotating success it populates `recoveryCache[oldRT]`. Return
  values are unchanged for existing callers.

## Testing

### Unit — `oidc.test.ts`

1. After a rotating refresh, a second call with the **old** RT returns the cached
   result with **no second token-endpoint call**.
2. **Reuse** (new RT == old RT) creates **no** entry → a second old-RT call hits
   the IdP again.
3. Entry **expires** after TTL (vitest fake timers) → an old-RT call goes to the
   IdP.
4. `getRecoveredToken` returns `null` for an unknown token.

Module-scoped maps reset via the existing `vi.resetModules()` in `afterEach`.

### Integration — `config.test.ts`

5. Simulate the bug: first jwt-callback pass rotates (RSC-like, cannot persist);
   second pass with the stale cookie token **recovers and does NOT
   `forceLogout`**, and **introspection is not consulted** on the recovery hit.

## Scope & release

- **Files:** `src/oidc.ts` (recovery cache + populate + `getRecoveredToken` +
  optional `RecoveryStore` seam), `src/config.ts` (callback reorder). Tests in
  `src/__tests__/oidc.test.ts` and `src/__tests__/config.test.ts`.
- **No template change.** The template poll already persists.
- **Remove** the temporary `rotated` diagnostic in `performRefresh` — its
  question is answered (`true`).
- **Changeset:** extend the existing `.changeset/refresh-retry-secret-fallback.md`
  (same release, same package, `patch`) rather than add a second.
- **Build:** `pnpm build:framework` (publishable package, downstream consumers).
- **Release:** deferred per prior decision — not versioned/published in this work.
