# Review — Refresh-token flow (`demo-legacy` + `framework-next-auth`)

- **Date:** 2026-06-03
- **Reviewer:** Fidel da Luz (with Claude)
- **Scope:** OIDC access/refresh-token lifecycle: storage, proactive refresh,
  introspection, rotation, propagation, failure handling, and how the template
  consumes it. Analysis only — one fix applied (see Status).
- **Primary source:** `packages/framework/next-auth/src/{config.ts,oidc.ts}`,
  consumed by `templates/demo-legacy/src/{middleware.ts,lib/auth.ts,lib/dal.ts,
  app/(igrp)/layout.tsx,actions/igrp/layout.ts}` and
  `framework-next-ui/.../session-watcher.tsx`.

## Flow map

```
LOGIN  (config.ts jwt callback, account branch)
  store access_token, id_token, refresh_token, expiresAt(=expires_at*1000)   [config.ts:429-441]

EVERY SESSION READ  (jwt callback runs per read)
  if now < expiresAt - 60s  → return as-is, clear stale error/forceLogout     [config.ts:453-461]
  else (expired or within 60s buffer):
     introspect REFRESH token (RFC 7662, fail-open)                           [oidc.ts:341]
        inactive → error=RefreshAccessTokenError, forceLogout                 [config.ts:467-468]
        active   → performRefresh()                                           [config.ts:470-475]

REFRESH  (oidc.ts)
  dedupe concurrent calls by refresh_token key (in-memory Map)                [oidc.ts:103-124]
  POST grant_type=refresh_token, scope forced to include openid               [oidc.ts:147-165]
     !ok / no access_token → error=RefreshAccessTokenError, forceLogout       [oidc.ts:167-183]
     ok → accessToken, idToken(||old), expiresAt=now+expires_in,
          refreshToken(rotated||old), clear error                             [oidc.ts:204-213]

PROPAGATE  session callback maps accessToken/idToken/error/expiresAt/forceLogout  [config.ts:483-498]

CONSUME the failure signal (three independent gates):
  middleware    isTokenExpiredOrFailed → expiresAt ≤ now+10s OR error → /login  [config.ts:626-630]
  server layout getSession → providerExpired(now+60s) OR refreshFailed → onSessionExpired()=/logout  [config.ts:671-684]
  client        IGRPSessionWatcher → error===RefreshAccessTokenError → /logout  [session-watcher.tsx:45-50]

LOGOUT  events.signOut → revokeOidcSession(refresh_token)                     [oidc.ts:230-285]
```

## Measured facts (from a live login capture, 2026-06-02)

| Token | iat | exp | Lifetime |
|---|---|---|---|
| access_token | 1780487027 | expires_at 1780487204 | **177s (~3 min)** |
| id_token | 1780487027 | 1780488827 | 1800s (30 min) |

`expiresAt` stored = `expires_at × 1000` (confirmed `1780487204000` in the
signOut log). The IdP issues a **~3-minute** access token — not the 5 minutes the
env comments assumed.

## Strengths

1. **Proactive refresh** with a 60s buffer ([config.ts:453]) — refreshes before expiry.
2. **In-flight refresh de-duplication** ([oidc.ts:91-124]) — collapses concurrent
   refreshes (RSC + poll + action) into one round-trip + one cookie write,
   defeating the rotation race. (In-memory → single-process only.)
3. **Introspect-before-grant, fail-open** ([oidc.ts:341]) — detects server-side
   revocation early; a flaky introspection never blocks a refresh. Correctly
   introspects the refresh token, not the expired access token.
4. **Coordinated expiry windows** — jwt refreshes at −60s, middleware stays
   lenient (−10s grace) ([config.ts:74-81]).
5. **Stale-flag clearing** in the valid path ([config.ts:454-456]) — prevents a
   leftover error flag from looping the user to /logout.
6. **Refresh re-requests `openid`** so the id_token (and its `sid`) stays fresh
   for logout ([oidc.ts:147-151]).
7. **Discovery caching + timeouts** ([oidc.ts:36-78]) — 5-min TTL, poisoned-entry
   eviction, hard timeout on IdP round-trips.
8. **Clean template consumption** — three failure gates (middleware/server/client)
   are consistent and loop-safe.

## Risks (prioritized)

**🔴 1. Server-Component refresh cannot persist the rotated cookie.**
The jwt callback runs on every session read, including RSC layouts where
`cookies()` is read-only. Only `/api/auth/session` (client poll), middleware, and
server actions can write cookies. The template's refresh-capable read is
`verifySession()` in `(igrp)/layout.tsx` → `getServerSession` — an **RSC** path.
If the IdP **rotates** refresh tokens, the new token issued during an RSC refresh
is discarded; the next request replays the consumed old one → `invalid_grant` →
logout. If the IdP **reuses** refresh tokens, this degrades to redundant refresh
round-trips (perf), not logout. **Depends on the IdP's `reuseRefreshTokens`
setting — verify it.** (The RP itself is rotation-agnostic: `oidc.ts:209`
`refresh_token ?? token.refreshToken` handles both.)

**🔴 2. Refetch interval was ≫ access-token TTL → spurious /login bounces.**
`IGRP_SESSION_REFETCH_INTERVAL` was `900s` vs a `177s` token. The persisted
cookie's expiry governs the middleware bounce (`expiresAt − 10s = ~167s`). RSC
refreshes succeed but don't persist, so after ~167s a navigation is bounced to
/login despite a healthy refresh token — until a poll/focus-refetch persists.
The `TOKEN_EXPIRY_GRACE_MS = 10s` leniency is ~90× too small to bridge a 900s
poll. **FIXED** — see Status.

**🟠 3. No retry on a transient refresh failure.** A single network blip in
`performRefresh` → `RefreshAccessTokenError` + `forceLogout` → immediate logout
([oidc.ts:167-183]). With a 177s TTL, refreshes are frequent. Consider one
bounded retry on network/5xx only (never on `invalid_grant`).

**🟠 4. Multi-instance rotation race (acknowledged).** `inflightRefreshes` is
per-process ([oidc.ts:101-102]). Across pods, concurrent refreshes still race →
spurious logout. Needs sticky sessions or a shared lock in multi-pod deploys.

**🟡 5. `getAccessToken` weaker secret fallback.** Uses `secret || ''`
([config.ts:646]) vs `secret || process.env.NEXTAUTH_SECRET` elsewhere
([config.ts:622]). An empty-string secret silently fails to decode. Unify.

**🟡 6. Dead `invalid_grant` branch.** `isTokenExpiredOrFailed` checks
`token.error === 'invalid_grant'` ([config.ts:629]), but `token.error` is only
ever set to `'RefreshAccessTokenError'` or `undefined` — the IdP's `invalid_grant`
response body is flattened upstream ([oidc.ts:167-173]). The branch is
unreachable. Harmless (both trigger the same redirect), but misleading. Either
remove it, or have `performRefresh` parse and surface the real OAuth error code.

**🟡 7. Session cookie lifetime = NextAuth default (~30 days).** Template passes
no `session` config to `withIGRPAuth`. Consider an explicit `session.maxAge`
aligned to the refresh-token lifetime.

**🟡 8. Introspection adds a round-trip before every refresh.** Functionally
fine, but partly redundant (the refresh grant itself returns `invalid_grant` if
revoked). At 177s TTL it runs often; drop it if refresh latency matters.

## Trace: who triggers a refresh per navigation (template)

| Call site | Path | Refreshes? | Persists cookie? |
|---|---|---|---|
| `app/layout.tsx` | `configLayout()` → `getAccessToken()` → `getToken()` | No (decode) | n/a |
| `(igrp)/layout.tsx` | `verifySession()` → `getSession()` → `getServerSession()` | **Yes** | **No** (RSC) |
| `(igrp)/layout.tsx` | `configLayout()` → `getAccessToken()` → `getToken()` | No (decode) | n/a |
| middleware | `getTokenFromRequest()` → `getToken()` | No (decode) | (could; doesn't) |
| `getLogoutUrl` etc. | `getAccessToken()` → `getToken()` | No (decode) | n/a |
| client poll / focus | `/api/auth/session` (route handler) | **Yes** | **Yes** ✅ |

`getToken()` only decodes — it never runs the jwt callback. So only
`getServerSession` (the RSC `verifySession`) and the client poll refresh; of
those, only the poll persists. `verifySession` is `cache()`-wrapped → one
refresh-capable jwt run per request.

## Recommendations

1. **Align `IGRP_SESSION_REFETCH_INTERVAL` with the access-token TTL.** Done (120s).
   Cleanest lever; also defuses #1 by moving rotation onto the persisting poll.
2. **Confirm the IdP's `reuseRefreshTokens` setting** — decides whether #1 is a
   logout bug (rotation) or just inefficiency (reuse).
3. **Add a network-only retry to `performRefresh`** (#3).
4. Tidy-ups: unify `getAccessToken` secret fallback (#5), remove/repurpose the
   `invalid_grant` branch (#6), set explicit `session.maxAge` (#7). These touch
   the published `framework-next-auth` → require a changeset + build + publish.

## Status

Recommendations applied 2026-06-03 (follow-up pass):

- **#2 (refetch interval) — DONE in source.** Template default
  `DEFAULT_REFETCH_INTERVAL_SECONDS` 180 → 150 (below the measured ~177s TTL),
  comment + `.env.example` (now 150, with rationale) corrected. The local `.env`
  override (120) still applies on top for dev.
- **#3 (no refresh retry) — DONE.** `performRefresh` now retries the grant once
  on a transient failure (network error/timeout or 5xx) and is time-boxed via
  `fetchWithTimeout`; 4xx (`invalid_grant`, …) is never retried. Covered by new
  tests in `oidc.test.ts` (`refreshOidcAccessToken — transient retry`).
- **#5 (getAccessToken secret) — DONE.** `secret || ''` → `secret ||
  process.env.NEXTAUTH_SECRET`, matching `getTokenFromRequest`.
- **#6 (dead invalid_grant branch) — DONE.** Removed the unreachable
  `token.error === 'invalid_grant'` check in `isTokenExpiredOrFailed`;
  `'RefreshAccessTokenError'` is the single canonical failure flag.
- **#7 (session.maxAge) — DONE (env-configurable).** Template reads optional
  `IGRP_SESSION_MAX_AGE` (seconds) and passes `session.maxAge` only when set;
  unset preserves the NextAuth default. Documented in `.env.example`.
- **#8 (introspection round-trip) — KEPT.** Retained for early revocation
  detection; fail-open already prevents it from blocking refresh.
- **#1 (IdP `reuseRefreshTokens`) — INSTRUMENTED, awaiting a reading.** A
  **temporary dev-only** log was added in `performRefresh` (`oidc.ts`):
  `[oidc.refreshOidcAccessToken] refresh-token rotation { rotated }`. Run
  `pnpm dev:demo`, stay logged in past one refresh (~150s), read the server log.
  `rotated: true` → IdP rotates → the RSC-refresh path is a real logout risk;
  `rotated: false` → reuse → benign. **Remove this diagnostic before
  versioning/publishing `framework-next-auth`.**
- **#4 (multi-pod rotation race) — STILL OPEN.** Needs sticky sessions or a
  shared lock; not addressable in-package.

Release: `@igrp/framework-next-auth` changes (#3, #5, #6) have a changeset
(`.changeset/refresh-retry-secret-fallback.md`, patch) and the package builds +
tests pass (83). **Not yet versioned/published** — awaiting authorization.
