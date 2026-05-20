# @igrp/igrp-framework-react-design-system

## 0.1.0-beta.129

### Patch Changes

- ac94a9c: Promote experimental components to Horizon: IGRPBreadcrumb (with size/color variants and dropdown collapsing), IGRPBanner (cookie and announcement variants), IGRPImageCropper (basic/circular/zoom/preview variants); add dropzone variant to IGRPInputFile with all UI strings configurable as props
- a4ef1fe: Add success, warning, info as first-class semantic tokens; replace all raw Tailwind colors in IGRPStatsCard with semantic tokens; fix proportional icon sizing in IGRPStatsCard; standardize IGRPButton icon sizes to Tailwind scale and gap to gap-1.5
- 9a0dd9b: fix(data-table): fix filter state desync, date range picker, clear-all button, select rendering, and a11y issues
- 9f9ee3d: Add createIGRPColumnHelper with cellType shortcuts, unified actions prop, declarative filter descriptors, onQueryChange server-side callback, and pagination config prop to IGRPDataTable
- 72268fd: a11y/polish pass: focus rings, motion-safe animations, tabular-nums, text-balance, onError callback, remove stale iconSize prop
- ba86302: Remove dead experimental components (timeline, sheet, progress, appointment-picker); remove IGRPStandaloneList and IGRPRepetitiveComponent; fix sidebar cookie restore on mount; add shadcn audit date tracking to all primitives

## 0.1.0-beta.128

### Patch Changes

- fe2ed3d: - Update `@types/node` to v25.7.0 across all framework packages
  - Bump `typescript-eslint` and `vitest` to latest versions

## 0.1.0-beta.116

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

## 0.1.0-beta.115

### Patch Changes

- Edge-safe auth refactor + App Router error-handling overhaul.

  @igrp/framework-next-auth
  - Split withIGRPAuth() into Edge-safe shell + lazy Node helpers; next-auth (main) and next/headers are no longer static imports. Fixes TypeError reading 'custom' from openid-client leaking into the Edge middleware bundle under Next.js 15.5.15.
  - interopDefault() helper normalizes CJS/ESM default-import mismatch against next-auth v4 (KeycloakProvider, NextAuth).
  - tsup is now the single producer of dist/; added ./oidc and ./providers subpath exports; trimmed root barrel to Edge-safe modules only.
  - Tolerates AUTH_PROVIDER=none by returning a stub instance (404 on auth routes) instead of crashing NextAuth with an empty providers array.

  @igrp/framework-next
  - New ./errors subpath with typed IgrpError hierarchy (IgrpConfigError, IgrpAuthConfigError, IgrpLayoutDataError) and isIgrpError structural guard — designed to survive production error.message redaction via stable error.name.
  - Access-management config validation moved from IGRPLayout into igrpBuildConfig so throws fire at root-segment render where global-error.tsx can catch them.
  - IGRPLayout and fetchLayoutData now throw typed errors instead of raw Error.

  @igrp/framework-next-ui
  - New IGRPSegmentError component for segment-level error.tsx boundaries — renders inside layout chrome, offers reset + go-home actions, accepts resolveCopy(error) for i18n.

  @igrp/framework-next-template (templates/demo-legacy)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-legacy/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

## 0.1.0-beta.114

### Patch Changes

- Edge-safe auth refactor + App Router error-handling overhaul.

  @igrp/framework-next-auth
  - Split withIGRPAuth() into Edge-safe shell + lazy Node helpers; next-auth (main) and next/headers are no longer static imports. Fixes TypeError reading 'custom' from openid-client leaking into the Edge middleware bundle under Next.js 15.5.15.
  - interopDefault() helper normalizes CJS/ESM default-import mismatch against next-auth v4 (KeycloakProvider, NextAuth).
  - tsup is now the single producer of dist/; added ./oidc and ./providers subpath exports; trimmed root barrel to Edge-safe modules only.
  - Tolerates AUTH_PROVIDER=none by returning a stub instance (404 on auth routes) instead of crashing NextAuth with an empty providers array.

  @igrp/framework-next
  - New ./errors subpath with typed IgrpError hierarchy (IgrpConfigError, IgrpAuthConfigError, IgrpLayoutDataError) and isIgrpError structural guard — designed to survive production error.message redaction via stable error.name.
  - Access-management config validation moved from IGRPLayout into igrpBuildConfig so throws fire at root-segment render where global-error.tsx can catch them.
  - IGRPLayout and fetchLayoutData now throw typed errors instead of raw Error.

  @igrp/framework-next-ui
  - New IGRPSegmentError component for segment-level error.tsx boundaries — renders inside layout chrome, offers reset + go-home actions, accepts resolveCopy(error) for i18n.

  @igrp/framework-next-template (templates/demo-legacy)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-legacy/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

## 0.1.0-beta.102

- Initial changelog. Future releases will be documented via [Changesets](https://github.com/changesets/changesets).
