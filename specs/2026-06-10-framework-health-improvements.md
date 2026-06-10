# Spec: Framework Health — Issues & Improvements

- **Date:** 2026-06-10
- **Status:** Draft (pending review)
- **Source:** Full monorepo review of `templates/demo-legacy`, `packages/framework/next`, `packages/framework/next-ui`, `packages/framework/next-auth`, `packages/framework/next-types`, `packages/design-system`, `packages/template-migrator`.
- **Scope:** Bug fixes, hardening, debt cleanup, and test coverage. No new features, no breaking API changes except the two coordinated deprecation removals (D1, D2).

## Conventions

- **Severity:** `P1` = real bug / data-loss risk, fix first · `P2` = hardening / latent risk · `P3` = debt / polish.
- Every change to a publishable package requires a **`patch` changeset** (repo hard rule — never `major`/`minor` in pre-release mode).
- Every change that touches `templates/demo-legacy` must ship a paired **template-migrator migration** (drift gate enforces this at release).
- After any public-API change: `pnpm build:framework` in dependency order before consuming downstream.

---

## 1. `@igrp/template-migrator` (highest blast radius — it mutates consumer apps)

### TM-1 (P1) — Rollback silently incomplete
`file.write` and `file.delete` undo steps store an `__undo__` placeholder instead of prior file content. `rollback` warns and **skips** those steps, leaving consumer apps half-reverted while reporting the migration as rolled back.

**Fix (two-phase):**
1. **Immediate:** make `rollback` **refuse to run** (exit 1 with a clear message listing unrestorable files) when any undo step is a placeholder, instead of warning and continuing. Allow `--force` to keep current skip behavior explicitly.
2. **Follow-up:** during `apply`, snapshot prior content of every file touched by `file.write`/`file.delete` into the lock entry (or a sidecar `.igrp-migrations-undo/` payload dir) so undo is real. Pre-migration hashes are already computed — store the content alongside.

**Acceptance:** rolling back a migration containing `file.write` either fully restores prior content or exits non-zero without partial changes; lock reflects actual state.

### TM-2 (P1) — Zero test coverage
No `.test.ts` anywhere in the package, for the one tool whose job is editing consumer codebases.

**Fix:** vitest fixture suite running against temp directories:
- `executeStep` — each step type (`file.create` collision, `file.write`, `file.delete`, `env.add` idempotence, `deps.bump` deps vs devDeps), happy + failure paths.
- `lock.ts` — read/write round-trip, legacy lock detection (`LegacyLockError`).
- `convert` — legacy → new lock, including interrupted partial-convert recovery.
- `apply` — mid-migration failure leaves lock unwritten; re-run resumes.
- `pack.ts` — malformed frontmatter throws; payload path stripping.

**Acceptance:** `pnpm --filter @igrp/template-migrator test` passes in CI; the cases above covered.

### TM-3 (P2) — `requires:` declared but never validated
`apply` trusts manifest ordering; a dependent migration runs even if its prerequisite is absent from the lock.

**Fix:** before executing each migration, verify every ID in `requires` exists in `lock.applied`; abort with an actionable error otherwise. Also validate at pack time that `requires` references exist in the manifest.

### TM-4 (P2) — Patch-mode `file.write` is unverifiable
Steps with `patch:` have no full-file payload; the drift gate only warns, so a patch can silently misapply against drifted targets.

**Fix:** require a `targetHashBefore` (expected pre-patch hash) on patch steps. `apply` refuses the step on mismatch with a "file drifted, manual merge required" error. Drift gate upgrades these from warn to verifiable.

### TM-5 (P3) — Drift gate blind to brand-new template files
Only paths already referenced by some migration are checked.

**Fix:** add a curated manifest of template-managed paths (globs) in `scripts/check-drift.ts`; any template file matching the globs but absent from all migrations becomes a warning. Keep it warn-only to avoid noise.

### TM-6 (P3) — Stale-`dist/` dev footgun
The manifest is baked at build time; local runs against an outdated `dist/` ship wrong steps with no signal.

**Fix:** embed a build timestamp + source content hash in `manifest.json`; `cli.ts` prints it under `status`, and a `--verify-fresh` dev flag (or a warning when source mtimes are newer than the manifest, when run inside the monorepo) flags staleness.

---

## 2. `@igrp/framework-next`

### FN-1 (P1) — App-code regex contradicts its own contract
In the sync plan, `APP_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_]{0,62}[A-Z0-9]$/` is uppercase-only while the adjacent comment states matching is case-insensitive at the framework boundary ("the AM server decides canonical form"). Valid lowercase app codes can be rejected at config validation.

**Fix:** decide the contract with the AM server team. Either (a) add `i` flag + normalize via the existing `toUpperCaseIdentifier` before sending, or (b) keep uppercase-only and fix the comment + error message to say so explicitly. Option (a) preferred — it matches the comment's stated intent and `SERVICE_ID_PATTERN` (already case-insensitive). Update `sync-plan.test.ts` with lowercase/mixed-case cases.

**Acceptance:** lowercase `appCode` either syncs successfully (a) or fails with a message that states the uppercase requirement (b); tests cover both casings.

### FN-2 (P2) — Config sanitizer TODO open (pairs with NT-1)
`igrpBuildConfig` only presence-checks the config (`// TODO: create Sanitizer for config` in `src/lib/build.ts`). Invariants documented in `next-types` JSDoc (e.g. `m2mClientId`/`m2mClientSecret` required when `syncAccess && !previewMode`) are unenforced — malformed configs fail late and obscurely.

**Fix:** single Zod schema in `lib/build.ts` validating `IGRPConfigArgs`, including the conditional invariants (`superRefine`). Throw `IgrpConfigError` with field-level messages. Zod is already in the dependency tree. This closes the TODO here **and** NT-1 in `next-types`.

**Acceptance:** invalid configs fail at `igrpBuildConfig` with a field-specific `IgrpConfigError`; preview mode keeps working without m2m credentials; covered by new vitest cases.

### FN-3 (P3) — Remove deprecated `IGRPLayout` export
Marked "@deprecated — will be removed in the next release" but still shipped release after release.

**Fix:** remove the alias in a coordinated release (see D1 below). Template-migrator migration rewrites `IGRPLayout` → `IGRPLayoutFull` in consumer code.

### FN-4 (P3) — Delete stray empty directory
`packages/framework/next/packages/template-migrator/migrations/demo-legacy/payload/08/` — empty skeleton, presumably a misplaced migration-08 payload. Not referenced anywhere.

**Fix:** delete the whole nested `packages/` tree. No changeset needed (not shipped).

### FN-5 (P3) — Hardcoded pt-PT error strings, no override path
Framework-thrown `IgrpError` messages embed Portuguese copy directly (e.g. "O Modo de Visualização…"), with no equivalent of the DS i18n override mechanism.

**Fix:** extract messages to a constants module keyed by the error `code`; allow override via an optional `messages` map on `IGRPConfigArgs` (pt-PT stays the default, per project convention — defaults stay pt-PT, overridable). Tracked jointly with NU-1.

### FN-6 (P3) — Silent cache eviction
`MAX_CACHE_ENTRIES = 50` in `use-applications.ts` evicts oldest entries with no signal.

**Fix:** one `logger.warn` on first eviction per process (not per eviction). Optional.

---

## 3. `@igrp/framework-next-auth`

### NA-1 (P2) — Introspection fetch has no timeout
Revocation and discovery use 4s `AbortController` timeouts; the RFC 7662 introspection call in `oidc.ts` does not. A slow introspection endpoint stalls **all** token refreshes for its full duration.

**Fix:** wrap the introspection fetch in the existing `fetchWithTimeout` (4s), preserving fail-open semantics on timeout. Add a vitest case: slow endpoint → refresh proceeds after timeout, token assumed live.

**Acceptance:** a hanging introspection endpoint delays refresh by ≤ ~4s; existing 112-case suite still green.

### NA-2 (P3) — Rotation-recovery cache is single-instance
In-memory cache (180s TTL, 5k cap) keyed by consumed refresh token; multi-pod deployments without sticky sessions can race. Acknowledged in code comments.

**Fix (deferred until horizontal scaling is planned):** define a pluggable store interface (`get`/`set` with TTL) defaulting to the current in-memory map, so a Redis-backed impl can be injected without API change. Document the limitation in README until then.

### NA-3 (P3) — Wrap token-endpoint `response.json()`
Non-JSON IdP responses throw raw parse errors caught only at the jwt-callback level, producing noisy/unhelpful logs.

**Fix:** try/catch around `.json()` in refresh + introspection; map to a tagged `invalid_response` error with status + first ~200 chars of body.

### NA-4 (P3) — No integration test against a mock IdP
All tests are unit-level mocks.

**Fix (nice-to-have):** one vitest suite spinning an in-process mock OIDC server (discovery + token + introspection + revocation endpoints) exercising the full refresh→rotate→recover path. Lower priority than NA-1.

---

## 4. `@igrp/framework-next-ui`

### NU-1 (P2) — Mixed-language hardcoded UI strings, no i18n layer
Command search / header / sidebar errors are pt-PT; nav-user menu items are English ("Profile", "Notifications", "Settings", "Log out"). No override mechanism — unlike the DS, which now has `IGRPI18nProvider` + pt-PT defaults.

**Fix:** adopt the DS i18n pattern: a strings module with **pt-PT defaults for everything** (fixing the English nav-user items), overridable via props and/or by consuming the DS `IGRPI18nProvider` context with a `templateChrome` group. Per established preference: defaults stay pt-PT, exposed as overridable props — do not just translate.

**Acceptance:** no hardcoded user-facing string literals in component JSX; all strings flow from the defaults module; nav-user renders pt-PT by default; consumers can override every string.

### NU-2 (P2) — `./styles` export contradicts the Tailwind rule
The package exports `./styles` (compiled CSS bundle) while repo rules state consumers must import tokens only — the export invites the exact cascade-conflict mistake the docs warn about.

**Fix:** decide: (a) remove the `./styles` export (changeset + migrator migration if any consumer references it — audit first), or (b) keep it but mark deprecated in README/CHANGELOG with an explicit warning. Recommendation: (a), aligned with the DS which already removed `/styles`.

### NU-3 (P3) — Deprecated `IGRPRootProviders` with no migration hint
**Fix:** add `@deprecated Use IGRPRootProvidersFull or IGRPRootProvidersBlank` JSDoc so IDEs surface the replacement; remove in the coordinated deprecation release (D2) with a migrator migration.

### NU-4 (P3) — Manual cookie construction + protocol sniffing in `active-theme.tsx`
`SameSite`/`Secure` decided from `window.location.protocol` — fragile behind TLS-terminating proxies (app sees `http:` while the user is on `https:`).

**Fix:** set `Secure` whenever not `localhost` (or accept an explicit prop), and centralize cookie writing in one tested helper in `lib/utils.ts`.

### NU-5 (P3) — `console.info`/`console.error` in production paths
Header missing-data notice and auth-form errors log straight to the user's browser console.

**Fix:** route through a tiny `devWarn` helper that no-ops in production (or accepts an injected reporter), keeping the auth-form user-facing error message sanitized (no provider internals).

### NU-6 (P3) — Breadcrumb route-group regex
`/^\(.*\)$/` is greedy; make it explicit: `/^\([^)]*\)$/`. One-line fix + unit case.

---

## 5. `@igrp/framework-next-types`

### NT-1 (P2) — Invariants live only in JSDoc
Conditional requirements on `apiManagementConfig` compile fine when violated and fail at runtime. **Resolved by FN-2** (Zod schema in `igrpBuildConfig`) — no change needed in this package beyond keeping JSDoc in sync with the schema.

### NT-2 (P3) — Duplicate async-loader shape
`IGRPMockDataAsync` (globals.ts) and `IGRPConfigArgs['layoutMockData']` are structurally identical.

**Fix:** type `layoutMockData` as `IGRPMockDataAsync` directly. Patch changeset; no runtime impact.

### NT-3 (P3) — `footerItems` deprecated with typo, still shipped
**Fix:** correct the JSDoc typo now ("will be remove" → "will be removed"); remove the field in the coordinated deprecation release (D-series) alongside a migrator migration if the template references it.

### NT-4 (P3) — `IGRPConfigArgs` monolith
90 lines accumulated across betas .117–.136.

**Fix (pre-1.0, design-only for now):** document a target split (`IGRPAuthConfig` / `IGRPSyncConfig` / `IGRPLayoutConfig`) in this spec's follow-up ADR; do not restructure during beta — too much downstream churn for no runtime gain.

---

## 6. `@igrp/igrp-framework-react-design-system`

### DS-1 (P2) — React Compiler skip list is filename-pattern-based
`babel.config.cjs` skips files matching `context|provider|createContext|useContext|exports|index` **by name**. A context-using file with a non-matching name gets compiled unsafely; `babel-plugin-react-compiler` is still RC (19.1.0-rc.3).

**Fix:**
1. Switch the skip heuristic from filename to **content**: skip files whose source contains `createContext(` (cheap regex on file contents in the babel config's `include` function), keeping the name list as a fallback.
2. Add a CI grep check: every file containing `createContext(` must be excluded by the babel filter (small node script in `scripts/`).
3. Track the compiler plugin to stable; re-evaluate `"use no memo"` opt-outs (data-table) when it lands.

### DS-2 (P2) — Thin unit-test layer for a 90-component library
8 vitest files; everything else delegated to Storybook snapshots.

**Fix:** add direct vitest coverage for the highest-risk integration components first: `IGRPForm` (Zod wiring, error→toast fallback, submission lifecycle) and `IGRPDataTable` (pagination/filter/sort callbacks, `onQueryChange`). Target: those two fully covered; broader coverage incremental.

### DS-3 (P3) — Pin `@origin-space/image-cropper`
The one floating third-party dep (`^0.1.9` on a 0.x package).

**Fix:** pin exact (`0.1.9`); bump deliberately via changeset.

---

## 7. `templates/demo-legacy`

> Reminder: every change here ships with a paired template-migrator migration + payload re-capture, or the drift gate blocks release.

### TL-1 (P2) — Preview session stub defined in three places
`lib/auth.ts` (`PREVIEW_SESSION_STUB`), `lib/dal.ts` (inline copy), `actions/igrp/layout.ts` (inline, different shape, `as any` cast). Drift surfaces only at runtime in preview mode.

**Fix:** single exported `PREVIEW_SESSION_STUB` (in `lib/auth.ts` or a new `lib/preview.ts`), typed as the real `Session` shape — which also removes the `as any`. Both other sites import it.

**Acceptance:** one definition; `grep -r "Preview User" src/` hits exactly one file; preview mode works (login bypass, mock layout data, no refetch).

### TL-2 (P2) — `reportError` prod stub is silent
Production errors go to `console.error` only.

**Fix:** keep the stub but make the wiring explicit: read an env-gated reporter choice (`ERROR_REPORTER=console|sentry|otlp`), emit a **single startup warning** when unwired in production, and document the integration in `docs/ENVIRONMENT.md`. Actually wiring Sentry/OTLP is out of scope (infra decision).

### TL-3 (P3) — Eager env validation
`assertAuthProviderEnv()` runs only on first session attempt; misconfiguration surfaces when the first user hits a protected route.

**Fix:** call it once at startup from `igrp.template.config.ts` (guarded by `!isAuthBypass()`), so boot fails fast with the typed error instead of the first login.

### TL-4 (P3) — No test infrastructure
**Fix (incremental):** start with the cheapest high-value layer — vitest unit tests for `lib/utils.ts` (`sanitizeCallbackUrl`, `isAuthBypass`) and `lib/dal.ts`, since those guard security behavior. Playwright E2E for the login/preview flows is a follow-up decision (cost vs. the template's reference role) — not committed by this spec.

---

## D. Coordinated deprecation-removal release (cross-package)

One release train that removes the long-deprecated surface, with migrator migrations so consumers are rewritten automatically:

| ID | Package | Removal | Migrator action |
|---|---|---|---|
| D1 | `framework-next` | `IGRPLayout` alias | rewrite imports/usages → `IGRPLayoutFull` |
| D2 | `framework-next-ui` | `IGRPRootProviders` | rewrite → `IGRPRootProvidersFull`/`Blank` per call-site |
| D3 | `framework-next-types` | `footerItems` field | remove from template config if present |
| D4 | `framework-next-ui` | `./styles` export (per NU-2 decision) | remove any `@igrp/framework-next-ui/styles` import |

All patch changesets (pre-release mode). Ship after the P1/P2 items so the train isn't blocked by them.

---

## Prioritized execution order

| # | Items | Why first |
|---|---|---|
| 1 | TM-1, TM-2 | Tool that edits consumer apps: make rollback honest, put it under test |
| 2 | FN-1 | Concrete config-rejection bug candidate |
| 3 | NA-1 | Small fix, removes a global refresh-stall hazard |
| 4 | FN-2 (+ closes NT-1) | One Zod schema closes an open TODO and the unenforced type invariants |
| 5 | NU-1, FN-5 | i18n consistency (pt-PT defaults + overrides) across next-ui and framework-next |
| 6 | TL-1, TL-2, TM-3, TM-4, NU-2, DS-1 | P2 hardening batch |
| 7 | D1–D4 | Coordinated deprecation removal + migrations |
| 8 | Remaining P3s | Housekeeping (FN-4, NT-2, NT-3, NU-3..6, DS-2, DS-3, TL-3, TL-4, TM-5, TM-6, NA-2..4, FN-3, FN-6) |

## Out of scope

- New features or component additions.
- Splitting `IGRPConfigArgs` (NT-4) during beta — documented as a pre-1.0 design note only.
- Actually integrating Sentry/OTLP (TL-2 wires the seam, not the service).
- Multi-instance shared store for token-rotation recovery (NA-2) — deferred until horizontal scaling is planned.
- Any registry/tag/versioning changes — hard rules stand (patch changesets, per-package `release` scripts, `--tag latest`, Sonatype registry).
