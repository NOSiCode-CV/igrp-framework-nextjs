# next-auth fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four issues in `@igrp/framework-next-auth`: opt-in auth default, `expiresAt` unit bug causing infinite refresh loops, broken logout (no revocation logging + no IdP session termination), and missing token introspection gate before refresh.

**Architecture:** Surgical changes to three files only — `src/providers.ts` (default), `src/oidc.ts` (unit fix + two new exported functions), `src/config.ts` (buffer + introspect gate + revocation logging). A new test file `src/__tests__/oidc.test.ts` covers the new OIDC functions. The `oidc.test.ts` tests use `vi.resetModules()` + dynamic imports on every test to avoid interference from the internal `openIdConfigurationCache` (a module-level `Map` keyed by discovery URL).

**Tech Stack:** TypeScript, NextAuth.js v4, Vitest, `fetch` (global), `btoa` (global, Node 22+).

---

## File Map

| File | Change |
|---|---|
| `src/providers.ts` | Line 29: change default from `IGRP_AUTH_PROVIDER_ID` to `NONE_PROVIDER_ID` |
| `src/oidc.ts` | Fix `expiresAt` in `refreshOidcAccessToken`; extend `OpenIdConfiguration` type; add `buildEndSessionUrl`; add `introspectOidcToken` |
| `src/config.ts` | Add buffer to jwt callback validity check; fix `getSession` unit comparison; add revocation error log; import and wire `introspectOidcToken` in expired-token branch |
| `src/__tests__/providers.test.ts` | Update two tests that assert the old `'igrp-auth'` default |
| `src/__tests__/oidc.test.ts` | **New file** — tests for all three `oidc.ts` functions using dynamic imports |
| `src/__tests__/config.test.ts` | Extend top-level `vi.mock` to include `introspectOidcToken`; add jwt callback gate test |

All commands run from repo root. Test command: `pnpm --filter @igrp/framework-next-auth test`. Build command: `pnpm build:auth`.

---

## Task 1 — Change AUTH_PROVIDER default to `'none'`

**Files:**
- Modify: `src/__tests__/providers.test.ts:27-29` and add inside `isAuthEnabled` describe
- Modify: `src/providers.ts:29`

- [ ] **Step 1: Update the failing tests first**

In `src/__tests__/providers.test.ts`:

Change line 27 (description) and line 29 (expected value):
```typescript
// Before:
it('defaults to igrp-auth when AUTH_PROVIDER is not set', () => {
  expect(getAuthProviderIdFromEnv({})).toBe('igrp-auth');
});

// After:
it('defaults to none when AUTH_PROVIDER is not set', () => {
  expect(getAuthProviderIdFromEnv({})).toBe('none');
});
```

Add a new test inside the `isAuthEnabled / isAuthDisabled` describe block (after line 167):
```typescript
it('isAuthEnabled returns false when AUTH_PROVIDER is not set', () => {
  expect(isAuthEnabled({})).toBe(false);
});
```

- [ ] **Step 2: Run tests — verify they fail**

```
pnpm --filter @igrp/framework-next-auth test
```

Expected: 2 failures.

- [ ] **Step 3: Change the default in `src/providers.ts`**

Line 29 — change:
```typescript
// Before:
const DEFAULT_AUTH_PROVIDER_ID = IGRP_AUTH_PROVIDER_ID;

// After:
const DEFAULT_AUTH_PROVIDER_ID = NONE_PROVIDER_ID;
```

- [ ] **Step 4: Run tests — verify all pass**

```
pnpm --filter @igrp/framework-next-auth test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```
git add packages/framework/next-auth/src/providers.ts packages/framework/next-auth/src/__tests__/providers.test.ts
git commit -m "fix(next-auth): change AUTH_PROVIDER default to none (opt-in auth)"
```

---

## Task 2 — Fix `expiresAt` unit mismatch + refresh buffer

**Files:**
- Create: `src/__tests__/oidc.test.ts`
- Modify: `src/oidc.ts:97`
- Modify: `src/config.ts:436` (jwt validity check), `src/config.ts:73` (remove unused constant), `src/config.ts:591-593` (`getSession` comparison)

The bug: `refreshOidcAccessToken` stores `expiresAt` in **seconds**, but every other check uses `Date.now()` in **milliseconds**. After the first refresh the token appears permanently expired → infinite refresh loop → `forceLogout`.

- [ ] **Step 1: Create `src/__tests__/oidc.test.ts` with the failing test**

> **Important pattern:** All tests in this file use `vi.resetModules()` in `afterEach` and dynamic imports inside each `it` block. This is required because `oidc.ts` holds an internal `openIdConfigurationCache` (module-level `Map`) — without re-importing, every test past the first one gets stale cached discovery data.

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { JWT } from '../jwt';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const VALID_ENV = {
  AUTH_PROVIDER: 'igrp-auth',
  IGRP_AUTH_CLIENT_ID: 'test-client',
  IGRP_AUTH_CLIENT_SECRET: 'test-secret',
  IGRP_AUTH_ISSUER: 'http://localhost:9090',
};

const DISCOVERY_URL = 'http://localhost:9090/.well-known/openid-configuration';

const MOCK_DISCOVERY = {
  token_endpoint: 'http://localhost:9090/oauth2/token',
  revocation_endpoint: 'http://localhost:9090/oauth2/revoke',
  end_session_endpoint: 'http://localhost:9090/connect/logout',
  introspection_endpoint: 'http://localhost:9090/oauth2/introspect',
};

function makeToken(overrides: Partial<JWT> = {}): JWT {
  return {
    refreshToken: 'rt-abc',
    accessToken: 'at-abc',
    idToken: 'id-token-abc',
    authProviderId: 'igrp-auth',
    expiresAt: Date.now() - 1000,
    ...overrides,
  };
}

type FetchMockEntry = { url: string | RegExp; body: unknown; ok?: boolean };

function mockFetch(responses: FetchMockEntry[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const match = responses.find((r) =>
        typeof r.url === 'string' ? url === r.url : r.url.test(url),
      );
      return Promise.resolve({
        ok: match?.ok ?? true,
        json: () => Promise.resolve(match?.body ?? {}),
      });
    }),
  );
}

// ─── Cache reset between tests ────────────────────────────────────────────────

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules(); // gives each test a fresh openIdConfigurationCache
});

// ─── refreshOidcAccessToken ───────────────────────────────────────────────────

describe('refreshOidcAccessToken — expiresAt units', () => {
  it('stores expiresAt in milliseconds after a successful refresh', async () => {
    const expiresIn = 3600;
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      {
        url: MOCK_DISCOVERY.token_endpoint,
        body: { access_token: 'new-at', refresh_token: 'new-rt', expires_in: expiresIn },
      },
    ]);

    const { refreshOidcAccessToken } = await import('../oidc');
    const before = Date.now();
    const result = await refreshOidcAccessToken(makeToken(), VALID_ENV);
    const after = Date.now();

    // expiresAt must be ms-scale (> 1 trillion), not seconds-scale (< 2 billion)
    expect(result.expiresAt!).toBeGreaterThan(1_700_000_000_000);
    expect(result.expiresAt!).toBeGreaterThanOrEqual(before + expiresIn * 1000 - 100);
    expect(result.expiresAt!).toBeLessThanOrEqual(after + expiresIn * 1000 + 100);
  });

  it('returns forceLogout when refresh token is missing', async () => {
    const { refreshOidcAccessToken } = await import('../oidc');
    const result = await refreshOidcAccessToken(makeToken({ refreshToken: undefined }), VALID_ENV);
    expect(result.forceLogout).toBe(true);
    expect(result.error).toBe('RefreshAccessTokenError');
  });

  it('returns forceLogout when token endpoint responds with non-ok status', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.token_endpoint, body: { error: 'invalid_grant' }, ok: false },
    ]);
    const { refreshOidcAccessToken } = await import('../oidc');
    const result = await refreshOidcAccessToken(makeToken(), VALID_ENV);
    expect(result.forceLogout).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — verify the expiresAt test fails**

```
pnpm --filter @igrp/framework-next-auth test
```

Expected: `stores expiresAt in milliseconds after a successful refresh` — FAIL.

- [ ] **Step 3: Fix `expiresAt` in `src/oidc.ts`**

Line 97 — change:
```typescript
// Before:
expiresAt: Math.floor(Date.now() / 1000 + (refreshedToken.expires_in ?? 0)),

// After:
expiresAt: Date.now() + (refreshedToken.expires_in ?? 3600) * 1000,
```

- [ ] **Step 4: Add buffer to jwt callback validity check in `src/config.ts`**

Line 436 — change:
```typescript
// Before:
if (igrpToken.expiresAt && Date.now() < igrpToken.expiresAt) {

// After (TOKEN_REFRESH_BUFFER_MS is already declared at line 72):
if (igrpToken.expiresAt && Date.now() < igrpToken.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
```

- [ ] **Step 5: Fix `getSession` unit comparison in `src/config.ts`**

The `getSession` function (around line 591) compares `session.expiresAt` (now always ms) against a seconds-scale `now`. Change:

```typescript
// Before:
const now = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_BUFFER_SEC;
const providerExp = typeof session.expiresAt === 'number' ? session.expiresAt : undefined;
const providerExpired = providerExp !== undefined && providerExp < now;

// After:
const providerExp = typeof session.expiresAt === 'number' ? session.expiresAt : undefined;
const providerExpired = providerExp !== undefined && providerExp < Date.now() + TOKEN_REFRESH_BUFFER_MS;
```

Then remove the now-unused constant at line 73:
```typescript
// Delete this line entirely:
const TOKEN_EXPIRY_BUFFER_SEC = 60;
```

- [ ] **Step 6: Run tests — verify all pass**

```
pnpm --filter @igrp/framework-next-auth test
```

Expected: all pass.

- [ ] **Step 7: Commit**

```
git add packages/framework/next-auth/src/oidc.ts packages/framework/next-auth/src/config.ts packages/framework/next-auth/src/__tests__/oidc.test.ts
git commit -m "fix(next-auth): normalize expiresAt to milliseconds; add proactive refresh buffer"
```

---

## Task 3 — Extend `OpenIdConfiguration` type + `buildEndSessionUrl` + revocation logging

**Files:**
- Modify: `src/oidc.ts:11-14` (extend type), `src/oidc.ts` (new `buildEndSessionUrl` function)
- Modify: `src/config.ts:508-510` (revocation catch logging)
- Modify: `src/__tests__/oidc.test.ts` (add `buildEndSessionUrl` tests)

- [ ] **Step 1: Write tests for `buildEndSessionUrl`**

Add to `src/__tests__/oidc.test.ts`, after the `refreshOidcAccessToken` describe block:

```typescript
describe('buildEndSessionUrl', () => {
  it('builds URL with id_token_hint, post_logout_redirect_uri, and client_id', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(makeToken(), VALID_ENV, 'http://app/login');

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.origin + parsed.pathname).toBe('http://localhost:9090/connect/logout');
    expect(parsed.searchParams.get('id_token_hint')).toBe('id-token-abc');
    expect(parsed.searchParams.get('post_logout_redirect_uri')).toBe('http://app/login');
    expect(parsed.searchParams.get('client_id')).toBe('test-client');
  });

  it('returns null when end_session_endpoint is absent from discovery', async () => {
    const { end_session_endpoint: _, ...discoveryWithout } = MOCK_DISCOVERY;
    mockFetch([{ url: DISCOVERY_URL, body: discoveryWithout }]);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(makeToken(), VALID_ENV, 'http://app/login');
    expect(url).toBeNull();
  });

  it('returns null when token has no idToken', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(makeToken({ idToken: undefined }), VALID_ENV, 'http://app/login');
    expect(url).toBeNull();
  });

  it('returns null for none provider without making any fetch calls', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(
      { authProviderId: 'none' },
      { AUTH_PROVIDER: 'none' },
      'http://app/login',
    );

    expect(url).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests — verify `buildEndSessionUrl` tests fail**

```
pnpm --filter @igrp/framework-next-auth test
```

Expected: 4 failures — `buildEndSessionUrl` is not yet exported.

- [ ] **Step 3: Extend `OpenIdConfiguration` type in `src/oidc.ts`**

Lines 11-14 — change:
```typescript
// Before:
type OpenIdConfiguration = {
  token_endpoint: string;
  revocation_endpoint?: string;
};

// After:
type OpenIdConfiguration = {
  token_endpoint: string;
  revocation_endpoint?: string;
  end_session_endpoint?: string;
  introspection_endpoint?: string;
};
```

- [ ] **Step 4: Add `buildEndSessionUrl` to `src/oidc.ts`**

Add this function after the closing brace of `revokeOidcSession` (after line 136):

```typescript
export async function buildEndSessionUrl(
  token: JWT,
  env: AuthEnvironment,
  postLogoutRedirectUri: string,
): Promise<string | null> {
  const providerId = getProviderIdFromTokenOrEnv(token, env);
  if (providerId === 'none') return null;
  if (!token.idToken) return null;

  const discoveryUrl = getAuthProviderDiscoveryUrl(env, providerId);
  const openIdConfiguration = await getOpenIdConfiguration(discoveryUrl);
  if (!openIdConfiguration.end_session_endpoint) return null;

  const { clientId } = getClientCredentials(env);
  const url = new URL(openIdConfiguration.end_session_endpoint);
  url.searchParams.set('id_token_hint', token.idToken);
  url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  url.searchParams.set('client_id', clientId);

  return url.toString();
}
```

- [ ] **Step 5: Add error logging to revocation in `src/config.ts`**

Lines 508-510 — change:
```typescript
// Before:
void revokeOidcSession(token, env).catch(() => {
  // Intentionally swallowed — logout must always succeed.
});

// After:
void revokeOidcSession(token, env).catch((err) => {
  console.error('[next-auth] token revocation failed:', err);
});
```

- [ ] **Step 6: Run tests — verify all pass**

```
pnpm --filter @igrp/framework-next-auth test
```

Expected: all pass.

- [ ] **Step 7: Commit**

```
git add packages/framework/next-auth/src/oidc.ts packages/framework/next-auth/src/config.ts packages/framework/next-auth/src/__tests__/oidc.test.ts
git commit -m "feat(next-auth): add buildEndSessionUrl for RP-initiated logout; add revocation error logging"
```

---

## Task 4 — Add `introspectOidcToken`

**Files:**
- Modify: `src/oidc.ts` (add `introspectOidcToken`)
- Modify: `src/__tests__/oidc.test.ts` (add introspection tests)

- [ ] **Step 1: Write tests for `introspectOidcToken`**

Add to `src/__tests__/oidc.test.ts`, after the `buildEndSessionUrl` describe block:

```typescript
describe('introspectOidcToken', () => {
  it('returns true when IdP responds with active: true', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.introspection_endpoint, body: { active: true } },
    ]);
    const { introspectOidcToken } = await import('../oidc');
    expect(await introspectOidcToken(makeToken(), VALID_ENV)).toBe(true);
  });

  it('returns false when IdP responds with active: false', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.introspection_endpoint, body: { active: false } },
    ]);
    const { introspectOidcToken } = await import('../oidc');
    expect(await introspectOidcToken(makeToken(), VALID_ENV)).toBe(false);
  });

  it('returns true (fail-open) when introspection_endpoint is absent from discovery', async () => {
    const { introspection_endpoint: _, ...discoveryWithout } = MOCK_DISCOVERY;
    mockFetch([{ url: DISCOVERY_URL, body: discoveryWithout }]);
    const { introspectOidcToken } = await import('../oidc');
    expect(await introspectOidcToken(makeToken(), VALID_ENV)).toBe(true);
  });

  it('returns true (fail-open) when introspection endpoint returns non-ok status', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.introspection_endpoint, body: { error: 'server_error' }, ok: false },
    ]);
    const { introspectOidcToken } = await import('../oidc');
    expect(await introspectOidcToken(makeToken(), VALID_ENV)).toBe(true);
  });

  it('returns true (fail-open) when accessToken is missing', async () => {
    const { introspectOidcToken } = await import('../oidc');
    expect(await introspectOidcToken(makeToken({ accessToken: undefined }), VALID_ENV)).toBe(true);
  });

  it('returns true (fail-open) for none provider without making fetch calls', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { introspectOidcToken } = await import('../oidc');

    expect(await introspectOidcToken({ authProviderId: 'none' }, { AUTH_PROVIDER: 'none' })).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends Basic auth header with base64-encoded clientId:clientSecret', async () => {
    const capturedInit: RequestInit[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (url === MOCK_DISCOVERY.introspection_endpoint) capturedInit.push(init ?? {});
        const bodies: Record<string, unknown> = {
          [DISCOVERY_URL]: MOCK_DISCOVERY,
          [MOCK_DISCOVERY.introspection_endpoint]: { active: true },
        };
        return Promise.resolve({ ok: true, json: () => Promise.resolve(bodies[url] ?? {}) });
      }),
    );
    const { introspectOidcToken } = await import('../oidc');
    await introspectOidcToken(makeToken(), VALID_ENV);

    const headers = capturedInit[0]?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Basic ${btoa('test-client:test-secret')}`);
  });
});
```

- [ ] **Step 2: Run tests — verify introspection tests fail**

```
pnpm --filter @igrp/framework-next-auth test
```

Expected: 7 failures — `introspectOidcToken` is not yet exported.

- [ ] **Step 3: Add `introspectOidcToken` to `src/oidc.ts`**

Add after the `buildEndSessionUrl` function:

```typescript
export async function introspectOidcToken(token: JWT, env: AuthEnvironment): Promise<boolean> {
  if (!token.accessToken) return true;

  const providerId = getProviderIdFromTokenOrEnv(token, env);
  if (providerId === 'none') return true;

  try {
    const discoveryUrl = getAuthProviderDiscoveryUrl(env, providerId);
    const openIdConfiguration = await getOpenIdConfiguration(discoveryUrl);
    if (!openIdConfiguration.introspection_endpoint) return true;

    const { clientId, clientSecret } = getClientCredentials(env);
    const credentials = btoa(`${clientId}:${clientSecret}`);

    const response = await fetch(openIdConfiguration.introspection_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        token: token.accessToken,
        token_type_hint: 'access_token',
      }),
    });

    if (!response.ok) return true;

    const result = (await response.json()) as { active?: boolean };
    return result.active !== false;
  } catch {
    return true;
  }
}
```

- [ ] **Step 4: Run tests — verify all pass**

```
pnpm --filter @igrp/framework-next-auth test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```
git add packages/framework/next-auth/src/oidc.ts packages/framework/next-auth/src/__tests__/oidc.test.ts
git commit -m "feat(next-auth): add introspectOidcToken (RFC 7662) with fail-open semantics"
```

---

## Task 5 — Wire introspect as refresh gate in jwt callback

**Files:**
- Modify: `src/config.ts:36` (import), `src/config.ts:443-453` (expired-token branch)
- Modify: `src/__tests__/config.test.ts:5-11` (extend top-level mock), end of file (new test)

- [ ] **Step 1: Extend the top-level `vi.mock` in `src/__tests__/config.test.ts`**

The top-level mock (lines 5-11) currently only mocks `revokeOidcSession`. Add `introspectOidcToken` (default: active) and `refreshOidcAccessToken` so the jwt callback tests can control them per-test:

```typescript
// Before:
vi.mock('../oidc', async (importOriginal) => {
  const original = await importOriginal<typeof oidcModule>();
  return {
    ...original,
    revokeOidcSession: vi.fn().mockResolvedValue(undefined),
  };
});

// After:
vi.mock('../oidc', async (importOriginal) => {
  const original = await importOriginal<typeof oidcModule>();
  return {
    ...original,
    revokeOidcSession: vi.fn().mockResolvedValue(undefined),
    introspectOidcToken: vi.fn().mockResolvedValue(true),
    refreshOidcAccessToken: vi.fn().mockResolvedValue({ accessToken: 'refreshed-at', forceLogout: false }),
  };
});
```

- [ ] **Step 2: Write the failing test**

Add to the end of `src/__tests__/config.test.ts`:

```typescript
describe('withIGRPAuth — jwt callback introspect gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: token is active, refresh succeeds
    vi.mocked(oidcModule.introspectOidcToken).mockResolvedValue(true);
    vi.mocked(oidcModule.refreshOidcAccessToken).mockResolvedValue({
      accessToken: 'new-at',
      forceLogout: false,
      error: undefined,
    } as any);
  });

  it('sets forceLogout without calling refresh when introspect returns false', async () => {
    vi.mocked(oidcModule.introspectOidcToken).mockResolvedValue(false);

    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const jwtCallback = instance.authOptions.callbacks?.jwt;

    const expiredToken = {
      accessToken: 'at-old',
      refreshToken: 'rt-old',
      authProviderId: 'igrp-auth' as const,
      expiresAt: Date.now() - 10_000, // expired, in ms
    };

    const result = await jwtCallback!({ token: expiredToken, account: null } as any);

    expect((result as any).forceLogout).toBe(true);
    expect((result as any).error).toBe('RefreshAccessTokenError');
    expect(oidcModule.refreshOidcAccessToken).not.toHaveBeenCalled();
  });

  it('calls refresh when introspect returns true and token is expired', async () => {
    vi.mocked(oidcModule.introspectOidcToken).mockResolvedValue(true);

    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });
    const jwtCallback = instance.authOptions.callbacks?.jwt;

    const expiredToken = {
      accessToken: 'at-old',
      refreshToken: 'rt-old',
      authProviderId: 'igrp-auth' as const,
      expiresAt: Date.now() - 10_000,
    };

    await jwtCallback!({ token: expiredToken, account: null } as any);

    expect(oidcModule.introspectOidcToken).toHaveBeenCalledWith(expiredToken, VALID_ENV);
    expect(oidcModule.refreshOidcAccessToken).toHaveBeenCalledWith(expiredToken, VALID_ENV);
  });
});
```

- [ ] **Step 3: Run tests — verify new tests fail**

```
pnpm --filter @igrp/framework-next-auth test
```

Expected: 2 failures — introspect is not yet called in the jwt callback.

- [ ] **Step 4: Add `introspectOidcToken` to the import in `src/config.ts`**

Line 36 — change:
```typescript
// Before:
import { refreshOidcAccessToken, revokeOidcSession } from './oidc';

// After:
import { introspectOidcToken, refreshOidcAccessToken, revokeOidcSession } from './oidc';
```

- [ ] **Step 5: Replace the expired-token branch in the jwt callback in `src/config.ts`**

Lines 443-453 — change:
```typescript
// Before:
// Token expired — attempt refresh
try {
  igrpToken = await refreshOidcAccessToken(igrpToken, env);
} catch {
  igrpToken = { ...igrpToken, error: 'RefreshAccessTokenError', forceLogout: true };
}

// After:
// Token expired — introspect first to catch server-side revocations (fail-open)
const tokenIsActive = await introspectOidcToken(igrpToken, env).catch(() => true);
if (!tokenIsActive) {
  igrpToken = { ...igrpToken, error: 'RefreshAccessTokenError', forceLogout: true };
} else {
  try {
    igrpToken = await refreshOidcAccessToken(igrpToken, env);
  } catch {
    igrpToken = { ...igrpToken, error: 'RefreshAccessTokenError', forceLogout: true };
  }
}
```

- [ ] **Step 6: Run tests — verify all pass**

```
pnpm --filter @igrp/framework-next-auth test
```

Expected: all pass.

- [ ] **Step 7: Commit**

```
git add packages/framework/next-auth/src/config.ts packages/framework/next-auth/src/__tests__/config.test.ts
git commit -m "feat(next-auth): gate token refresh on introspection result in jwt callback"
```

---

## Task 6 — Build and final verification

**Files:** None (build only)

- [ ] **Step 1: Run the full test suite**

```
pnpm --filter @igrp/framework-next-auth test
```

Expected: all pass, zero skipped.

- [ ] **Step 2: Build the package**

```
pnpm build:auth
```

Expected: exits 0, no TypeScript errors, `packages/framework/next-auth/dist/` is populated.

- [ ] **Step 3: Verify new exports are present in dist**

```
pnpm --filter @igrp/framework-next-auth exec -- node -e "const m = require('./dist/oidc.cjs'); console.log(Object.keys(m))"
```

Expected output includes: `refreshOidcAccessToken`, `revokeOidcSession`, `buildEndSessionUrl`, `introspectOidcToken`.

- [ ] **Step 4: Create changeset**

From repo root:
```
pnpm changeset
```

When prompted:
- Select **`@igrp/framework-next-auth`** (spacebar to toggle, Enter to confirm)
- Bump type: **patch**
- Summary: `Fix expiresAt unit bug causing infinite refresh loops; change AUTH_PROVIDER default to none; add buildEndSessionUrl for RP-initiated logout; add introspectOidcToken refresh gate`

- [ ] **Step 5: Commit changeset**

```
git add .changeset/
git commit -m "chore: add changeset for next-auth fixes"
```
