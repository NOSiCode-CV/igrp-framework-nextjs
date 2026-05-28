# @igrp/framework-next-auth

## 0.1.0-beta.133

### Patch Changes

- f89e1ab: fix(auth): stop double signOut race and clear stale refresh-error from still-valid tokens
  - `useSafeSession` no longer calls `signOut()` on `RefreshAccessTokenError`.
    That responsibility was already owned by `IGRPSessionWatcher` (path-aware,
    routes to `/logout` for a clean IdP single-logout). Having both fire meant
    two concurrent `POST /api/auth/signout` calls when a layout consumer
    mounted alongside the logout page, racing the page's own end-session
    redirect and leaving the UI stuck on "A terminar sessão…". The function
    signature keeps `forceLogoutCallbackUrl` as an inert option for
    backwards-compatibility with existing call sites.
  - The `jwt` callback's still-valid early-return now clears any leftover
    `error` / `forceLogout` flags before returning. Otherwise a successful
    refresh inside a server-component tree (where `cookies()` is read-only
    and the rotated token can't be persisted) would leave the cookie token
    tagged with `RefreshAccessTokenError`; the next route-handler poll would
    see "still valid" + stale error and return it untouched, sticking the
    user in an auto-logout loop.

- ec48e46: `refreshOidcAccessToken` now deduplicates concurrent refreshes that share a refresh_token. NextAuth's jwt callback runs once per session read, so near token expiry an RSC render + a `useSession` poll + a server action can all attempt a refresh with the SAME refresh_token; with refresh-token rotation the IdP accepts the first and rejects every subsequent one with `invalid_grant`, and the last cookie write wins — logging the user out even though one refresh succeeded. Sharing the in-flight promise collapses N concurrent calls into one network round-trip and one cookie write.

  In-memory only — multi-instance deployments can still race across pods, but single-process dev (and most production traffic via sticky routing) is fully covered.

## 0.1.0-beta.132

### Patch Changes

- 12cc11b: fix(framework-next-auth): don't swallow the `onSessionExpired` redirect in `getSession`

  When a session was expired or its refresh had failed (`error: 'RefreshAccessTokenError'`), `getSession()` invoked `onSessionExpired()` (typically `redirect('/logout')`) from _inside_ a `try/catch`. `redirect()` signals via a thrown `NEXT_REDIRECT` error, so the bare `catch` swallowed it — the intended redirect was silently cancelled and a dead session stayed mounted until the next access-token-bearing request 401'd into the error boundary (surfacing as `global-error`).

  `getSession` now keeps only `serverSession()` inside the `try/catch` (where a thrown error legitimately means "no session"), and runs the expiry/refresh check plus `onSessionExpired()` afterwards so the redirect propagates as intended.

- 12cc11b: fix(oidc): introspect the refresh token instead of the access token in the refresh gate

  The jwt callback's pre-refresh introspection (`introspectOidcToken`) checked the **access token**. That gate only runs once the access token is expired or inside its refresh buffer, and an expired access token always introspects as `active: false` per RFC 7662 — so the gate forced a logout (`RefreshAccessTokenError` / `forceLogout`) exactly when a refresh should have happened, leaving silent refresh effectively non-functional.

  It now introspects the **refresh token** (`token_type_hint=refresh_token`), whose liveness actually determines whether `grant_type=refresh_token` can succeed. A live refresh token proceeds to refresh; a server-side-revoked one is correctly detected and forces logout. Introspection stays fail-open so a flaky introspection endpoint never blocks refresh.

- 12cc11b: fix(config): give middleware a small expiry grace so the client refresh can win

  `isTokenExpiredOrFailed` (used by middleware to decide the `/login` redirect) shared the 60s `TOKEN_REFRESH_BUFFER_MS` with the jwt callback's proactive refresh. That meant middleware redirected to `/login` at exactly the moment the client session poll would have refreshed the token, so navigations near expiry were bounced before any silent refresh could land.

  Middleware now uses a separate, much smaller `TOKEN_EXPIRY_GRACE_MS` (10s), so it stays lenient through the proactive-refresh window and only redirects once the access token is effectively expired — letting the client poll / focus-refetch rotate the session cookie first (and, when it can't, falling back to a silent IdP-SSO re-login via `/login`). Refresh-error tokens are still treated as expired immediately.

- cc40fef: Enable PKCE (RFC 7636, S256) and OIDC `nonce` validation on the `igrp-auth` provider in addition to the existing `state` check. PKCE protects the authorization-code exchange against code-interception even when the client_secret is confidential; `nonce` prevents id_token replay (CWE-294) given the provider already opts into `idToken: true`. The change touches only the `/authorize` → `/callback` exchange owned by NextAuth — refresh, revocation, and introspection are unaffected. Spring Authorization Server (the default IGRP IdP) accepts PKCE on confidential clients without server-side configuration. Deployments behind reverse proxies that rewrite paths between authorize and callback may observe `PKCE_ERROR`; this is the same class of failure that already affected the `state` cookie and is rooted in `NEXTAUTH_URL` / proxy stability rather than the OAuth client config.
- cc40fef: Fix `withIGRPAuth` redirect callback discarding `callbackUrl` when `NEXTAUTH_URL_INTERNAL` was set, which forced every post-login redirect to the app home. The callback now honors a safe same-origin or relative `callbackUrl` and falls back to the configured home slug only when no useful destination was provided. This restores the expected flow after a token-refresh-driven re-login: the user lands back on the page they were on, not on `/`.

## 0.1.0-beta.131

### Patch Changes

- 2a0ef32: fix(auth): close the logout race that left IdP refresh tokens unrevoked + refresh now re-issues id_token
  - **Refresh-token grant now requests `scope`**, matching `IGRP_AUTH_SCOPES` and always including `openid`. Without this, Spring Authorization Server (and other OIDC v1 servers) returns access_token + refresh_token only, leaving the original id_token in the JWT. Over the lifetime of a session, the cached id_token's `sid` claim drifts away from the current servlet session — and the IdP's `/connect/logout` endpoint then no-ops because `id_token_hint.sid` no longer matches. With `scope=openid` on refresh, the IdP re-issues a fresh id_token whose `sid` tracks the current session.
  - `revokeOidcSession` now returns a tagged result instead of throwing. Adds explicit reasons for skip (`no_refresh_token`, `no_revocation_endpoint`), and captures HTTP status + response body on non-2xx so IdP-side rejections are diagnosable.
  - `events.signOut` now **awaits** `revokeOidcSession`. NextAuth holds the `/api/auth/signout` response until revoke settles, so the browser does not navigate to the end-session URL with a still-in-flight revoke request that the navigation would abort.
  - Dev-only diagnostics: `buildEndSessionUrl` logs the built URL shape (which of `client_id`, `post_logout_redirect_uri`, `id_token_hint` were set); `refreshOidcAccessToken` warns when the IdP did not return a new id_token on refresh; `events.signOut` logs `{ hasIdToken, hasAccessToken, hasRefreshToken, authProviderId, expiresAt, error }` (booleans only — never token values). Gated behind `NODE_ENV !== 'production'`.

  Companion change in `templates/demo-legacy`: `/logout` page logs the end-session URL just before navigating, and warns when no URL was built. `.env`, `.env.example`, and `README.md` document the post-logout redirect URI registration requirement and clarify scope alignment with the IdP discovery doc.

## 0.1.0-beta.130

### Patch Changes

- fix: respect NEXT_PUBLIC_BASE_PATH in login redirect URLs

  `useSafeSession` default `forceLogoutCallbackUrl` and `getLoginRedirectUrl` both
  produced URLs without the basePath when `NEXT_PUBLIC_BASE_PATH` is set, causing
  redirects to `/login` instead of `/{basePath}/login`. Both now read
  `process.env.NEXT_PUBLIC_BASE_PATH` (a build-time NEXT_PUBLIC constant) to
  prepend the basePath automatically.

## 0.1.0-beta.129

### Patch Changes

- f283926: buildEndSessionUrl no longer requires idToken to build the Keycloak end-session URL; idToken fallback in refreshOidcAccessToken now uses || to handle empty-string responses

## 0.1.0-beta.128

### Patch Changes

- fe2ed3d: - Update `@types/node` to v25.7.0 across all framework packages
  - Bump `typescript-eslint` and `vitest` to latest versions

## 0.1.0-beta.127

### Patch Changes

- 4e9ecd5: Fix expiresAt unit bug causing infinite refresh loops; change AUTH_PROVIDER default to none; add buildEndSessionUrl for RP-initiated logout; add introspectOidcToken refresh gate

## 0.1.0-beta.120

### Patch Changes

- 939446a: fix(framework-next-auth): rethrow getServerSession errors instead of swallowing them as null

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
