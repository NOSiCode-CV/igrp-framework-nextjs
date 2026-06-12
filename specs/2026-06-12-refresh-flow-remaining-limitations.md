# Spec: Refresh Flow — Remaining Limitations

- **Date:** 2026-06-12
- **Status:** Draft (pending review)
- **Source:** Follow-up to the refresh-flow hardening merged to `dev` at `3b426bb0` (plan: `docs/superpowers/plans/2026-06-11-refresh-multipod-and-adaptive-refetch.md`). That work delivered the pluggable `IGRPTokenRecoveryStore` seam (in-memory default; shared-store implementation deliberately left to consumers — the Redis adapter initially shipped was reverted on 2026-06-12), cross-replica recovery on `invalid_grant`, and adaptive pre-expiry refresh in `IGRPSessionWatcher`. This spec covers what was deliberately left open.
- **Scope:** Production-readiness for multi-replica deployments, refresh observability, and session-lifetime alignment. No breaking API changes; no Auth.js v5 migration.

## Conventions

- **Severity:** `P1` = required before the triggering deployment scenario · `P2` = hardening / latent risk · `P3` = debt / polish.
- Every change to a publishable package requires a **`patch` changeset** (repo hard rule — never `major`/`minor` in pre-release mode).
- Every change that touches `templates/demo-legacy` must ship a paired **template-migrator migration** (drift gate enforces this at release).
- After any public-API change: `pnpm build:framework` in dependency order before consuming downstream.

## Trigger context

The in-memory recovery store is correct for single-instance and sticky-routed deployments — **none of this is urgent until a multi-replica, non-sticky deployment is planned.** RL-1 and RL-4 become `P1` the moment that rollout is scheduled; RL-2 should land with them so the store's effectiveness is measurable. RL-3 and RL-5 are independent polish.

---

## 1. Multi-replica wiring

### RL-1 (P2 → P1 at multi-replica rollout) — Shared recovery store is a seam with no consumer

`withIGRPAuth({ tokenRecoveryStore })` exists, but nothing wires it. Every deployment runs the per-process in-memory default; the cross-replica `invalid_grant` recovery check has nothing shared to read from. A multi-pod, non-sticky deployment today still intermittently logs users out on rotation races.

> **Decision required before implementation:** which shared infrastructure backs the store. **Redis is explicitly NOT bundled or prescribed** (project decision 2026-06-12 — the framework ships only the `IGRPTokenRecoveryStore` interface and the in-memory default; no storage client dependency). Candidate backings to evaluate with ops, using whatever the IGRP platform already operates: an existing shared cache/DB service, a small AM-side endpoint, or — if ops prefers it — an external key-value store as a consumer-supplied adapter. Whatever is chosen implements the two-method interface (`get`/`set` with TTL semantics) in the consuming app, not in the framework.

**Constraint that shapes the design:** `templates/demo-legacy/src/middleware.ts` imports `auth` from `src/lib/auth.ts`, so `lib/auth.ts` is part of the **Edge bundle**. A storage client (TCP sockets, Node APIs) must never be imported there, even transitively. The store singleton in `@igrp/framework-next-auth` is `globalThis`-backed, so registration does not have to happen in `lib/auth.ts` at all — any Node-runtime module that runs before the first session read can call `configureOidcTokenRecoveryStore()`.

**Fix (template, `templates/demo-legacy`):**

1. New env var in `.env.example`: `IGRP_SESSION_STORE_URL` (name per chosen backend) — unset (default) → in-memory store, current behavior. Set → shared recovery store.
2. Register the store in **`src/instrumentation.ts`** (Next.js instrumentation hook — runs once per server start, Node runtime only), guarded by `process.env.NEXT_RUNTIME === 'nodejs'` and a dynamic `import()` of the adapter so neither the Edge bundle nor store-less deployments pay for it:
   - create the client lazily, connect with a bounded timeout, and call `configureOidcTokenRecoveryStore(adapter)`;
   - on connection failure: log one structured warning and **fall back to the in-memory default** — a missing store must never block startup or auth.
3. Adapter implementation guidance: hash keys (SHA-256 of the consumed refresh token) so raw tokens never appear as store keys; JSON-serialize values; honor the TTL passed by the framework (~180 s).
4. Ship the paired **template-migrator migration** (env.add + file.create/write for `instrumentation.ts` + any deps change).

**Acceptance:**
- Store env unset → behavior byte-identical to today (no storage-client import anywhere in the build output; `pnpm build:demo` Edge middleware bundle unchanged).
- Set and reachable → two app instances sharing the store: kill stickiness, force a rotation on instance A, replay the consumed token on instance B → B recovers the session (no `/logout` bounce). Verifiable locally with two `next start` ports behind a round-robin proxy.
- Set and unreachable → app starts, auth works, one warning logged, in-memory fallback active.
- Drift gate green (migration paired).

### RL-4 (P3, pairs with RL-1) — Multi-replica deployment & security documentation

A shared recovery store holds **live rotated JWTs as values** (keys should be hashed; values are not encrypted). This is inherent to the feature and currently documented only in JSDoc.

**Fix:** `templates/demo-legacy/docs/MULTI-REPLICA.md` (and a pointer from `README`): when the shared store is required (replicas > 1 and no sticky sessions), how to enable it (RL-1 env vars), backend security requirements (private network / ACL / TLS, no shared multi-tenant instance), TTL behavior (~180 s self-eviction), and the explicit statement that sticky-session deployments do **not** need it. Ship via the same migration as RL-1 (docs are template files).

**Acceptance:** doc exists, drift gate green; README links to it from the auth/session section.

---

## 2. Observability (`@igrp/framework-next-auth`)

### RL-2 (P2) — Refresh outcomes are invisible in production

Today the only signals are dev-mode `console.warn`s and a warn-once on store failure. In production there is no way to answer: how often do refreshes fail, how often does rotation recovery fire (pre-flight vs post-`invalid_grant`), is the shared store earning its keep, is the IdP returning fresh id_tokens. Without this, RL-1's rollout cannot be validated.

**Fix:** a structured, pluggable event hook on `withIGRPAuth`:

```ts
type IGRPRefreshEvent =
  | { type: 'refresh_success'; rotated: boolean; durationMs: number }
  | { type: 'refresh_failed'; permanent: boolean; status?: number; attempts: number }
  | { type: 'recovery_hit'; phase: 'preflight' | 'post_failure' }
  | { type: 'store_error'; op: 'get' | 'set'; error: unknown }
  | { type: 'introspection_inactive' };

withIGRPAuth({ onRefreshEvent?: (event: IGRPRefreshEvent) => void });
```

- Emit from `oidc.ts` (`performRefresh`, recovery paths, store catch blocks) and the jwt callback (introspection gate). Hook errors are swallowed (an observer must never break auth).
- Default when unset: current behavior (dev warns only) — zero new output in production.
- Like the store, the hook registration must be `globalThis`-backed so all bundled copies of `oidc.ts` (tsup inlines per entry) emit to the same hook.
- Consumers can fan out to pino/OTel/Datadog; the package stays dependency-free.

**Acceptance:** vitest coverage proving each event fires on its path (success+rotation, permanent 4xx, transient retry then success, pre-flight and post-failure recovery hits, store get/set throw); a throwing hook does not affect refresh results; no events and no console output in production when the hook is unset.

---

## 3. Session-lifetime alignment

### RL-3 (P3) — Refresh-token expiry is invisible; session cookie lifetime is hand-tuned

`IGRP_SESSION_MAX_AGE` must be manually aligned to the IdP's refresh-token lifetime. When the refresh token expires server-side before the cookie does, the user discovers it only as a failed refresh (`invalid_grant`) → `/logout` bounce mid-action. Some IdPs (Keycloak; Spring AS configurable) return `refresh_expires_in` on the token response — currently discarded.

**Fix (best-effort, no behavior change when the IdP omits the field):**

1. In `performRefresh` and the initial sign-in mapping (`config.ts` jwt callback), capture `refresh_expires_in` when present → `refreshExpiresAt` (ms) on the JWT; expose on the session via the session callback.
2. In the jwt callback, when `refreshExpiresAt` is known and already past, skip introspection + the doomed grant and flag `error: 'RefreshAccessTokenError', forceLogout: true` directly (saves two IdP round-trips on a known-dead session).
3. In `IGRPSessionWatcher` (`@igrp/framework-next-ui`), when `session.refreshExpiresAt` is known, schedule the existing `/logout` routing **proactively** at expiry instead of waiting for the next failed refresh — the user lands on login cleanly instead of losing in-flight work.
4. Document in `.env.example` that `IGRP_SESSION_MAX_AGE` remains the fallback when the IdP does not emit `refresh_expires_in`.

**Acceptance:** with a mocked token response containing `refresh_expires_in`, the JWT and session carry `refreshExpiresAt`; a session read past that moment short-circuits to `forceLogout` without hitting the IdP (assert zero fetch calls); without the field, behavior is byte-identical to today. Watcher change verified by build (no test runner in next-ui) + template smoke test.

### RL-5 (P3) — `refetchInterval=0` foot-gun outside preview mode

The adaptive timer in `IGRPSessionWatcher` reschedules off session-context updates, which (same-tab) arrive via the fixed poll or focus refetch. Setting `IGRP_SESSION_REFETCH_INTERVAL=0` with auth enabled silently degrades the adaptive chain to one-shot.

**Fix:** in `templates/demo-legacy/src/lib/config/get-session-args.ts`, treat `0`/negative the same as unset when **not** in preview mode (clamp to the 150 s default + one dev warning). Preview mode keeps `refetchInterval: 0`. Paired migration required.

**Acceptance:** `IGRP_SESSION_REFETCH_INTERVAL=0` with preview off yields 150 s + dev warning; preview mode still disables refetch; drift gate green.

---

## Non-goals (explicitly accepted)

- **Distributed in-flight refresh lock.** Concurrent refreshes across pods cost one redundant IdP round-trip; the loser recovers via the shared store. A cross-pod lock adds latency and a failure mode for marginal gain. Revisit only if RL-2 telemetry shows material `invalid_grant`-then-recover volume.
- **Auth.js v5 / server-side session store migration.** Would eliminate the RSC cookie-persistence gap at the root, but is a separate, breaking workstream.
- **Same-tab session broadcast rework.** NextAuth v4's storage-event broadcast skipping the originating tab is upstream behavior; RL-5 keeps the fallback poll alive instead.
- **Clock-skew compensation in the adaptive timer.** The fixed poll backstops skewed clients; not worth client/server time negotiation.
- **Encrypting recovery-store values.** The session cookie already holds the same tokens NextAuth-encrypted; the store's TTL is ~180 s and RL-4 mandates a trusted backend. Application-layer encryption would add a key-distribution problem disproportionate to the exposure window.

## Suggested sequencing

1. **RL-2** (next-auth only, no template change) — telemetry first, so RL-1's rollout is measurable.
2. **RL-1 + RL-4** together (one template migration) — when a multi-replica deployment is scheduled.
3. **RL-3** (next-auth + next-ui) and **RL-5** (template) — independent, any time; RL-5 can ride RL-1's migration train if concurrent.

## Affected packages

| Item | next-auth | next-ui | template (+ migration) | migrator |
|---|---|---|---|---|
| RL-1 | — | — | env + instrumentation.ts + optional dep | migration N |
| RL-2 | events hook | — | — | — |
| RL-3 | refreshExpiresAt | watcher proactive logout | .env.example docs | (docs-only; confirm drift-gate treatment) |
| RL-4 | — | — | docs/MULTI-REPLICA.md | rides RL-1 migration |
| RL-5 | — | — | get-session-args clamp | migration (or rides RL-1) |
