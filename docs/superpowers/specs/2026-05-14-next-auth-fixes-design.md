# next-auth fixes — Design Spec

**Date:** 2026-05-14  
**Package:** `packages/framework/next-auth` (`@igrp/framework-next-auth`)  
**Approach:** Surgical fixes — no architecture changes, only bug fixes and missing features added.

---

## Background

Four distinct problems were identified during review against the IGRP OIDC server well-known configuration (`https://api-demoigrp.nosi.cv/igrp-access-management/.well-known/openid-configuration`):

1. `AUTH_PROVIDER` defaults to `'igrp-auth'` — should default to `'none'` (opt-in auth)
2. `expiresAt` is stored in milliseconds after sign-in but in seconds after refresh — causes infinite refresh loop
3. Logout does not revoke the token reliably and never terminates the IdP SSO session
4. Token introspection endpoint is unused — no server-side token validity check before refresh attempts

---

## Change 1 — AUTH_PROVIDER default: `'igrp-auth'` → `'none'`

**File:** `packages/framework/next-auth/src/providers.ts`

`getAuthProviderIdFromEnv()` currently falls back to `IGRP_AUTH_PROVIDER_ID` (`'igrp-auth'`) when the `AUTH_PROVIDER` environment variable is not set. Change the fallback to `NONE_PROVIDER_ID` (`'none'`).

Auth is now **opt-in**: deployments must explicitly set `AUTH_PROVIDER=igrp-auth` to enable authentication.

**Impact:** Templates and apps that rely on the implicit default must add `AUTH_PROVIDER=igrp-auth` to their `.env`. The `'none'` provider ID is already a valid `AuthProviderId` — no type changes needed.

---

## Change 2 — Fix `expiresAt` unit mismatch

**File:** `packages/framework/next-auth/src/oidc.ts`

### The bug

| Code path | Expression | Unit stored |
|---|---|---|
| Initial sign-in (`config.ts`) | `accountTyped.expires_at * 1000` | milliseconds ✓ |
| After refresh (`oidc.ts`) | `Math.floor(Date.now() / 1000 + expires_in)` | **seconds ✗** |

The validity check in the JWT callback is `Date.now() < igrpToken.expiresAt`. `Date.now()` is always in milliseconds (~1.7 trillion). After the first refresh, `expiresAt` is a seconds-scale number (~1.7 billion) — always less than `Date.now()` — so the token is treated as permanently expired, triggering another refresh, which fails, setting `forceLogout: true`.

### Fix

Normalize `expiresAt` to **milliseconds everywhere**. In `refreshOidcAccessToken()`, change the return value:

```typescript
// Before (seconds — wrong)
expiresAt: Math.floor(Date.now() / 1000 + (refreshedToken.expires_in ?? 0)),

// After (milliseconds — correct)
expiresAt: Date.now() + (refreshedToken.expires_in ?? 3600) * 1000,
```

Also add a proactive refresh buffer of 60 seconds so tokens are refreshed before they expire at the IdP rather than exactly at expiry:

```typescript
// In jwt callback, replace:
if (igrpToken.expiresAt && Date.now() < igrpToken.expiresAt)

// With:
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;
if (igrpToken.expiresAt && Date.now() < igrpToken.expiresAt - TOKEN_REFRESH_BUFFER_MS)
```

---

## Change 3 — Logout: revocation + RP-initiated logout

### 3a — Token revocation (fix existing)

**File:** `packages/framework/next-auth/src/oidc.ts`

The existing `revokeOidcSession()` was silently failing because the `expiresAt` bug corrupted token state before `signOut` fired (refresh loop exhausted the `refreshToken`). With Change 2 applied, revocation should work. Add error logging to surface failures during development:

```typescript
void revokeOidcSession(token, env).catch((err) => {
  console.error('[next-auth] token revocation failed:', err);
});
```

The IGRP revocation endpoint is `https://…/oauth2/revoke` (from discovery). The existing POST with `token_type_hint=refresh_token` and `client_secret_basic` credentials matches what the server supports.

### 3b — RP-initiated logout via `end_session_endpoint` (new)

**File:** `packages/framework/next-auth/src/oidc.ts`  
**New export:** `buildEndSessionUrl(token, env, postLogoutRedirectUri): Promise<string | null>`

After local session clearance, the IdP SSO session (browser cookie) remains alive. The browser must be redirected to `end_session_endpoint` to terminate it.

**Function contract:**
- Fetches the discovery document (cached), reads `end_session_endpoint`
- Returns `null` if `end_session_endpoint` is absent or `token.idToken` is missing — consumer falls back to `/login`
- Builds the URL with:
  - `id_token_hint` — the stored `idToken` (tells IdP which session to end)
  - `post_logout_redirect_uri` — the caller-supplied redirect URI
  - `client_id` — from env

**IGRP endpoint:** `https://api-demoigrp.nosi.cv/igrp-access-management/connect/logout`

**Consumer pattern** (in `next-ui` or template):
```typescript
import { buildEndSessionUrl } from '@igrp/framework-next-auth/oidc';

const endSessionUrl = await buildEndSessionUrl(token, env, `${origin}/login`);
await signOut({ callbackUrl: endSessionUrl ?? '/login' });
```

The flow becomes:
1. Client calls `signOut({ callbackUrl: endSessionUrl })`
2. NextAuth clears local session cookie, revokes refresh token (`events.signOut`)
3. Browser is redirected to `end_session_endpoint` at the IdP
4. IdP clears SSO session, redirects browser to `post_logout_redirect_uri` (app login page)

---

## Change 4 — Introspection as refresh gate

**File:** `packages/framework/next-auth/src/oidc.ts`  
**New export:** `introspectOidcToken(token, env): Promise<boolean>`

### Purpose

Before attempting a token refresh, verify the access token's status at the IdP. Catches server-side revocations (admin-forced logout, compromised tokens) and avoids a wasted refresh call.

### Function contract

- POSTs to `introspection_endpoint` from the discovery document
- Auth: `client_secret_basic` (Base64 `clientId:clientSecret` in `Authorization` header) — supported per well-known config
- Body: `token=<accessToken>&token_type_hint=access_token`
- Returns `true` if response contains `{ active: true }` (RFC 7662)
- Returns `true` on network error or non-OK response — **fail-open** so a transient IdP outage does not log everyone out
- Returns `false` only on a definitive `{ active: false }` response

**IGRP endpoint:** `https://api-demoigrp.nosi.cv/igrp-access-management/oauth2/introspect`

### Wiring into JWT callback (`config.ts`)

Replace the expired-token branch:

```
token expired
  → introspectOidcToken(accessToken)
      → false (definitively inactive) → return { ...token, error: 'RefreshAccessTokenError', forceLogout: true }
      → true (active or network error) → attempt refreshOidcAccessToken()
          → success → return refreshed token
          → failure → return { ...token, error: 'RefreshAccessTokenError', forceLogout: true }
```

---

## Files changed

| File | Change |
|---|---|
| `src/providers.ts` | Change default from `'igrp-auth'` to `'none'` |
| `src/oidc.ts` | Fix `expiresAt` unit; add `buildEndSessionUrl()`; add `introspectOidcToken()`; add error logging to `revokeOidcSession()` |
| `src/config.ts` | Add `TOKEN_REFRESH_BUFFER_MS`; update expired-token branch to gate on introspect |

No new entry points. No type changes. No new env vars. `oidc.ts` exports are already exposed via the `./oidc` subpath entry point.

---

## Out of scope

- Switching provider `type` from `'oauth'` to `'oidc'`
- Refactoring OIDC operations into a class/module
- PKCE support changes
- Changes to `next-ui` or templates (consumer pattern for `buildEndSessionUrl` is guidance only)
