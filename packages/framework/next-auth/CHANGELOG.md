# @igrp/framework-next-auth

## 0.1.0-beta.119

### Patch Changes

- 20a0850: useSafeSession() now calls signOut() immediately when forceLogout is detected, eliminating the need for a navigation to trigger logout after refresh failure.
- 2137c48: Auto-revoke OIDC token on logout via events.signOut callback (non-blocking)

## 0.1.0-beta.118

### Patch Changes

- Graceful error handling for invalid AUTH_PROVIDER configuration.

  **Previously:** `withIGRPAuth()` threw synchronously at module-evaluation time when `AUTH_PROVIDER` was set to an unsupported value (e.g. `autentika`). This crashed the module before React loaded and showed a raw Next.js runtime error overlay with no helpful UI.

  **Now:** `withIGRPAuth()` catches provider-resolution errors and stores them as `configError: IGRPAuthConfigError | null` on the returned instance. Errors are re-thrown lazily so App Router error boundaries can catch and render a proper diagnostic page:
  - `GET` / `POST` handlers return a `500` HTML page with the error code and message.
  - `serverSession()` / `getSession()` throw `IGRPAuthConfigError` during render — caught by the nearest `error.tsx` or `global-error.tsx`.

  **New exports** from `@igrp/framework-next-auth/config`:
  - `IGRPAuthConfigError` — typed error class (`name: 'IGRPAuthConfigError'`, `code: string`)
  - `isIGRPAuthConfigError(error)` — structural guard (works across serialisation boundaries)

- Rename provider ID from `oauth2` to `igrp-auth`.

  **Breaking changes:**
  - `AUTH_PROVIDER` now accepts `igrp-auth` or `none` only (`oauth2` is removed)
  - `AUTH_PROVIDER` defaults to `igrp-auth`
  - `OAUTH2_CLIENT_ID`, `OAUTH2_CLIENT_SECRET`, `OAUTH2_ISSUER`, `OAUTH2_SCOPES` env vars renamed to `IGRP_AUTH_CLIENT_ID`, `IGRP_AUTH_CLIENT_SECRET`, `IGRP_AUTH_ISSUER`, `IGRP_AUTH_SCOPES`
  - `OAUTH2_PROVIDER_ID` named export renamed to `IGRP_AUTH_PROVIDER_ID`
  - `AUTH_PROVIDER_IDS.OAUTH2` key renamed to `AUTH_PROVIDER_IDS.IGRP_AUTH`
  - NextAuth callback URL changes from `/api/auth/callback/oauth2` → `/api/auth/callback/igrp-auth`

  **Migration:** Update your `.env` file — replace `AUTH_PROVIDER=oauth2` with `AUTH_PROVIDER=igrp-auth`, and rename all `OAUTH2_*` vars to `IGRP_AUTH_*`. Re-register the redirect URI on your authorization server as `{NEXTAUTH_URL}/api/auth/callback/igrp-auth`.

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
