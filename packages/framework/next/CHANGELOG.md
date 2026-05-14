# @igrp/framework-next

## 0.1.0-beta.129

### Patch Changes

- 66a4bc3: feat(breadcrumbs): controlled-first architecture with useSelectedLayoutSegments fallback

  IGRPTemplateBreadcrumbs now accepts `items?: BreadcrumbItem[]` for server-resolved labels (dynamic routes, user names, etc.) and `routeLabels?: Record<string, string>` as a shared config for static routes. When `items` is not provided, auto-derive mode uses `useSelectedLayoutSegments()` instead of `usePathname()` — route-context aware and handles parallel routes and route groups correctly.

  IGRPTemplateHeader gains `breadcrumbs` and `breadcrumbRouteLabels` props that forward to the breadcrumb component. IGRPLayout (framework-next) accepts and threads the same props through HeaderDataProvider to the header, enabling server layouts to inject pre-resolved items at any nesting level.

  `BreadcrumbItem` is now exported from `@igrp/framework-next-ui` for server component type annotations.

  Breaking: `customLabels` prop removed — migrate to `routeLabels` (full-href keys) and `formatLabel` (segment escape hatch).

- Updated dependencies [420c647]
- Updated dependencies [66a4bc3]
- Updated dependencies [4e9ecd5]
  - @igrp/framework-next-ui@0.1.0-beta.128
  - @igrp/framework-next-auth@0.1.0-beta.127
  - @igrp/framework-next-types@0.1.0-beta.128

## 0.1.0-beta.128

### Patch Changes

- fix(framework-next): replace React.cache with module-level object in api-config; remove React.cache wrappers from fetch hooks

  React.cache does not work across Server Action invocations — each call returns a fresh instance, so igrpSetAccessClientConfig and igrpGetAccessClientConfig were operating on different objects, causing "baseUrl is not configured" errors in server actions.

  api-config now uses a plain module-level mutable object. The fetch hooks (use-user, use-applications, use-menus) drop the outer cache() wrapper; unstable_cache inside each still handles persistent cross-request caching.

## 0.1.0-beta.125

### Patch Changes

- 939446a: fix(framework-next): throw clear error when baseUrl is not configured in igrpGetAccessClient
- Updated dependencies [939446a]
  - @igrp/framework-next-auth@0.1.0-beta.120
  - @igrp/framework-next-types@0.1.0-beta.120
  - @igrp/framework-next-ui@0.1.0-beta.123

## 0.1.0-beta.124

### Patch Changes

- chore(framework-next): update @igrp/platform-access-management-client-ts to 0.2.0-beta.5

## 0.1.0-beta.123

### Patch Changes

- chore(framework-next): update @igrp/platform-access-management-client-ts to 0.2.0-beta.2

## 0.1.0-beta.122

### Patch Changes

- ef2342d: Add per-request API client isolation via React.cache(), unstable_cache caching for menus/apps/user data, server actions subpath (@igrp/framework-next/actions), useLayoutData client hook (@igrp/framework-next/client), and Suspense-streamed IGRPLayout with ErrorBoundary fallbacks.
- Updated dependencies [ef2342d]
  - @igrp/framework-next-ui@0.1.0-beta.122

## 0.1.0-beta.121

### Patch Changes

- Add `@igrp/framework-next/app-error` and `@igrp/framework-next/logger` subpath exports.

  **`/app-error`** — `AppError`, `parsePublicDigest`, `getDisplayableErrorMessage`, and related types/constants for passing user-friendly messages through Next.js production sanitization of `error.message` via `error.digest`.

  **`/logger`** — minimal `logger` object (`error`, `warn`, `info`) with consistent `[Error]` / `[Warn]` / `[Info]` prefixes. Drop-in integration point for Sentry / OpenTelemetry without changing call sites.

- Updated dependencies
  - @igrp/framework-next-ui@0.1.0-beta.121

## 0.1.0-beta.120

### Patch Changes

- Updated dependencies [20a0850]
- Updated dependencies [2137c48]
  - @igrp/framework-next-auth@0.1.0-beta.119
  - @igrp/framework-next-types@0.1.0-beta.119
  - @igrp/framework-next-ui@0.1.0-beta.120

## 0.1.0-beta.119

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.118
  - @igrp/framework-next-ui@0.1.0-beta.119
  - @igrp/framework-next-types@0.1.0-beta.118

## 0.1.0-beta.118

### Patch Changes

- Updated dependencies [5ec3586]
- Updated dependencies [724398a]
  - @igrp/framework-next-ui@0.1.0-beta.118
  - @igrp/framework-next-auth@1.0.0-beta.117
  - @igrp/framework-next-types@0.1.0-beta.117

## 0.1.0-beta.117

### Patch Changes

- Updated dependencies [f594936]
  - @igrp/framework-next-ui@0.1.0-beta.117

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

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.116
  - @igrp/framework-next-types@0.1.0-beta.116
  - @igrp/framework-next-ui@0.1.0-beta.116

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

- Updated dependencies
  - @igrp/framework-next-types@0.1.0-beta.115
  - @igrp/framework-next-auth@0.1.0-beta.115
  - @igrp/framework-next-ui@0.1.0-beta.115

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

- Updated dependencies
  - @igrp/framework-next-types@0.1.0-beta.114
  - @igrp/framework-next-auth@0.1.0-beta.114
  - @igrp/framework-next-ui@0.1.0-beta.114
