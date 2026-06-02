# @igrp/template-migrator

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
