# @igrp/template-migrator

## 0.1.0-beta.139

### Patch Changes

- 23ac101: Ship migration 33 (`33-force-dynamic-root-layout`) for `demo-v1`:

  - Re-captures `src/app/layout.tsx` with `export const dynamic = "force-dynamic"`. The root layout resolves the session, so without it Next tries to statically prerender the whole tree at `next build` time and the build fails with `NEXTAUTH_SECRET must be set in production` / `Missing required authentication environment variables`. Container and CI builds no longer need runtime secrets; runtime behaviour is unchanged.

## 0.1.0-beta.138

### Patch Changes

- 3dab276: Ship migration 32 (`32-turbopack-root-probe-and-beta169-deps`) for `demo-v1`:

  - Re-captures `next.config.ts` so `turbopackRoot` probes for `pnpm-workspace.yaml` and falls back to the app directory — standalone apps no longer root Turbopack two directories above themselves.
  - Re-pins `@igrp/framework-next-ui` to `0.1.0-beta.165` and `@igrp/framework-next` to `0.1.0-beta.169` (layout retry fix + runtime image-host crash fix).

## 0.1.0-beta.137

### Patch Changes

- 5a4ec99: - The design system now requires `zod` `^4.5.0` instead of `^4.4.0`, matching the range `@igrp/framework-next` already declares. Apps on zod `4.4.x` must upgrade to `4.5.x`.
  - `@igrp/framework-next-ui` pins `react`, `react-dom` and `next-auth` as devDependencies so it builds and typechecks against the same versions every other framework package uses, instead of whatever the workspace happened to hoist.
  - `@igrp/template-migrator` gains a typecheck config for its `scripts/` folder; no change to the published CLI or migration set.

## 0.1.0-beta.136

### Patch Changes

- 658e6b8: - Framework packages no longer declare their internal `@igrp/*` siblings as exact-version peer dependencies. They are regular dependencies again, so installing or upgrading a single framework package no longer emits unmet-peer warnings across the whole set.
  - `@igrp/framework-next` widens its `zod` peer range from the exact `4.5.0` to `^4.5.0`, so an app on any `4.5.x` (the template ships `4.5.4`) satisfies it.
  - `@igrp/template-migrator` ships migration `30-resync-beta166-deps`, which carries a CLI-upgraded app's dependency set forward to the beta.166 framework release — including `zod`, `react-hook-form`, `@tanstack/react-query` and `@types/react-dom`, which no earlier migration had ever pinned.

## 0.1.0-beta.135

### Patch Changes

- ac117fe: Fix three cases where the CLI reported success while leaving an app in a wrong state.

  **An interrupted `apply` no longer corrupts the recorded undo.** The lock entry is written only after a whole migration succeeds, so a signal (Ctrl-C, CI timeout, crash) between the last step and that write left files mutated with nothing recorded. The retry then captured its undo baseline from the _already-migrated_ files, so the lock claimed migrated content was the pre-migration original and a later `rollback` silently restored the wrong state. The in-process transactional unwind never covered this — it only runs inside `catch`.

  `apply` now keeps a crash-durable journal (`.igrp-migration-journal.json`) in the app root, written before the first step and cleared once the lock entry is safe. On startup a surviving journal is replayed to revert the interrupted migration before anything else, then the migration re-applies from a clean baseline; if a path cannot be restored, `apply` aborts rather than proceeding on an unknown baseline. The unwind logic is now shared (`src/unwind.ts`) between the error path and crash recovery so both leave the tree in the same state.

  **`rollback` refuses scaffold-baseline entries.** Entries with no undo steps and no stored payloads come from the template's shipped lock — a scaffolded app already contained the result, so nothing was executed and nothing was captured. Rolling one back previously printed `✓ rolled back`, changed no files, and removed the entry, leaving the app claiming the migration was unapplied so the next `apply` re-ran it. It now refuses and explains why; `--force` still drops the entry.

  **`status` lists lock entries it doesn't ship** instead of only counting them. An app migrated by a newer CLI previously showed `30 applied` above a list of 29 rows, with nothing explaining the gap. Unknown entries are now printed with the CLI version that applied them, and the summary says how many came from a newer CLI.

  **The template zip now normalises line endings to LF too.** The previous release fixed this for the CLI channel (payloads are normalised into `dist/` at pack time), but the zip is built from the working tree — so on a Windows checkout with `core.autocrlf=true`, `pnpm release:demo` still produced a CRLF zip while the migrator shipped LF. `create-zip-template.ps1` now normalises the tree before `Compress-Archive`, using the same NUL-byte binary guard, so both channels agree regardless of who built the artifact.

  Verified by diffing a scaffolded app against a CLI-upgraded one: **0 differences across all 50 migration-managed paths** (previously 37 diverged).

  Also: the transient journal is exempt from the drift gate's new-file check, and the consumer guide documents crash recovery and the rollback refusal.

- db1cbeb: Add a template-lock axis to the drift gate, and fix the stale lock it caught.

  The template ships `.igrp-migrations-lock.json` inside the zip so a scaffolded app opens with every migration already applied. That lock had fallen 9 migrations behind (it recorded through `20-sidebar-trigger-in-header` while the CLI ships 29), so a brand-new app reported migrations it already contained as pending: `igrp-migrate check` failed on day one and `apply` re-ran finished work, recording `undo` entries for a state the app was never in.

  - `check:drift` now reconciles the shipped lock as a fourth axis — alongside file payloads, dependency pins, and new files — failing on unrecorded migrations, entries for migrations that no longer exist, stale `manifestHash` values, and out-of-order entries. Nothing else covered this file: the orphan check exempts it by path and no migration manages its content.
  - New `sync:template-lock` script regenerates the lock (`--check` for a dry run). Regeneration is append-and-refresh: existing entries keep their recorded `appliedAt` and `cliVersion`.
  - `pack.ts` and the new lock logic now share `hashSteps()`, so a lock entry's `manifestHash` and the manifest's `contentHash` cannot be computed differently.
  - Docs: corrected the `file.create` step-type reference (it overwrites an existing destination rather than failing), documented the previously-undocumented `env.remove` step type, and documented the lock axis and sync workflow.

  Also fixes three consumer-visible defects found by running a full 29-migration upgrade and diffing the result against the template (which moved it from 64 to 101 of 102 files byte-identical):

  - **Text payloads are now normalised to LF when packed into `dist/`.** Payloads are captured on Windows and carried CRLF while the live template is LF, so an upgraded app diverged from a scaffolded one in 37 of 44 managed files — the template's own Biome run would rewrite every one of them, and `git diff` after an `apply` showed whole-file churn instead of the change that landed. Binary payloads (NUL-byte detection) are still copied verbatim.
  - **`deps.bump` now warns about dependencies the app doesn't declare** instead of skipping them silently. It still won't add them (that could contradict a deliberate removal), but a silent skip turned a load-bearing bump — e.g. the AM client that `29-permissions-catalog-sync` needs for `syncPermissions` — into a runtime failure long after `apply` reported success.
  - **`apply` now says when `.env.example` gained keys.** Migrations never touch a consumer's real `.env`, so new settings previously landed only in the example file with nothing prompting anyone to copy them across — including credentials with no defaults that the app needs to boot.
  - A corrupt template lock is now reported as a normal gate failure rather than crashing `check:drift` with a raw `JSON.parse` stack trace.

- f3e0c00: Library packaging hygiene across all published packages:

  - `@igrp/framework-next`: `next`, `react`, `react-dom` moved from `dependencies` to `peerDependencies` (range-based) — prevents duplicate React copies in consumer apps.
  - All packages: exact-pinned `peerDependencies` relaxed to caret ranges (`react ^19.2.0`, `next ^15.5.0`, `next-auth ^4.24.0`, `zod ^4.4.0`, etc.) so consumers on newer patch/minor versions no longer get unmet-peer errors.
  - `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next-ui`: `tailwindcss` moved to `devDependencies` (Tailwind compiles in the consuming app); unused `zod` dependency removed from `next-ui`; duplicated `publishConfig.exports` removed.
  - `@igrp/framework-next-types`: added an `exports` map (blocks deep imports into `dist/`, consistent with the other packages).
  - `@igrp/framework-next`, `@igrp/template-migrator`: `types` condition now listed first in `exports`.
  - `@igrp/template-migrator`: added `license`, `author`, top-level `types`, `publishConfig.tag`/`access`; `clean` now uses cross-platform `rimraf`.
  - All packages: added `repository`/`homepage`/`bugs` metadata, normalized `engines.node` to `>=22`, added `./package.json` export.

## 0.1.0-beta.134

### Patch Changes

- - Added migration `27-csp-hsts-headers`: captures `src/middleware.ts`'s new `Strict-Transport-Security` and `Content-Security-Policy-Report-Only` security headers.
  - Added migration `28-resync-beta165-query-provider-split`: resyncs 17 files that drifted since migrations 25/26, captures the `query-client.tsx` → `query-client.ts`/`query-client.server.ts`/`query-provider.tsx` split, and bumps `@igrp/framework-next`/`@igrp/framework-next-ui` dependency pins to `0.1.0-beta.165`/`0.1.0-beta.161`.

## 0.1.0-beta.133

### Patch Changes

- a0a9e05: - Add migration 26: bring 9 previously untracked files under migration coverage (`utilities.ts`, `query-client.tsx`, config/login, config/site, fonts, forbidden, loading, health route, generated layout); update 18 drifted tracked files to current template state; add `file.delete` steps for 4 stale paths removed from the template (`auth-helpers.ts`, `auth-options.ts`, `[...not-found]/page.tsx`, `types/next-auth.d.ts`)

## 0.1.0-beta.132

### Patch Changes

- 2d9bdef: - Add `IGRPRepetitiveComponent` — generic render-prop component for mapping a list of items with a key extractor, exported from the design system root
  - Fix `IGRPModalDialog` sticky header/footer layout: use `-mx-6 px-6` for true edge-to-edge spanning, correct z-index to `z-10`, and add `max-h-[95vh]` on the full-size variant; simplify `IGRPModalDialogDescription` to accept standard `children` instead of a `name` shorthand prop
  - Add template-migrator migration 24: resync `demo-v1` `(igrp)/layout.tsx` (hoists `IGRPQueryProvider`) and `.env.example` to beta.159, bumping all `@igrp/*` framework deps

## 0.1.0-beta.131

### Patch Changes

- b11b094: Make `apply` transactional: on a mid-migration step failure, unwind the
  steps that already ran (restoring overwritten/deleted files from the
  captured undo payloads) before aborting, instead of leaving files mutated
  with no lock entry. Prevents a re-run from re-capturing a corrupted undo
  baseline.
- da6f8a6: Add migration 21 (template-resync-catchup): re-capture 9 demo-v1 files and the
  next/react/react-dom dep pins that had drifted from the shipped migrations, so
  `check:drift` passes again. No template behavior change — a drift-parity snapshot.
- f80bda3: Add migration `22-session-args-auth-bypass`: rewrites the demo-v1
  `get-session-args.ts` to gate session-refetch on `isAuthBypass()` instead of
  `isPreviewMode()`, so `AUTH_PROVIDER=none` disables refetch per the bypass
  contract.
- 68956e9: `executeStep` now throws a clear error for `file.write` `mode: "patch"`
  (unimplemented) and for a missing `from`, instead of a cryptic
  `Cannot read properties of undefined` TypeError that aborted the whole apply.
- a520fe9: Hardening: numeric migration-file ordering (9 < 10 < 100); line-anchored
  `env.add` idempotency + a real `env.remove` undo (rollback now strips added
  keys); path-containment guard in `executeStep`; and `apply` enforces each
  migration's `requires` before running it.
- d5233b0: Add migration `23-per-request-layout-and-routes-cache`: demo-v1 layouts use the
  existing `getLayoutConfig` cache (one session decode per request) and
  `getRoutes()` memoizes its routes-file read.
- a7219e4: Validate migration `requires` at pack time. `pack.ts` now rejects duplicate
  migration ids and any `requires` entry that doesn't resolve to a strictly earlier
  migration (forward reference, typo, or unknown id). `apply` checks `requires`
  against applied ids but executes in file order, so a bad `requires` would
  otherwise ship in the manifest and permanently deadlock `apply` on consumer apps.
- 2e8785b: Rename the template identifier from `demo-legacy` to `demo-v1`, tracking the template folder rename (`templates/demo-legacy` → `templates/demo-v1`). The migrations source tree moves to `migrations/demo-v1/`, and the manifest and lock-file `template` field is now `demo-v1` (it is cosmetic — only printed by `status`). Existing consumer lock files self-heal: the next `apply`/`rollback` stamps the current identifier. No migration `id`s, step content hashes, or applied-migration state change, so already-migrated apps are unaffected.

## 0.1.0-beta.130

### Patch Changes

- 0eaa118: - Add migration `20-sidebar-trigger-in-header`: flips the demo-legacy template's `showIGRPSidebarTrigger` to `true` and resyncs all `@igrp/*` deps to the beta.158 framework set (next-ui beta.157, next beta.158), matching what the create-template zip resolves for fresh scaffolds.

## 0.1.0-beta.129

### Patch Changes

- e7ad711: - Add migration 19 (`19-adaptive-session-refresh`): removes `IGRP_SESSION_REFETCH_INTERVAL` from `.env.example` and updates `get-session-args.ts` to use a 600s backstop interval now that `IGRPSessionWatcher` handles adaptive refresh from `session.expiresAt`

## 0.1.0-beta.128

### Patch Changes

- 467bb32: - Add migration 18 (`18-email-scope-enable`): updates `.env.example` to set `IGRP_AUTH_SCOPES=openid email` now that the IdP advertises the `email` scope; bumps all framework deps to beta.142–153

## 0.1.0-beta.127

### Patch Changes

- 4b31dc1: feat: migration 17 — showMenuSearch config flag + dep bumps to beta.151

## 0.1.0-beta.126

### Patch Changes

- 309f489: Honest rollback: `apply` now captures the prior content of overwritten/deleted files into the lock entry (`undoPayloads`), and `rollback` restores them. For lock entries written by older CLI versions (no stored payloads), `rollback` now refuses with a clear file list instead of silently half-reverting; `--force` keeps the old skip behavior explicitly. Adds the package's first test suite (executeStep, lock, convert, apply, rollback).

## 0.1.0-beta.125

### Patch Changes

- 034ab4d: - Add migration 14 (deferred logout flow, console cleanup, layout hardening) and migration 15 (resync deps to next-ui@0.1.0-beta.148 / next@0.1.0-beta.149 for sidebar trigger restore)

## 0.1.0-beta.124

### Patch Changes

- Add migration `13-resync-beta145`: re-capture `src/lib/dal.ts` (import-order realignment after the Biome sort) and bump the `@igrp/*` dependency pins to the `framework@0.1.0-beta.145` set (`framework-next@0.1.0-beta.145`, `framework-next-ui@0.1.0-beta.144`, `igrp-framework-react-design-system@0.1.0-beta.135`). Clears the `check:drift` gate.

## 0.1.0-beta.123

### Patch Changes

- 0d15a61: Add migration `12-template-resync` and a `check:drift` release gate.
  - **New migration `12-template-resync`** re-captures 13 `templates/demo-legacy` files that had been edited directly without an accompanying migration (so the changes had shipped only to apps scaffolded from the zip, never to apps upgraded via `igrp-migrate`): the layout server action, the `lib/config/*` helpers, `lib/auth.ts`, `lib/dal.ts`, `lib/report-error.ts`, the NextAuth route handler, the three `error.tsx` boundaries, the logout page, and `.env.example`. It also deletes the stale `src/app/[...not-found]/page.tsx` catch-all route, bumps the `@igrp/*` deps to the `framework-next@0.1.0-beta.144` set, and aligns the React/Next runtime (`next ^15.5.18`, `react`/`react-dom 19.2.6`) which had advanced in the template since migration 04 without an intervening migration.
  - **New `check:drift` script** (`scripts/check-drift.ts`) reconciles both the payload tree and the dependency pins against the live template, and fails if a managed file changed without a migration, a migration ships a file the template removed, a payload is missing, or a bumped dependency drifted from the template's current (workspace-resolved) version. It runs automatically at the start of the `release` script, preventing this drift from recurring.

## 0.1.0-beta.122

### Patch Changes

- 667e3af: Add migration `11-callbackurl-hardening-and-error-copy` for `demo-legacy`, back-filling template changes that were never captured by a migration:
  - **callbackUrl hardening** (open-redirect + login-loop prevention) across `middleware.ts`, `lib/auth.ts`, `lib/dal.ts`, and `app/(auth)/login/page.tsx` — basePath-aware sanitized `callbackUrl` and the `x-current-path` header contract (relies on `sanitizeCallbackUrl`, shipped in migration 10).
  - **AppError error-copy surfacing** — new `lib/errors.ts`, plus `config/error-messages.ts` and `app/global-error.tsx` wiring `parsePublicDigest`/`resolveCopy` so server-thrown errors show their public message.
  - Adds the `slug` field to `lib/config/get-pkj.ts`.

## 0.1.0-beta.121

### Patch Changes

- 8687eb9: Fix incomplete migration `10-session-refetch-and-menu-role-sync`: also ship `src/actions/igrp/auth.ts` and `src/lib/utils.ts`. The new logout page imports `getLogoutUrl` from `actions/igrp/auth.ts`, but the last migration to ship that file (04) predated the function — sequential consumers would apply a logout page calling an undefined export. `lib/utils.ts` is refreshed alongside, as `get-session-args.ts` (also new in 10) consumes its `isPreviewMode`/auth-bypass helpers.

## 0.1.0-beta.120

### Patch Changes

- 195508a: Add migration `10-session-refetch-and-menu-role-sync` for `demo-legacy`, capturing the template changes since migration 09:
  - `IGRP_SESSION_REFETCH_INTERVAL` — configurable client session-refetch cadence (default 180s), replacing the hard-coded 5-minute poll in `src/lib/config/get-session-args.ts`
  - `IGRP_SYNC_ON_CODE_MENU_ROLES` — forwards `syncRoles` to the on-code menu push so menu↔role assignments can be reconciled (or left untouched)
  - Removes the dead `IGRP_M2M_SCOPE` env var and documents `NEXT_PUBLIC_IGRP_SETTINGS_URL`
  - Logout-hang fix, sidebar-visibility correction (`showSidebar` default), and design-system token/theme alignment
  - `deps.bump` to `framework-next@0.1.0-beta.142`, `framework-next-types@0.1.0-beta.136`, `framework-next-ui@0.1.0-beta.141`, `platform-access-management-client-ts@0.2.0-beta.10`

## 0.1.0-beta.119

### Patch Changes

- b5f301f: docs(template-migrator): remove stale IGRP_M2M_SCOPE references from payloads

  Drop the `IGRP_M2M_SCOPE` documentation and bare env line from the migration 08 and 09 payload `.env.example` files. The variable was deprecated and removed from the framework runtime; leaving it in the payloads would re-inject a no-op env var into consumer apps that apply these migrations.

## 0.1.0-beta.118

### Patch Changes

- feat(template-migrator): bundle migration 08 — M2M OAuth2 `client_credentials`

  Adds `migrations/demo-legacy/08.MIGRATIONS-21052026.md` and `payload/08/{.env.example,igrp.template.config.ts}` to the CLI bundle so consumers can apply the OAuth2 `client_credentials` AM-sync migration via `pnpm dlx @igrp/template-migrator@latest apply`.

  Pins `targetFrameworkVersion: 0.1.0-beta.137` and bumps `@igrp/framework-next` / `@igrp/framework-next-types` to the published beta versions that ship the new OAuth2 flow.

  Also includes a minor wording fix in `06.MIGRATIONS-23042026.md`.

## 0.1.0-beta.117

### Patch Changes

- 761e9c3: - Move migration guides and payloads from `templates/demo-legacy/.igrpmigrations/` into the CLI package at `migrations/demo-legacy/`
  - Replace `.igrpmigrations/lock.json` with a flat `.igrp-migrations-lock.json` at the project root (same pattern as `skills-lock.json`)
  - Add `igrp-migrate convert` command to upgrade existing consumers from the legacy lock path; all other commands block with a clear message if the legacy path is detected

## 0.1.2-beta.116

### Patch Changes

- beta.116 — template migrator CLI, lock file relocation, and release tooling fixes.

  @igrp/template-migrator
  - New CLI package that automates IGRP template upgrades via `pnpm dlx @igrp/template-migrator@latest`.
  - Bundles all 6 demo-legacy migration guides (01–06) as a cumulative manifest with embedded payloads.
  - Commands: status, plan, apply (--yes / --to), list, rollback, check (CI gate).
  - Lock file moved from root `.igrpmigrations.lock.json` → `.igrpmigrations/lock.json`; backward-compat read of old path on first run.
  - Prebuild pack script cleans payload output on every run to prevent stale files.
  - tsup config: shims disabled (no \_\_dirname polyfill injection before shebang), banner removed (shebang lives in src/cli.ts line 1).

  @igrp/framework-next-template (templates/demo-legacy)
  - `.igrpmigrations/lock.json` pre-seeded to mark all 6 migrations as applied.
  - `create-zip-template.ps1` updated to strip migration guides and payloads from the published zip — only `lock.json` is included so consumers start fully up-to-date.
  - `MIGRATING.md` added: end-user upgrade guide (status → plan → apply workflow).
