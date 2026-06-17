# @igrp/framework-next

## 0.1.0-beta.151

### Patch Changes

- Updated dependencies [a9b2297]
- Updated dependencies [a9b2297]
- Updated dependencies [331debd]
- Updated dependencies [e51050a]
  - @igrp/framework-next-ui@0.1.0-beta.150
  - @igrp/framework-next-auth@0.1.0-beta.141
  - @igrp/framework-next-types@0.1.0-beta.143

## 0.1.0-beta.150

### Patch Changes

- ca731c7: `igrpBuildConfig` now canonicalizes `appCode` (trim + uppercase) in the returned config, so the Access Management sync and the read paths (menu/app fetch hooks and their cache keys) always see the same uppercase form. Previously only the sync path normalized, so a lowercase `IGRP_APP_CODE` could register the app as `APP_X` while reads queried `app_x`. Configs whose `appCode` is already canonical are returned unchanged (same object identity).
- 455138a: Access Management sync now accepts `IGRP_APP_CODE` in any case and normalizes it to uppercase (the AM canonical form) before validation, matching the documented case-insensitive contract. Previously, lowercase app codes were rejected with `IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING`.
- d861e16: `igrpBuildConfig` now validates the full config shape with a Zod schema, enforcing the previously documentation-only invariants: `previewMode`/`syncAccess` must be booleans, `layoutMockData` getters must be functions, `apiManagementConfig.baseUrl` is required when preview is off, and `serviceId`/`m2mClientId`/`m2mClientSecret`/`appCode` are required when sync is on outside preview. Failures throw `IgrpConfigError` with field-level context and a stable code (new code: `IGRP_CONFIG_INVALID`). Valid configs — including minimal preview-mode configs — are unaffected.
- Updated dependencies [5ebe890]
  - @igrp/framework-next-auth@0.1.0-beta.140
  - @igrp/framework-next-ui@0.1.0-beta.149
  - @igrp/framework-next-types@0.1.0-beta.142

## 0.1.0-beta.149

### Patch Changes

- Updated dependencies [5c14726]
  - @igrp/framework-next-ui@0.1.0-beta.148

## 0.1.0-beta.148

### Patch Changes

- Updated dependencies [4e0137a]
  - @igrp/framework-next-auth@0.1.0-beta.139
  - @igrp/framework-next-types@0.1.0-beta.141
  - @igrp/framework-next-ui@0.1.0-beta.147

## 0.1.0-beta.147

### Patch Changes

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.138
  - @igrp/framework-next-types@0.1.0-beta.140
  - @igrp/framework-next-ui@0.1.0-beta.146

## 0.1.0-beta.146

### Patch Changes

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.137
  - @igrp/framework-next-types@0.1.0-beta.139
  - @igrp/framework-next-ui@0.1.0-beta.145

## 0.1.0-beta.145

### Patch Changes

- @igrp/framework-next-ui@0.1.0-beta.144

## 0.1.0-beta.144

### Patch Changes

- Updated dependencies [7a89144]
  - @igrp/framework-next-auth@0.1.0-beta.136
  - @igrp/framework-next-types@0.1.0-beta.138
  - @igrp/framework-next-ui@0.1.0-beta.143

## 0.1.0-beta.143

### Patch Changes

- 6b42572: - Coordinated maintenance release: bump all framework packages to the next beta to keep versions aligned across the framework.
- Updated dependencies [6b42572]
  - @igrp/framework-next-auth@0.1.0-beta.135
  - @igrp/framework-next-types@0.1.0-beta.137
  - @igrp/framework-next-ui@0.1.0-beta.142

## 0.1.0-beta.142

### Patch Changes

- @igrp/framework-next-ui@0.1.0-beta.141

## 0.1.0-beta.141

### Patch Changes

- ba91edb: feat: gate menu-role sync on `IGRP_SYNC_ON_CODE_MENU_ROLES`

  The on-code menu push can now control the `syncRoles` argument of
  `client.m2m.syncApplicationMenus(appCode, menus, syncRoles)`.
  - **next-types**: new optional `apiManagementConfig.syncOnCodeMenuRoles?: boolean`. Defaults to `true` (matching the AM client default) when omitted.
  - **next**: `igrpSyncMenus` now requires a `syncRoles` arg and forwards it as the third parameter of `syncApplicationMenus`; `planAccessManagementSync` derives `syncOnCodeMenuRoles` from config (`true` unless explicitly `false`) and `igrpStartupSync` threads it through.

  Only consulted when the on-code menu push actually runs (`IGRP_SYNC_ON_CODE_MENUS=true` plus the outer `IGRP_SYNC_ACCESS` / `IGRP_PREVIEW_MODE` gates). Outer gating is unchanged.

- Updated dependencies [b88c4b1]
- Updated dependencies [7fb20b6]
- Updated dependencies [ba91edb]
  - @igrp/framework-next-auth@0.1.0-beta.134
  - @igrp/framework-next-ui@0.1.0-beta.140
  - @igrp/framework-next-types@0.1.0-beta.136

## 0.1.0-beta.140

### Patch Changes

- Updated dependencies [f89e1ab]
- Updated dependencies [ec48e46]
- Updated dependencies [ec48e46]
  - @igrp/framework-next-auth@0.1.0-beta.133
  - @igrp/framework-next-ui@0.1.0-beta.139
  - @igrp/framework-next-types@0.1.0-beta.135

## 0.1.0-beta.139

### Patch Changes

- 123e361: feat(next): gate AM menu push on `IGRP_SYNC_ON_CODE_MENUS`

  `igrpSyncMenus` now requires a `syncEnabled` arg. When `false`, the push is skipped and a `console.info` line is emitted. `IGRPRootLayout` sources the push payload from `apiManagementConfig.onCodeMenus` instead of the AM-loaded sidebar menus, so the push is meaningful (template-defined array → AM) rather than a no-op echo.

  Outer sync gating on `IGRP_SYNC_ACCESS` / `IGRP_PREVIEW_MODE` is unchanged.

- c92930a: test(next): add regression test for sync-plan menu source

  Pins `planAccessManagementSync` behavior: `menus` passes through from `args.menus` verbatim, `syncOnCodeMenus` narrows to `false` when omitted and `true` when explicitly set, and the planner returns `null` in preview mode regardless of other settings. Guards against accidental reversion of the on-code-menus push payload source.

- Updated dependencies [12cc11b]
- Updated dependencies [12cc11b]
- Updated dependencies [0cdef39]
- Updated dependencies [12cc11b]
- Updated dependencies [cc40fef]
- Updated dependencies [cc40fef]
- Updated dependencies [12cc11b]
- Updated dependencies [123e361]
  - @igrp/framework-next-auth@0.1.0-beta.132
  - @igrp/framework-next-types@0.1.0-beta.134
  - @igrp/framework-next-ui@0.1.0-beta.138

## 0.1.0-beta.138

### Patch Changes

- Updated dependencies [1d4a0b7]
  - @igrp/framework-next-ui@0.1.0-beta.137

## 0.1.0-beta.137

### Patch Changes

- 2196ef8: feat(next)!: OAuth2 `client_credentials` for AM sync + fail-fast config validation

  The Access Management startup sync now authenticates to the AM API using OAuth2 `client_credentials` instead of a static M2M token. Three structural improvements ride along:
  - **Single shared `AccessManagementClient` per process** (`lib/sync-client.ts`) keyed by `${baseUrl}|${clientId}`. Previously each sync phase (application/routes/menus) built its own client, defeating the token cache. Now one OAuth2 token is fetched per process lifetime and shared across all three phases.
  - **Validation at render time** (`lib/sync-plan.ts`). `planAccessManagementSync` runs synchronously inside `IGRPRootLayout` and throws `IgrpConfigError('IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING')` when required env vars are missing or malformed (whitespace, invalid identifier shape). Misconfigured environments now fail with a clear error in `global-error.tsx` on the first request, instead of an opaque 4xx from the AM server buried in a post-stream `console.error`.
  - **`igrpStartupSync` is a pure executor.** Takes a pre-validated plan; never inspects env vars; can't throw `IgrpConfigError`. Network/runtime errors are caught, logged as structured JSON (`event: 'igrp.am.sync_failed'`, never logging credentials), and the per-process mutex resets so the next request can retry.
  - **Preview-mode interlock.** When `IGRP_PREVIEW_MODE=true` and `IGRP_SYNC_ACCESS=true` are both set (almost always a developer-config slip), the framework emits a `console.warn` and skips sync.

  **Breaking** (consumed via `@igrp/framework-next-types` `apiManagementConfig` shape change):
  - `m2mToken` removed → use `m2mClientId` + `m2mClientSecret`.
  - `m2mServiceId` renamed → `serviceId`.
  - `syncOnCodeMenus` removed (was dead config).

  Internal modules `sync-application`, `sync-routes`, `sync-menus` now accept a shared `client` arg instead of building their own; their signatures changed but they're not part of the public API.

  All sync modules now `import 'server-only'` for compile-time defense against accidental client-bundle inclusion.

- Updated dependencies [b9c286f]
- Updated dependencies [2a0ef32]
- Updated dependencies [2196ef8]
- Updated dependencies [2a0ef32]
  - @igrp/framework-next-ui@0.1.0-beta.136
  - @igrp/framework-next-auth@0.1.0-beta.131
  - @igrp/framework-next-types@0.1.0-beta.133

## 0.1.0-beta.136

### Patch Changes

- Updated dependencies [73b0e36]
  - @igrp/framework-next-ui@0.1.0-beta.135

## 0.1.0-beta.135

### Patch Changes

- Updated dependencies [3cbddca]
  - @igrp/framework-next-ui@0.1.0-beta.134

## 0.1.0-beta.134

### Patch Changes

- Updated dependencies
- Updated dependencies [819f3b4]
  - @igrp/framework-next-auth@0.1.0-beta.130
  - @igrp/framework-next-ui@0.1.0-beta.133
  - @igrp/framework-next-types@0.1.0-beta.132

## 0.1.0-beta.133

### Patch Changes

- 56b14c3: Add `showSidebar` prop to `IGRPLayoutFull` to render header-only chrome without a sidebar.

  `IGRPRootProvidersFull` now accepts `sidebar` as optional — when absent, skips `SidebarProvider`/`SidebarInset` and renders a plain flex-column layout instead, avoiding sidebar CSS offsets.

- Updated dependencies [56b14c3]
  - @igrp/framework-next-ui@0.1.0-beta.132

## 0.1.0-beta.132

### Patch Changes

- f8dc318: feat: add IGRPLayoutFull/Blank, deprecate IGRPLayout, stabilize useLayoutData
- f6a63d1: fix: move startup sync to after(), cap cache Maps to prevent memory leaks
- Updated dependencies [f8dc318]
- Updated dependencies [f8dc318]
  - @igrp/framework-next-types@0.1.0-beta.131
  - @igrp/framework-next-ui@0.1.0-beta.131

## 0.1.0-beta.131

### Patch Changes

- Updated dependencies [776aac2]
- Updated dependencies [f283926]
  - @igrp/framework-next-ui@0.1.0-beta.130
  - @igrp/framework-next-auth@0.1.0-beta.129
  - @igrp/framework-next-types@0.1.0-beta.130

## 0.1.0-beta.130

### Patch Changes

- fe2ed3d: - Update `@types/node` to v25.7.0 across all framework packages
  - Bump `typescript-eslint` and `vitest` to latest versions
- Updated dependencies [fe2ed3d]
  - @igrp/framework-next-auth@0.1.0-beta.128
  - @igrp/framework-next-types@0.1.0-beta.129
  - @igrp/framework-next-ui@0.1.0-beta.129

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
