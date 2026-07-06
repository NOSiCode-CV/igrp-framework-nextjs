# @igrp/template-migrator

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
