# @igrp/framework-next-types

## 0.1.0-beta.137

### Patch Changes

- 6b42572: - Coordinated maintenance release: bump all framework packages to the next beta to keep versions aligned across the framework.
- Updated dependencies [6b42572]
  - @igrp/framework-next-auth@0.1.0-beta.135

## 0.1.0-beta.136

### Patch Changes

- ba91edb: feat: gate menu-role sync on `IGRP_SYNC_ON_CODE_MENU_ROLES`

  The on-code menu push can now control the `syncRoles` argument of
  `client.m2m.syncApplicationMenus(appCode, menus, syncRoles)`.
  - **next-types**: new optional `apiManagementConfig.syncOnCodeMenuRoles?: boolean`. Defaults to `true` (matching the AM client default) when omitted.
  - **next**: `igrpSyncMenus` now requires a `syncRoles` arg and forwards it as the third parameter of `syncApplicationMenus`; `planAccessManagementSync` derives `syncOnCodeMenuRoles` from config (`true` unless explicitly `false`) and `igrpStartupSync` threads it through.

  Only consulted when the on-code menu push actually runs (`IGRP_SYNC_ON_CODE_MENUS=true` plus the outer `IGRP_SYNC_ACCESS` / `IGRP_PREVIEW_MODE` gates). Outer gating is unchanged.

- Updated dependencies [b88c4b1]
  - @igrp/framework-next-auth@0.1.0-beta.134

## 0.1.0-beta.135

### Patch Changes

- Updated dependencies [f89e1ab]
- Updated dependencies [ec48e46]
  - @igrp/framework-next-auth@0.1.0-beta.133

## 0.1.0-beta.134

### Patch Changes

- 0cdef39: docs(next-types): remove stale m2mScope JSDoc

  The JSDoc block above `appRoutes` in `apiManagementConfig` documented an `m2mScope` field that no longer exists (removed during the OAuth2 client_credentials migration 08). Removed the orphaned doc.

- 123e361: feat(next-types): add `syncOnCodeMenus` and `onCodeMenus` to `apiManagementConfig`

  Two new optional fields on `IGRPConfigArgs['apiManagementConfig']`:
  - `syncOnCodeMenus?: boolean` — when true, the framework pushes `onCodeMenus` to Access Management at startup.
  - `onCodeMenus?: IGRPMenuItemArgs[]` — the template-defined menu array used as the push payload.

  Both are optional; omitting them keeps the current (post-migration-08) no-push behavior.

- Updated dependencies [12cc11b]
- Updated dependencies [12cc11b]
- Updated dependencies [12cc11b]
- Updated dependencies [cc40fef]
- Updated dependencies [cc40fef]
  - @igrp/framework-next-auth@0.1.0-beta.132

## 0.1.0-beta.133

### Patch Changes

- 2196ef8: feat(types)!: migrate `apiManagementConfig` to OAuth2 `client_credentials`

  **Breaking** changes to `IGRPConfigArgs['apiManagementConfig']`:
  - **Removed** `m2mToken` — replaced by `m2mClientId` + `m2mClientSecret` (OAuth2 client_credentials). The downstream library (`@igrp/platform-access-management-client-ts`) still exposes `M2MClientConfig.token` as `@deprecated` for legacy pinning if needed.
  - **Removed** `syncOnCodeMenus` — the field had no effect. All sync phases (application, routes, menus) are gated on the top-level `syncAccess` flag in `IGRPRootLayout`.
  - **Renamed** `m2mServiceId` → `serviceId`. The value is service identity (resource name + `X-Machine-Service-ID` header), not an auth credential. The new prefix discipline: `m2m*` is reserved for OAuth2 credentials only.
  - **Added** required `m2mClientId: string` and `m2mClientSecret: string` for OAuth2 client_credentials authentication.

  Migration: rename `m2mServiceId` → `serviceId` and `m2mToken` → `m2mClientId`/`m2mClientSecret` in your `igrpBuildConfig` call. The TypeScript error guides the rename. See `templates/demo-legacy/src/igrp.template.config.ts` for the canonical shape.

- Updated dependencies [2a0ef32]
  - @igrp/framework-next-auth@0.1.0-beta.131

## 0.1.0-beta.132

### Patch Changes

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.130

## 0.1.0-beta.131

### Patch Changes

- f8dc318: feat: remove showSidebar/showHeader from IGRPConfigArgs

## 0.1.0-beta.130

### Patch Changes

- Updated dependencies [f283926]
  - @igrp/framework-next-auth@0.1.0-beta.129

## 0.1.0-beta.129

### Patch Changes

- fe2ed3d: - Update `@types/node` to v25.7.0 across all framework packages
  - Bump `typescript-eslint` and `vitest` to latest versions
- Updated dependencies [fe2ed3d]
  - @igrp/framework-next-auth@0.1.0-beta.128

## 0.1.0-beta.128

### Patch Changes

- Updated dependencies [4e9ecd5]
  - @igrp/framework-next-auth@0.1.0-beta.127

## 0.1.0-beta.120

### Patch Changes

- Updated dependencies [939446a]
  - @igrp/framework-next-auth@0.1.0-beta.120

## 0.1.0-beta.119

### Patch Changes

- Updated dependencies [20a0850]
- Updated dependencies [2137c48]
  - @igrp/framework-next-auth@0.1.0-beta.119

## 0.1.0-beta.118

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.118

## 0.1.0-beta.117

### Patch Changes

- 724398a: Replace Keycloak and Autentika providers with a single generic `oauth2` OIDC provider.

  **Breaking changes:**
  - `AUTH_PROVIDER` now accepts `oauth2` or `none` only (`keycloak` and `autentika` are removed)
  - `AUTH_PROVIDER` defaults to `oauth2` (previously defaulted to `keycloak`)
  - `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER` env vars removed
  - `AUTENTIKA_CLIENT_ID`, `AUTENTIKA_CLIENT_SECRET`, `AUTENTIKA_HOST`, `AUTENTIKA_TENANT_NAME`, `AUTENTIKA_SCOPES` env vars removed
  - `KEYCLOAK_PROVIDER_ID` and `AUTENTIKA_PROVIDER_ID` named exports removed from all entry points

  **Migration:** Replace with `OAUTH2_CLIENT_ID`, `OAUTH2_CLIENT_SECRET`, `OAUTH2_ISSUER`, `OAUTH2_SCOPES` (optional, defaults to `openid`). The redirect URI to register on your server is `{NEXTAUTH_URL}/api/auth/callback/oauth2`.

- Updated dependencies [724398a]
  - @igrp/framework-next-auth@1.0.0-beta.117

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
  - @igrp/framework-next-auth@0.1.0-beta.115

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
  - @igrp/framework-next-auth@0.1.0-beta.114
