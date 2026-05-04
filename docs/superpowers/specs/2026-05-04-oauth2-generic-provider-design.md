# Design: Generic OAuth2/OIDC Provider for `@igrp/framework-next-auth`

**Date:** 2026-05-04  
**Status:** Approved  
**Author:** Fidel da Luz  

---

## Context

`@igrp/framework-next-auth` currently ships two real OAuth providers — **Keycloak** and **Autentika** (WSO2 Identity Server) — plus a `none` stub for preview mode. Each provider requires its own set of env vars (`KEYCLOAK_*`, `AUTENTIKA_*`) and has provider-specific discovery URL logic baked into the package.

The goal is to replace both with a single **generic OAuth2/OIDC provider** (`oauth2`) that works with any standards-compliant authorization server using only: client ID, client secret, OIDC issuer, and scopes. This unifies the auth configuration across all IGRP applications.

---

## Decisions

| Question | Decision |
|---|---|
| OIDC discovery pattern | Standard: `OAUTH2_ISSUER/.well-known/openid-configuration` |
| Legacy providers | Keycloak + Autentika **removed** (breaking change) |
| New provider ID | `oauth2` (`AUTH_PROVIDER=oauth2`) |
| Default provider | `oauth2` replaces `keycloak` as the fallback when `AUTH_PROVIDER` is unset |
| `none` provider | Kept for preview mode |
| Approach | Option B — clean consolidation: rewrite `providers.ts`, simplify `oidc.ts` |
| Versioning | Major bump for `next-auth` (breaking), patch for `next-types` |

---

## New Environment Variables

### `@igrp/framework-next-auth`

| Variable | Required | Default | Description |
|---|---|---|---|
| `AUTH_PROVIDER` | No | `oauth2` | Provider selector. Supported: `oauth2`, `none` |
| `OAUTH2_CLIENT_ID` | Yes (when `oauth2`) | — | OAuth2 client identifier registered on the auth server |
| `OAUTH2_CLIENT_SECRET` | Yes (when `oauth2`) | — | OAuth2 client secret |
| `OAUTH2_ISSUER` | Yes (when `oauth2`) | — | Base URL for OIDC discovery. Framework appends `/.well-known/openid-configuration` |
| `OAUTH2_SCOPES` | No | `openid` | Space-separated OAuth2 scopes |

### Removed variables

`KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER`,
`AUTENTIKA_CLIENT_ID`, `AUTENTIKA_CLIENT_SECRET`, `AUTENTIKA_HOST`,
`AUTENTIKA_TENANT_NAME`, `AUTENTIKA_SCOPES`

---

## How OIDC Discovery Works

The developer sets `OAUTH2_ISSUER` to the base URL up to the point where `/.well-known/openid-configuration` resolves:

```
OAUTH2_ISSUER=http://domain:port
             ↓
discovery → http://domain:port/.well-known/openid-configuration
             ↓
NextAuth reads:
  authorization_endpoint = http://domain:port/oauth2/authorize  ✓ (auto)
  token_endpoint         = http://domain:port/oauth2/token      ✓ (auto)
  revocation_endpoint    = http://domain:port/oauth2/revoke     ✓ (auto)
```

The `/oauth2/authorize` URL is **never configured manually** — it comes from the discovery document.

### Redirect URI

NextAuth registers the callback at:
```
http://localhost:3000/api/auth/callback/oauth2
```

This is what must be registered as the allowed redirect URI on the OAuth2 server (not `/callback`).

---

## Files Changed

### `packages/framework/next-auth`

#### `src/providers.ts` — rewritten

Two provider cases only:

```
AUTH_PROVIDER_REGISTRY = {
  oauth2: {
    requiredEnvKeys: ['OAUTH2_CLIENT_ID', 'OAUTH2_CLIENT_SECRET', 'OAUTH2_ISSUER'],
    getDiscoveryUrl: (env) => `${OAUTH2_ISSUER}/.well-known/openid-configuration`,
    createProvider:  (env) → OAuthConfig with wellKnown, clientId, clientSecret, scope
  },
  none: {
    requiredEnvKeys: [],
    getDiscoveryUrl: () => '',
    createProvider:  () => null,
  }
}
```

Removed: `KeycloakProvider` import, `AutentikaProvider` factory, tenant/scope quirks, custom discovery URL builder.

**Exported constants (updated):**

```ts
// Removed
export const KEYCLOAK_PROVIDER_ID: 'keycloak'
export const AUTENTIKA_PROVIDER_ID: 'autentika'

// Added
export const OAUTH2_PROVIDER_ID = 'oauth2'
export const NONE_PROVIDER_ID = 'none'

export const AUTH_PROVIDER_IDS = { OAUTH2: 'oauth2', NONE: 'none' } as const
export type AuthProviderId = 'oauth2' | 'none'
```

**Public functions — unchanged signatures:**
`getAuthProviderIdFromEnv`, `assertAuthProviderEnv`, `createAuthProviderFromEnv`,
`getAuthProviderDiscoveryUrl`, `getMissingAuthProviderEnvVars`, `isAuthEnabled`, `isAuthDisabled`

#### `src/oidc.ts` — simplified

Remove provider-specific branching for discovery URL construction. Read `OAUTH2_CLIENT_ID` and `OAUTH2_CLIENT_SECRET` directly instead of branching on provider ID. Token refresh and revocation logic, fetch implementation, and discovery cache are unchanged.

#### `src/config.ts` — targeted change

Default provider: `KEYCLOAK_PROVIDER_ID` → `OAUTH2_PROVIDER_ID`. No other changes to the factory, callbacks, or `IGRPAuthInstance` shape.

#### `src/types.ts` — targeted change

```ts
// Before
authProviderId?: 'keycloak' | 'autentika' | 'none'

// After
authProviderId?: 'oauth2' | 'none'
```

Applied to both `Session` and `JWT` module augmentations.

#### `src/client.ts` — export update

```ts
// Removed
export { KEYCLOAK_PROVIDER_ID, AUTENTIKA_PROVIDER_ID } from './providers'

// Added
export { OAUTH2_PROVIDER_ID, NONE_PROVIDER_ID } from './providers'
```

### `packages/framework/next-types`

No code changes. Rebuilds automatically once `next-auth` is rebuilt, picking up the updated `AuthProviderId` union.

### `packages/framework/next`

No changes. `delete-auth-cookies.ts` is provider-agnostic.

---

## Impact on `templates/demo-legacy`

### Files changed

| File | Change |
|---|---|
| `.env.example` | Auth section rewritten: remove `KEYCLOAK_*`/`AUTENTIKA_*`, add `OAUTH2_*` |
| `.env` | Developer must manually update local env vars |
| `src/lib/auth.ts` | JSDoc comment only: `keycloak / autentika / none` → `oauth2 / none` |

### Files NOT changed

- `src/middleware.ts` — already generic, no provider references
- `src/app/api/auth/[...nextauth]/route.ts` — already `export const { GET, POST } = auth`
- `src/app/(auth)/login/page.tsx` — `getAuthProviderIdFromEnv()` returns `'oauth2'` automatically
- All other app code — zero provider-specific references

---

## Changeset

| Package | Bump | Reason |
|---|---|---|
| `@igrp/framework-next-auth` | **major** | Removes `KEYCLOAK_*`/`AUTENTIKA_*` env vars and exported constants; changes `AuthProviderId` union |
| `@igrp/framework-next-types` | **patch** | Picks up updated types from `next-auth` rebuild |

Expected released versions (repo currently in `beta` pre-release mode):

| Package | Current | After release |
|---|---|---|
| `@igrp/framework-next-auth` | `0.1.0-beta.116` | `0.1.0-beta.117` |
| `@igrp/framework-next-types` | `0.1.0-beta.116` | `0.1.0-beta.117` |

---

## Public API: What Does NOT Change

- `withIGRPAuth()` — same options, same return shape (`IGRPAuthInstance`)
- All middleware primitives: `isAuthDisabled`, `isPreviewMode`, `getTokenFromRequest`, `isTokenExpiredOrFailed`, `getLoginRedirectUrl`
- Server helpers: `getAccessToken`, `serverSession`, `getSession`
- `useSafeSession()` client hook
- Session/JWT field shapes (except `authProviderId` type narrowing)
- `none` provider behaviour for preview mode
- Edge/Node runtime boundary design

---

## Migration Guide (for consumers)

1. **Update env vars:**
   ```diff
   - AUTH_PROVIDER=keycloak
   + AUTH_PROVIDER=oauth2

   - KEYCLOAK_CLIENT_ID=my-client
   - KEYCLOAK_CLIENT_SECRET=secret
   - KEYCLOAK_ISSUER=https://auth.example.com/realms/my-realm
   + OAUTH2_CLIENT_ID=my-client
   + OAUTH2_CLIENT_SECRET=secret
   + OAUTH2_ISSUER=https://auth.example.com
   + OAUTH2_SCOPES=openid
   ```

2. **Update any imports of removed constants:**
   ```diff
   - import { KEYCLOAK_PROVIDER_ID } from '@igrp/framework-next-auth'
   + import { OAUTH2_PROVIDER_ID } from '@igrp/framework-next-auth'
   ```

3. **Register the redirect URI** on your OAuth2 server:
   ```
   http://localhost:3000/api/auth/callback/oauth2
   ```

4. **Run** `pnpm build:framework` after updating the package.
