# Logout OIDC Fix — Design Spec

**Date:** 2026-05-15
**Status:** Approved
**Scope:** `packages/framework/next-auth`, `templates/demo-legacy`

---

## Problem

SSO session persists after logout in `templates/demo-legacy`. The user's local NextAuth session is cleared, but the Keycloak SSO session remains active — allowing the user to log back in without re-entering credentials.

**Root cause:** `buildEndSessionUrl` in `packages/framework/next-auth/src/oidc.ts` (line 165) hard-returns `null` when `token.idToken` is absent. This prevents the browser redirect to Keycloak's `end_session_endpoint`, so Keycloak never clears the SSO session. The user lands directly on `/login` — local session gone, IdP session intact.

Secondary issue: `idToken` preservation in `refreshOidcAccessToken` uses `??` (nullish coalescing) rather than `||`, which does not catch an empty-string `id_token` returned by some Keycloak configurations.

---

## Architecture

### Current flow (broken path)

```
/logout page
  → getLogoutUrl() server action
      → auth.getAccessToken()   // reads JWT from cookie
      → buildEndSessionUrl(token, env, postLogoutRedirectUri)
          → if (!token.idToken) return null   ← BREAKS HERE
  → signOut({ redirect: false })
  → endSessionUrl is null → router.replace("/login")
  // Keycloak SSO session never cleared
```

### Fixed flow

```
/logout page
  → getLogoutUrl() server action
      → auth.getAccessToken()   // reads JWT from cookie
      → [log warn if token is null]
      → buildEndSessionUrl(token, env, postLogoutRedirectUri)
          → always builds URL when end_session_endpoint exists
          → includes id_token_hint only when idToken is present
          → always includes client_id (Keycloak fallback identifier)
  → signOut({ redirect: false })
  → if endSessionUrl: window.location.replace(endSessionUrl)
      → Keycloak clears SSO session → redirects back to /login
  → else: router.replace("/login")
```

---

## Changes

### 1. `packages/framework/next-auth/src/oidc.ts` — `buildEndSessionUrl`

**File:** `packages/framework/next-auth/src/oidc.ts`
**Function:** `buildEndSessionUrl` (currently lines 158–178)

Remove the `if (!token.idToken) return null` guard. The function should return `null` only for:
- `providerId === 'none'` (auth disabled — no provider)
- Missing `end_session_endpoint` in the discovery document

When building the URL:
- Always set `client_id` parameter (Keycloak requires this as session identifier when `id_token_hint` is absent)
- Set `id_token_hint` only when `token.idToken` is a non-empty string
- Keep `post_logout_redirect_uri`

**Signature stays the same:** `(token: JWT, env: AuthEnvironment, postLogoutRedirectUri: string) => Promise<string | null>`

### 2. `packages/framework/next-auth/src/oidc.ts` — `refreshOidcAccessToken`

**File:** `packages/framework/next-auth/src/oidc.ts`
**Function:** `refreshOidcAccessToken` (currently line 116)

Change:
```ts
idToken: refreshedToken.id_token ?? token.idToken,
```
To:
```ts
idToken: refreshedToken.id_token || token.idToken,
```

`||` treats empty string as falsy and falls back to the stored value, preventing a silent wipe of `idToken` when Keycloak returns `""` on refresh.

### 3. `templates/demo-legacy/src/actions/igrp/auth.ts` — `getLogoutUrl`

**File:** `templates/demo-legacy/src/actions/igrp/auth.ts`
**Function:** `getLogoutUrl`

Add `console.warn` logging before null returns:
- When `auth.getAccessToken()` returns null → log that no active token was found
- After `buildEndSessionUrl` returns null → log that no end-session URL was built (include whether `idToken` was present and whether `end_session_endpoint` was expected)

This stays in the template (not the framework) so it can be adjusted by template consumers without touching the package.

### 4. Changeset

Create a `patch` changeset for `@igrp/framework-next-auth` describing the fix:
- `buildEndSessionUrl` no longer requires `idToken` to build the Keycloak end-session URL
- `refreshOidcAccessToken` now uses `||` for `idToken` fallback

---

## Data flow

```
buildEndSessionUrl(token, env, postLogoutRedirectUri)
  ├── providerId === 'none'         → return null
  ├── fetch discovery doc
  ├── no end_session_endpoint       → return null
  └── build URL
        client_id = env.IGRP_AUTH_CLIENT_ID           (always)
        post_logout_redirect_uri = postLogoutRedirectUri (always)
        id_token_hint = token.idToken                  (only if non-empty)
```

---

## Error handling

- `buildEndSessionUrl` is already wrapped in the server action; if the discovery fetch throws, the error propagates to `getLogoutUrl` which is already wrapped in the `logout/page.tsx` try/catch — falls back to `/login`.
- Diagnostic `console.warn` in `getLogoutUrl` does not affect the happy path.
- The `||` change in `refreshOidcAccessToken` is purely defensive; no new code paths.
- When `idToken` is absent, Keycloak may show a logout confirmation page ("Do you want to log out?") instead of auto-redirecting, depending on Keycloak client config. This is acceptable behavior — the SSO session will still be cleared once the user confirms. To avoid the confirmation page, ensure Keycloak's OIDC client has "Front channel logout" disabled or configure it to skip confirmation when `client_id` is provided.

---

## Testing

- Manual: log in → log out → verify Keycloak SSO is cleared (re-login asks for credentials)
- Manual (no-idToken case): simulate a token without `idToken` → confirm URL is still built and logout redirects to Keycloak
- Manual (preview mode): verify `/logout` still redirects to `/` without hitting OIDC logic (`auth.isPreviewMode()` check in middleware handles this)

---

## Out of scope

- Back-channel logout (OIDC logout tokens)
- `post_logout_redirect_uri` registration validation (Keycloak client config — must be done in Keycloak admin)
- Applying the diagnostic logging to `templates/demo-legacy` (canonical template) — not requested
