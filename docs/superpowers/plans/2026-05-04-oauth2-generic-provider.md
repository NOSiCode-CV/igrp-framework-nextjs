# OAuth2 Generic Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Keycloak and Autentika providers in `@igrp/framework-next-auth` with a single generic `oauth2` OIDC provider backed by standard discovery.

**Architecture:** Rewrite `providers.ts` to register only `oauth2` (OIDC auto-discovery via `OAUTH2_ISSUER/.well-known/openid-configuration`) and `none` (stub). Simplify `oidc.ts` to read `OAUTH2_CLIENT_ID/SECRET` directly instead of branching on provider. Update `config.ts`, `client.ts` constants, and the `demo-legacy` template env example.

**Tech Stack:** TypeScript, tsup (ESM), NextAuth v4, vitest (added for unit tests), pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-05-04-oauth2-generic-provider-design.md`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `packages/framework/next-auth/package.json` | Add vitest devDep + test script |
| Create | `packages/framework/next-auth/vitest.config.ts` | Vitest config for ESM package |
| Create | `packages/framework/next-auth/src/__tests__/providers.test.ts` | Unit tests for providers.ts pure functions |
| Rewrite | `packages/framework/next-auth/src/providers.ts` | oauth2 + none registry only |
| Modify | `packages/framework/next-auth/src/oidc.ts` | Remove provider branching, read OAUTH2_* directly |
| Modify | `packages/framework/next-auth/src/config.ts` | Remove Keycloak type ref, update JSDoc |
| Modify | `packages/framework/next-auth/src/client.ts` | Export OAUTH2_PROVIDER_ID instead of Keycloak/Autentika |
| Modify | `templates/demo-legacy/.env.example` | Replace KEYCLOAK_*/AUTENTIKA_* with OAUTH2_* |
| Modify | `templates/demo-legacy/src/lib/auth.ts` | Update JSDoc comment only |
| Create | `.changeset/oauth2-generic-provider.md` | Major bump next-auth, patch next-types |

---

## Task 1: Add vitest to `next-auth`

**Files:**
- Modify: `packages/framework/next-auth/package.json`
- Create: `packages/framework/next-auth/vitest.config.ts`

- [ ] **Step 1: Add vitest to devDependencies**

Edit `packages/framework/next-auth/package.json`. Add `vitest` to `devDependencies` and add a `test` script:

```json
{
  "scripts": {
    "clean": "rimraf dist tsconfig.build.tsbuildinfo",
    "format": "prettier --write .",
    "build:js": "tsup",
    "build": "pnpm clean && pnpm build:js",
    "clean-all": "rimraf node_modules && rimraf dist && rimraf tsconfig.tsbuildinfo",
    "release": "pnpm build && yarn publish --registry=https://sonatype.nosi.cv/repository/igrp/ --tag latest",
    "test": "vitest run"
  },
  "devDependencies": {
    "@types/node": "^25.5.0",
    "next-auth": "^4.24.14",
    "prettier": "^3.8.3",
    "rimraf": "^6.1.3",
    "tsup": "^8.5.0",
    "typescript": "^5.9.3",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create vitest config**

Create `packages/framework/next-auth/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Install the new dependency**

Run from repo root:
```bash
pnpm install
```

Expected: vitest resolved and linked in `packages/framework/next-auth/node_modules`.

- [ ] **Step 4: Commit**

```bash
git add packages/framework/next-auth/package.json packages/framework/next-auth/vitest.config.ts pnpm-lock.yaml
git commit -m "chore(next-auth): add vitest for unit tests"
```

---

## Task 2: Write failing tests for the new `providers.ts`

**Files:**
- Create: `packages/framework/next-auth/src/__tests__/providers.test.ts`

- [ ] **Step 1: Create the test file**

Create `packages/framework/next-auth/src/__tests__/providers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  getAuthProviderIdFromEnv,
  assertAuthProviderEnv,
  getMissingAuthProviderEnvVars,
  getAuthProviderDiscoveryUrl,
  createAuthProviderFromEnv,
  isAuthEnabled,
  isAuthDisabled,
  OAUTH2_PROVIDER_ID,
  NONE_PROVIDER_ID,
  AUTH_PROVIDER_IDS,
} from '../providers';

const VALID_OAUTH2_ENV = {
  AUTH_PROVIDER: 'oauth2',
  OAUTH2_CLIENT_ID: 'igrp-example',
  OAUTH2_CLIENT_SECRET: 'psw',
  OAUTH2_ISSUER: 'http://localhost:9090',
};

describe('getAuthProviderIdFromEnv', () => {
  it('returns oauth2 when AUTH_PROVIDER=oauth2', () => {
    expect(getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'oauth2' })).toBe('oauth2');
  });

  it('defaults to oauth2 when AUTH_PROVIDER is not set', () => {
    expect(getAuthProviderIdFromEnv({})).toBe('oauth2');
  });

  it('returns none when AUTH_PROVIDER=none', () => {
    expect(getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'none' })).toBe('none');
  });

  it('is case-insensitive', () => {
    expect(getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'OAUTH2' })).toBe('oauth2');
    expect(getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'NONE' })).toBe('none');
  });

  it('throws for unknown provider', () => {
    expect(() => getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'keycloak' })).toThrow(
      'Unsupported AUTH_PROVIDER "keycloak"',
    );
  });

  it('throws for autentika (removed provider)', () => {
    expect(() => getAuthProviderIdFromEnv({ AUTH_PROVIDER: 'autentika' })).toThrow(
      'Unsupported AUTH_PROVIDER "autentika"',
    );
  });
});

describe('getMissingAuthProviderEnvVars', () => {
  it('returns missing keys for oauth2 when env is empty', () => {
    const missing = getMissingAuthProviderEnvVars({}, 'oauth2');
    expect(missing).toEqual(['OAUTH2_CLIENT_ID', 'OAUTH2_CLIENT_SECRET', 'OAUTH2_ISSUER']);
  });

  it('returns empty array when all oauth2 vars are present', () => {
    const missing = getMissingAuthProviderEnvVars(VALID_OAUTH2_ENV, 'oauth2');
    expect(missing).toEqual([]);
  });

  it('returns empty array for none provider (no required vars)', () => {
    const missing = getMissingAuthProviderEnvVars({}, 'none');
    expect(missing).toEqual([]);
  });
});

describe('assertAuthProviderEnv', () => {
  it('does not throw when all oauth2 vars are present', () => {
    expect(() => assertAuthProviderEnv(VALID_OAUTH2_ENV)).not.toThrow();
  });

  it('throws when OAUTH2_CLIENT_ID is missing', () => {
    const env = { ...VALID_OAUTH2_ENV, OAUTH2_CLIENT_ID: undefined };
    expect(() => assertAuthProviderEnv(env)).toThrow('OAUTH2_CLIENT_ID');
  });

  it('throws when OAUTH2_CLIENT_SECRET is missing', () => {
    const env = { ...VALID_OAUTH2_ENV, OAUTH2_CLIENT_SECRET: '' };
    expect(() => assertAuthProviderEnv(env)).toThrow('OAUTH2_CLIENT_SECRET');
  });

  it('throws when OAUTH2_ISSUER is missing', () => {
    const env = { ...VALID_OAUTH2_ENV, OAUTH2_ISSUER: undefined };
    expect(() => assertAuthProviderEnv(env)).toThrow('OAUTH2_ISSUER');
  });

  it('does not throw for none provider regardless of env', () => {
    expect(() => assertAuthProviderEnv({ AUTH_PROVIDER: 'none' })).not.toThrow();
  });
});

describe('getAuthProviderDiscoveryUrl', () => {
  it('appends /.well-known/openid-configuration to OAUTH2_ISSUER', () => {
    const url = getAuthProviderDiscoveryUrl(VALID_OAUTH2_ENV);
    expect(url).toBe('http://localhost:9090/.well-known/openid-configuration');
  });

  it('strips trailing slash from OAUTH2_ISSUER before appending', () => {
    const env = { ...VALID_OAUTH2_ENV, OAUTH2_ISSUER: 'http://localhost:9090/' };
    expect(getAuthProviderDiscoveryUrl(env)).toBe(
      'http://localhost:9090/.well-known/openid-configuration',
    );
  });
});

describe('createAuthProviderFromEnv', () => {
  it('returns an OAuthConfig with correct id for oauth2', () => {
    const provider = createAuthProviderFromEnv(VALID_OAUTH2_ENV);
    expect(provider).not.toBeNull();
    expect((provider as { id: string }).id).toBe('oauth2');
  });

  it('sets wellKnown from OAUTH2_ISSUER', () => {
    const provider = createAuthProviderFromEnv(VALID_OAUTH2_ENV) as { wellKnown: string };
    expect(provider.wellKnown).toBe('http://localhost:9090/.well-known/openid-configuration');
  });

  it('sets default scope to openid when OAUTH2_SCOPES is not set', () => {
    const provider = createAuthProviderFromEnv(VALID_OAUTH2_ENV) as {
      authorization: { params: { scope: string } };
    };
    expect(provider.authorization.params.scope).toBe('openid');
  });

  it('uses OAUTH2_SCOPES when provided', () => {
    const env = { ...VALID_OAUTH2_ENV, OAUTH2_SCOPES: 'openid profile email' };
    const provider = createAuthProviderFromEnv(env) as {
      authorization: { params: { scope: string } };
    };
    expect(provider.authorization.params.scope).toBe('openid profile email');
  });

  it('returns null for none provider', () => {
    expect(createAuthProviderFromEnv({ AUTH_PROVIDER: 'none' })).toBeNull();
  });
});

describe('isAuthEnabled / isAuthDisabled', () => {
  it('isAuthEnabled returns true for oauth2', () => {
    expect(isAuthEnabled({ AUTH_PROVIDER: 'oauth2' })).toBe(true);
  });

  it('isAuthEnabled returns false for none', () => {
    expect(isAuthEnabled({ AUTH_PROVIDER: 'none' })).toBe(false);
  });

  it('isAuthDisabled is the inverse of isAuthEnabled', () => {
    expect(isAuthDisabled({ AUTH_PROVIDER: 'none' })).toBe(true);
    expect(isAuthDisabled({ AUTH_PROVIDER: 'oauth2' })).toBe(false);
  });
});

describe('exported constants', () => {
  it('OAUTH2_PROVIDER_ID is "oauth2"', () => {
    expect(OAUTH2_PROVIDER_ID).toBe('oauth2');
  });

  it('NONE_PROVIDER_ID is "none"', () => {
    expect(NONE_PROVIDER_ID).toBe('none');
  });

  it('AUTH_PROVIDER_IDS contains OAUTH2 and NONE only', () => {
    expect(Object.values(AUTH_PROVIDER_IDS)).toEqual(['oauth2', 'none']);
  });
});
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
cd packages/framework/next-auth && pnpm test
```

Expected: all tests FAIL with import errors (`OAUTH2_PROVIDER_ID` not found, etc.) — the new symbols don't exist yet.

- [ ] **Step 3: Commit the failing tests**

```bash
git add packages/framework/next-auth/src/__tests__/providers.test.ts
git commit -m "test(next-auth): add failing tests for oauth2 provider registry"
```

---

## Task 3: Rewrite `providers.ts`

**Files:**
- Rewrite: `packages/framework/next-auth/src/providers.ts`

- [ ] **Step 1: Replace the entire file**

Overwrite `packages/framework/next-auth/src/providers.ts` with:

```typescript
import type { OAuthConfig } from 'next-auth/providers/oauth';

export const OAUTH2_PROVIDER_ID = 'oauth2' as const;
export const NONE_PROVIDER_ID = 'none' as const;

export const AUTH_PROVIDER_IDS = {
  OAUTH2: OAUTH2_PROVIDER_ID,
  NONE: NONE_PROVIDER_ID,
} as const;

export type AuthProviderId = (typeof AUTH_PROVIDER_IDS)[keyof typeof AUTH_PROVIDER_IDS];

type AuthEnvironment = Record<string, string | undefined>;

interface OAuth2Profile extends Record<string, unknown> {
  sub: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  picture?: string;
}

type AuthProviderDefinition = {
  requiredEnvKeys: readonly string[];
  getDiscoveryUrl: (env: AuthEnvironment) => string;
  createProvider: (env: AuthEnvironment) => OAuthConfig<OAuth2Profile> | null;
};

const DEFAULT_AUTH_PROVIDER_ID = OAUTH2_PROVIDER_ID;
const DEFAULT_OAUTH2_SCOPES = 'openid';

function getRequiredEnvValue(env: AuthEnvironment, key: string) {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required authentication environment variable: ${key}`);
  }

  return value;
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

const AUTH_PROVIDER_REGISTRY: Record<AuthProviderId, AuthProviderDefinition> = {
  [OAUTH2_PROVIDER_ID]: {
    requiredEnvKeys: ['OAUTH2_CLIENT_ID', 'OAUTH2_CLIENT_SECRET', 'OAUTH2_ISSUER'],
    getDiscoveryUrl: (env) =>
      `${stripTrailingSlash(getRequiredEnvValue(env, 'OAUTH2_ISSUER'))}/.well-known/openid-configuration`,
    createProvider: (env) => ({
      id: OAUTH2_PROVIDER_ID,
      name: 'OAuth2',
      type: 'oauth',
      clientId: getRequiredEnvValue(env, 'OAUTH2_CLIENT_ID'),
      clientSecret: getRequiredEnvValue(env, 'OAUTH2_CLIENT_SECRET'),
      wellKnown: `${stripTrailingSlash(getRequiredEnvValue(env, 'OAUTH2_ISSUER'))}/.well-known/openid-configuration`,
      authorization: {
        params: {
          scope: env.OAUTH2_SCOPES?.trim() || DEFAULT_OAUTH2_SCOPES,
        },
      },
      profile(profile: OAuth2Profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username ?? null,
          email: profile.email ?? null,
          image: typeof profile.picture === 'string' ? profile.picture : null,
        };
      },
    }),
  },
  [NONE_PROVIDER_ID]: {
    requiredEnvKeys: [],
    getDiscoveryUrl: () => '',
    createProvider: () => null,
  },
};

export function getAuthProviderIdFromEnv(
  env: AuthEnvironment,
  fallbackProviderId: AuthProviderId = DEFAULT_AUTH_PROVIDER_ID,
): AuthProviderId {
  const normalizedProviderId = env.AUTH_PROVIDER?.trim().toLowerCase() ?? fallbackProviderId;
  const providerDefinition = AUTH_PROVIDER_REGISTRY[normalizedProviderId as AuthProviderId];

  if (!providerDefinition) {
    throw new Error(
      `Unsupported AUTH_PROVIDER "${normalizedProviderId}". Expected one of: ${Object.keys(AUTH_PROVIDER_REGISTRY).join(', ')}`,
    );
  }

  return normalizedProviderId as AuthProviderId;
}

export function getAuthProviderDefinition(env: AuthEnvironment, providerId?: AuthProviderId) {
  const resolvedProviderId = providerId ?? getAuthProviderIdFromEnv(env);

  return {
    id: resolvedProviderId,
    ...AUTH_PROVIDER_REGISTRY[resolvedProviderId],
  };
}

export function getMissingAuthProviderEnvVars(env: AuthEnvironment, providerId?: AuthProviderId) {
  const definition = getAuthProviderDefinition(env, providerId);

  return definition.requiredEnvKeys.filter((key) => !env[key]?.trim());
}

export function assertAuthProviderEnv(env: AuthEnvironment, providerId?: AuthProviderId) {
  const resolvedProviderId = providerId ?? getAuthProviderIdFromEnv(env);
  const missingEnvVars = getMissingAuthProviderEnvVars(env, resolvedProviderId);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required authentication environment variables for "${resolvedProviderId}": ${missingEnvVars.join(', ')}`,
    );
  }
}

export function createAuthProviderFromEnv(env: AuthEnvironment, providerId?: AuthProviderId) {
  const definition = getAuthProviderDefinition(env, providerId);

  assertAuthProviderEnv(env, definition.id);

  return definition.createProvider(env);
}

export function getAuthProviderDiscoveryUrl(env: AuthEnvironment, providerId?: AuthProviderId) {
  const definition = getAuthProviderDefinition(env, providerId);

  assertAuthProviderEnv(env, definition.id);

  return definition.getDiscoveryUrl(env);
}

export function isAuthEnabled(env: AuthEnvironment): boolean {
  try {
    const providerId = getAuthProviderIdFromEnv(env);
    return providerId !== NONE_PROVIDER_ID;
  } catch {
    return true;
  }
}

export function isAuthDisabled(env: AuthEnvironment): boolean {
  return !isAuthEnabled(env);
}
```

- [ ] **Step 2: Run tests — all must pass**

```bash
cd packages/framework/next-auth && pnpm test
```

Expected: all tests PASS. If any fail, fix the implementation before continuing.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-auth/src/providers.ts
git commit -m "feat(next-auth)!: replace Keycloak/Autentika with generic oauth2 OIDC provider"
```

---

## Task 4: Simplify `oidc.ts`

**Files:**
- Modify: `packages/framework/next-auth/src/oidc.ts`

- [ ] **Step 1: Replace the file**

The change removes the `getClientCredentials` branching map (Keycloak/Autentika keys) and reads `OAUTH2_CLIENT_ID`/`OAUTH2_CLIENT_SECRET` directly. Everything else — fetch logic, cache, token shape — is unchanged.

Overwrite `packages/framework/next-auth/src/oidc.ts` with:

```typescript
import type { JWT } from './jwt';
import {
  assertAuthProviderEnv,
  getAuthProviderDiscoveryUrl,
  getAuthProviderIdFromEnv,
  type AuthProviderId,
} from './providers';

type AuthEnvironment = Record<string, string | undefined>;

type OpenIdConfiguration = {
  token_endpoint: string;
  revocation_endpoint?: string;
};

const openIdConfigurationCache = new Map<string, Promise<OpenIdConfiguration>>();

function getOpenIdConfiguration(discoveryUrl: string) {
  const cachedConfiguration = openIdConfigurationCache.get(discoveryUrl);

  if (cachedConfiguration) {
    return cachedConfiguration;
  }

  const configurationPromise = fetch(discoveryUrl, {
    headers: {
      Accept: 'application/json',
    },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenID configuration from ${discoveryUrl}`);
    }

    return (await response.json()) as OpenIdConfiguration;
  });

  openIdConfigurationCache.set(discoveryUrl, configurationPromise);

  return configurationPromise;
}

function getProviderIdFromTokenOrEnv(token: JWT, env: AuthEnvironment): AuthProviderId {
  return (token.authProviderId as AuthProviderId | undefined) ?? getAuthProviderIdFromEnv(env);
}

function getClientCredentials(env: AuthEnvironment) {
  return {
    clientId: env.OAUTH2_CLIENT_ID!,
    clientSecret: env.OAUTH2_CLIENT_SECRET!,
  };
}

export async function refreshOidcAccessToken(token: JWT, env: AuthEnvironment) {
  const providerId = getProviderIdFromTokenOrEnv(token, env);

  assertAuthProviderEnv(env, providerId);

  if (!token.refreshToken) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
      forceLogout: true,
    };
  }

  const discoveryUrl = getAuthProviderDiscoveryUrl(env, providerId);
  const openIdConfiguration = await getOpenIdConfiguration(discoveryUrl);
  const { clientId, clientSecret } = getClientCredentials(env);

  const response = await fetch(openIdConfiguration.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    }),
  });

  if (!response.ok) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
      forceLogout: true,
    };
  }

  const refreshedToken = await response.json();

  return {
    ...token,
    accessToken: refreshedToken.access_token,
    idToken: refreshedToken.id_token ?? token.idToken,
    expiresAt: Math.floor(Date.now() / 1000 + (refreshedToken.expires_in ?? 0)),
    refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
    authProviderId: providerId,
    error: undefined,
    forceLogout: false,
  };
}

export async function revokeOidcSession(token: JWT, env: AuthEnvironment) {
  const providerId = getProviderIdFromTokenOrEnv(token, env);

  assertAuthProviderEnv(env, providerId);

  if (!token.refreshToken) {
    return;
  }

  const discoveryUrl = getAuthProviderDiscoveryUrl(env, providerId);
  const openIdConfiguration = await getOpenIdConfiguration(discoveryUrl);
  const revocationEndpoint = openIdConfiguration.revocation_endpoint;

  if (!revocationEndpoint) {
    return;
  }

  const { clientId, clientSecret } = getClientCredentials(env);

  await fetch(revocationEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token: token.refreshToken,
      token_type_hint: 'refresh_token',
    }),
  });
}
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
cd packages/framework/next-auth && pnpm test
```

Expected: all tests PASS (oidc.ts is not directly tested but TypeScript must be satisfied — build in next task will catch type errors).

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-auth/src/oidc.ts
git commit -m "refactor(next-auth): simplify oidc.ts to read OAUTH2_* env vars directly"
```

---

## Task 5: Update `config.ts` and `client.ts`

**Files:**
- Modify: `packages/framework/next-auth/src/config.ts`
- Modify: `packages/framework/next-auth/src/client.ts`

- [ ] **Step 1: Update `config.ts` — remove Keycloak type reference**

On line 48 of `src/config.ts`, replace the `AnyProvider` type that references the Keycloak import:

```typescript
// BEFORE (line 48):
type AnyProvider = OAuthConfig<Record<string, unknown>> | ReturnType<typeof import('next-auth/providers/keycloak').default>;

// AFTER:
type AnyProvider = OAuthConfig<Record<string, unknown>>;
```

- [ ] **Step 2: Update `config.ts` JSDoc**

On line 99 of `src/config.ts`, update the provider option JSDoc:

```typescript
// BEFORE:
* - Omit or pass "keycloak" / "autentika" / "none" to use IGRP pre-defined providers (reads env vars automatically).

// AFTER:
* - Omit or pass "oauth2" / "none" to use IGRP pre-defined providers (reads env vars automatically).
```

- [ ] **Step 3: Update `client.ts` — swap exported constants**

Overwrite `packages/framework/next-auth/src/client.ts` with:

```typescript
import { useSession as useSessionBase } from 'next-auth/react';
import type { Session } from './session';

export {
  AUTH_PROVIDER_IDS,
  OAUTH2_PROVIDER_ID,
  NONE_PROVIDER_ID,
} from './providers';
export type { AuthProviderId } from './providers';

export {
  SessionProvider,
  type SessionProviderProps,
  useSession,
  signIn,
  signOut,
  getCsrfToken,
  getProviders,
  getSession,
} from 'next-auth/react';

export type { User } from 'next-auth';

export function useSafeSession() {
  const { data, status, update } = useSessionBase();
  const session: Session | null = data as Session | null;
  return { session, status, update };
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/framework/next-auth/src/config.ts packages/framework/next-auth/src/client.ts
git commit -m "refactor(next-auth): remove Keycloak type ref from config, update client exports"
```

---

## Task 6: Build `next-auth` and verify

**Files:** none (verification only)

- [ ] **Step 1: Run the full build**

```bash
pnpm build:auth
```

Expected: clean build with no TypeScript errors and no missing module errors. Output in `packages/framework/next-auth/dist/`.

- [ ] **Step 2: Verify key dist files exist**

```bash
ls packages/framework/next-auth/dist/
```

Expected output includes: `providers.js`, `providers.d.ts`, `oidc.js`, `oidc.d.ts`, `config.js`, `config.d.ts`, `client.js`, `client.d.ts`, `types.js`, `types.d.ts`.

- [ ] **Step 3: Spot-check that removed constants are gone**

```bash
grep -r "KEYCLOAK_PROVIDER_ID\|AUTENTIKA_PROVIDER_ID\|keycloak\|autentika" packages/framework/next-auth/dist/
```

Expected: no matches (or only in CHANGELOG.md if it exists in dist — it shouldn't).

- [ ] **Step 4: Run tests one final time from the package**

```bash
cd packages/framework/next-auth && pnpm test
```

Expected: all tests PASS.

---

## Task 7: Update `demo-legacy` template

**Files:**
- Modify: `templates/demo-legacy/.env.example`
- Modify: `templates/demo-legacy/src/lib/auth.ts`

- [ ] **Step 1: Rewrite the auth section of `.env.example`**

In `templates/demo-legacy/.env.example`, replace lines 1–36 (the entire Authentication Configuration section) with:

```bash
# ============================================
# Authentication Configuration
# ============================================
# Active provider
# Supported values: oauth2 | none
AUTH_PROVIDER=oauth2

# OAuth2 Client ID - The client identifier registered on your authorization server
# Example: igrp-example
OAUTH2_CLIENT_ID=

# OAuth2 Client Secret - The secret key for your OAuth2 client
OAUTH2_CLIENT_SECRET=

# OAuth2 Issuer - Base URL of your authorization server (without trailing slash)
# The framework appends /.well-known/openid-configuration for OIDC discovery
# Example: http://auth.example.com  (discovery at http://auth.example.com/.well-known/openid-configuration)
OAUTH2_ISSUER=

# OAuth2 Scopes - Space-separated list of OAuth2 scopes to request
# Defaults to "openid" if not set
# Example: openid profile email
OAUTH2_SCOPES=openid

# Redirect URI to register on your OAuth2 server:
# http://localhost:3000/api/auth/callback/oauth2
```

- [ ] **Step 2: Update the JSDoc in `src/lib/auth.ts`**

In `templates/demo-legacy/src/lib/auth.ts`, update line 15 (the provider comment inside the JSDoc):

```typescript
// BEFORE:
 * - Provider is resolved automatically from AUTH_PROVIDER env var (keycloak / autentika / none).

// AFTER:
 * - Provider is resolved automatically from AUTH_PROVIDER env var (oauth2 / none).
```

- [ ] **Step 3: Commit**

```bash
git add templates/demo-legacy/.env.example templates/demo-legacy/src/lib/auth.ts
git commit -m "chore(demo-legacy): update env vars for oauth2 provider (remove KEYCLOAK_*/AUTENTIKA_*)"
```

---

## Task 8: Create changeset

**Files:**
- Create: `.changeset/oauth2-generic-provider.md`

- [ ] **Step 1: Create the changeset file**

Create `.changeset/oauth2-generic-provider.md`:

```markdown
---
"@igrp/framework-next-auth": major
"@igrp/framework-next-types": patch
---

Replace Keycloak and Autentika providers with a single generic `oauth2` OIDC provider.

**Breaking changes:**
- `AUTH_PROVIDER` now accepts `oauth2` or `none` only (`keycloak` and `autentika` are removed)
- `AUTH_PROVIDER` defaults to `oauth2` (previously defaulted to `keycloak`)
- `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER` env vars removed
- `AUTENTIKA_CLIENT_ID`, `AUTENTIKA_CLIENT_SECRET`, `AUTENTIKA_HOST`, `AUTENTIKA_TENANT_NAME`, `AUTENTIKA_SCOPES` env vars removed
- `KEYCLOAK_PROVIDER_ID` and `AUTENTIKA_PROVIDER_ID` named exports removed from all entry points

**Migration:** Replace with `OAUTH2_CLIENT_ID`, `OAUTH2_CLIENT_SECRET`, `OAUTH2_ISSUER`, `OAUTH2_SCOPES` (optional, defaults to `openid`). The redirect URI to register on your server is `{NEXTAUTH_URL}/api/auth/callback/oauth2`.
```

- [ ] **Step 2: Commit**

```bash
git add .changeset/oauth2-generic-provider.md
git commit -m "chore: add changeset for oauth2 generic provider (major next-auth, patch next-types)"
```

---

## Task 9: Full framework build and final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full framework build**

```bash
pnpm build:framework
```

Expected: all packages build in order (`next-auth` → `next-types` → `design-system` → `next-ui` → `next`) with no errors.

- [ ] **Step 2: Verify `next-types` dist picks up the updated `AuthProviderId`**

```bash
grep -r "AuthProviderId" packages/framework/next-types/dist/ | head -5
```

Expected: `AuthProviderId` references `'oauth2' | 'none'` (not Keycloak/Autentika).

- [ ] **Step 3: Verify `demo-legacy` still type-checks**

```bash
cd templates/demo-legacy && npx tsc --noEmit
```

Expected: no TypeScript errors. If errors appear referencing `KEYCLOAK_PROVIDER_ID` or `AuthProviderId`, check imports in `src/app/(auth)/login/page.tsx` and update accordingly.

- [ ] **Step 4: Final commit (if any fixes were needed in step 3)**

If TypeScript errors were found and fixed in demo-legacy:
```bash
git add templates/demo-legacy/src/
git commit -m "fix(demo-legacy): resolve type errors after oauth2 provider migration"
```
