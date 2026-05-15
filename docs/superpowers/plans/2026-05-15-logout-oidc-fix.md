# Logout OIDC Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix SSO session persisting after logout by making `buildEndSessionUrl` work without `id_token_hint`, add `idToken` empty-string protection in `refreshOidcAccessToken`, and add diagnostic logging to `getLogoutUrl`.

**Architecture:** Three targeted edits: (1) `oidc.ts` — remove hard null return when `idToken` is absent; always build the Keycloak end-session URL, conditionally including `id_token_hint`; (2) `oidc.ts` — use `||` instead of `??` for `idToken` fallback in token refresh so empty string doesn't wipe the stored value; (3) `demo-legacy` server action — add `console.warn` before null returns so the cause is visible in server logs.

**Tech Stack:** TypeScript, Vitest, tsup, Next.js 15 App Router server actions, pnpm workspaces.

---

## File Map

| File | Change |
|------|--------|
| `packages/framework/next-auth/src/oidc.ts` | Remove `!idToken` null guard; conditional `id_token_hint`; fix `||` fallback |
| `packages/framework/next-auth/src/__tests__/oidc.test.ts` | Update outdated test; add three new tests |
| `templates/demo-legacy/src/actions/igrp/auth.ts` | Add `console.warn` diagnostic logs |
| `.changeset/<auto-named>.md` | `patch` changeset for `@igrp/framework-next-auth` |

---

## Task 1: Update the existing "no idToken → null" test to match the new expected behaviour

The test at line 123 of `oidc.test.ts` currently asserts that `buildEndSessionUrl` returns `null` when `idToken` is absent. After the fix the function will return a URL (without `id_token_hint`). Update the test so it **fails** now and will **pass** after the implementation.

**Files:**
- Modify: `packages/framework/next-auth/src/__tests__/oidc.test.ts:123-129`

- [ ] **Step 1: Replace the outdated assertion in the `buildEndSessionUrl` describe block**

Replace the block (currently lines 123-129):

```ts
  it('returns null when token has no idToken', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(makeToken({ idToken: undefined }), VALID_ENV, 'http://app/login');
    expect(url).toBeNull();
  });
```

With:

```ts
  it('builds URL without id_token_hint when idToken is absent', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(makeToken({ idToken: undefined }), VALID_ENV, 'http://app/login');

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.origin + parsed.pathname).toBe('http://localhost:9090/connect/logout');
    expect(parsed.searchParams.has('id_token_hint')).toBe(false);
    expect(parsed.searchParams.get('client_id')).toBe('test-client');
    expect(parsed.searchParams.get('post_logout_redirect_uri')).toBe('http://app/login');
  });
```

- [ ] **Step 2: Run the test suite — confirm the updated test fails**

```powershell
pnpm --filter @igrp/framework-next-auth test
```

Expected: one test fails — `"builds URL without id_token_hint when idToken is absent"` — because the implementation still has the `!token.idToken` guard. All other tests pass.

---

## Task 2: Add two more new tests for edge cases

Add an empty-string `idToken` test and a `refreshOidcAccessToken` idToken-preservation test. Both will fail until the implementation is fixed.

**Files:**
- Modify: `packages/framework/next-auth/src/__tests__/oidc.test.ts`

- [ ] **Step 1: Add empty-string idToken test inside the `buildEndSessionUrl` describe block (after the last existing test in that block)**

```ts
  it('builds URL without id_token_hint when idToken is an empty string', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(makeToken({ idToken: '' }), VALID_ENV, 'http://app/login');

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.searchParams.has('id_token_hint')).toBe(false);
    expect(parsed.searchParams.get('client_id')).toBe('test-client');
  });
```

- [ ] **Step 2: Add idToken preservation test inside the `refreshOidcAccessToken` describe block (after the last existing test in that block)**

```ts
  it('preserves the existing idToken when refresh response returns empty string', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      {
        url: MOCK_DISCOVERY.token_endpoint,
        body: { access_token: 'new-at', refresh_token: 'new-rt', expires_in: 3600, id_token: '' },
      },
    ]);

    const { refreshOidcAccessToken } = await import('../oidc');
    const token = makeToken({ idToken: 'original-id-token' });
    const result = await refreshOidcAccessToken(token, VALID_ENV);

    expect(result.idToken).toBe('original-id-token');
  });
```

- [ ] **Step 3: Run the test suite — confirm the two new tests fail**

```powershell
pnpm --filter @igrp/framework-next-auth test
```

Expected: three tests now fail (the one from Task 1 + these two). All others pass.

---

## Task 3: Fix `buildEndSessionUrl` in `oidc.ts`

Remove the `!token.idToken` null guard. Include `id_token_hint` only when `idToken` is a non-empty string.

**Files:**
- Modify: `packages/framework/next-auth/src/oidc.ts:158-178`

- [ ] **Step 1: Replace the `buildEndSessionUrl` function body**

Current code (lines 158-178):

```ts
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

Replace with:

```ts
export async function buildEndSessionUrl(
  token: JWT,
  env: AuthEnvironment,
  postLogoutRedirectUri: string,
): Promise<string | null> {
  const providerId = getProviderIdFromTokenOrEnv(token, env);
  if (providerId === 'none') return null;

  const discoveryUrl = getAuthProviderDiscoveryUrl(env, providerId);
  const openIdConfiguration = await getOpenIdConfiguration(discoveryUrl);
  if (!openIdConfiguration.end_session_endpoint) return null;

  const { clientId } = getClientCredentials(env);
  const url = new URL(openIdConfiguration.end_session_endpoint);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  if (token.idToken) {
    url.searchParams.set('id_token_hint', token.idToken);
  }

  return url.toString();
}
```

- [ ] **Step 2: Run the test suite — confirm the two `buildEndSessionUrl` tests now pass**

```powershell
pnpm --filter @igrp/framework-next-auth test
```

Expected: the two `buildEndSessionUrl` tests pass. The `refreshOidcAccessToken` idToken-preservation test still fails. All pre-existing tests still pass.

---

## Task 4: Fix `idToken` fallback in `refreshOidcAccessToken`

Change `??` to `||` so an empty-string `id_token` in the refresh response doesn't wipe the stored value.

**Files:**
- Modify: `packages/framework/next-auth/src/oidc.ts:113-123`

- [ ] **Step 1: Update the return statement in `refreshOidcAccessToken`**

Current line 116:
```ts
    idToken: refreshedToken.id_token ?? token.idToken,
```

Replace with:
```ts
    idToken: refreshedToken.id_token || token.idToken,
```

The full return block (for context — only the `idToken` line changes):

```ts
  return {
    ...token,
    accessToken: refreshedToken.access_token,
    idToken: refreshedToken.id_token || token.idToken,
    expiresAt: Date.now() + (refreshedToken.expires_in ?? 3600) * 1000,
    refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
    authProviderId: providerId,
    error: undefined,
    forceLogout: false,
  };
```

- [ ] **Step 2: Run the full test suite — all tests must pass**

```powershell
pnpm --filter @igrp/framework-next-auth test
```

Expected: all tests pass (the three new ones + all pre-existing ones).

- [ ] **Step 3: Commit**

```powershell
git add packages/framework/next-auth/src/oidc.ts packages/framework/next-auth/src/__tests__/oidc.test.ts
git commit -m "fix(next-auth): allow OIDC logout without id_token_hint; fix idToken fallback"
```

---

## Task 5: Add diagnostic logging to `getLogoutUrl` in `demo-legacy`

**Files:**
- Modify: `templates/demo-legacy/src/actions/igrp/auth.ts`

- [ ] **Step 1: Replace the function body with a version that logs before returning null**

Current file content:

```ts
"use server";

import { buildEndSessionUrl } from "@igrp/framework-next-auth/oidc";
import { auth } from "@/lib/auth";

/**
 * Returns the IdP end-session URL for RP-initiated logout, or null when:
 * - auth is disabled (AUTH_PROVIDER=none)
 * - no active session / idToken missing
 * - IdP discovery doc has no end_session_endpoint
 *
 * Must be called BEFORE signOut() — the access token is needed to build the URL.
 */
export async function getLogoutUrl(
  postLogoutRedirectUri: string,
): Promise<string | null> {
  const token = await auth.getAccessToken();
  if (!token) return null;
  return buildEndSessionUrl(token, process.env, postLogoutRedirectUri);
}
```

Replace with:

```ts
"use server";

import { buildEndSessionUrl } from "@igrp/framework-next-auth/oidc";
import { auth } from "@/lib/auth";

/**
 * Returns the IdP end-session URL for RP-initiated logout, or null when:
 * - auth is disabled (AUTH_PROVIDER=none)
 * - no active session
 * - IdP discovery doc has no end_session_endpoint
 *
 * Must be called BEFORE signOut() — the access token is needed to build the URL.
 */
export async function getLogoutUrl(
  postLogoutRedirectUri: string,
): Promise<string | null> {
  const token = await auth.getAccessToken();

  if (!token) {
    console.warn("[getLogoutUrl] no active token found — skipping IdP logout redirect");
    return null;
  }

  if (!token.idToken) {
    console.warn("[getLogoutUrl] token has no idToken — logout URL will be built without id_token_hint");
  }

  const url = await buildEndSessionUrl(token, process.env, postLogoutRedirectUri);

  if (!url) {
    console.warn(
      "[getLogoutUrl] buildEndSessionUrl returned null — IdP may not support end_session_endpoint or auth is disabled",
    );
  }

  return url;
}
```

- [ ] **Step 2: Commit**

```powershell
git add templates/demo-legacy/src/actions/igrp/auth.ts
git commit -m "fix(demo-legacy): add diagnostic logging to getLogoutUrl"
```

---

## Task 6: Create changeset and build

**Files:**
- Create: `.changeset/<auto-named>.md` (via `pnpm changeset`)

- [ ] **Step 1: Create a patch changeset**

```powershell
pnpm changeset
```

When prompted:
- Select `@igrp/framework-next-auth` (spacebar to select, Enter to confirm)
- Choose `patch`
- Summary: `buildEndSessionUrl no longer requires idToken to build the Keycloak end-session URL; idToken fallback in refreshOidcAccessToken now uses || to handle empty-string responses`

This creates a `.changeset/*.md` file — do NOT edit it manually.

- [ ] **Step 2: Build the auth package**

```powershell
pnpm build:auth
```

Expected: build completes with no errors. `packages/framework/next-auth/dist/` is updated.

- [ ] **Step 3: Verify the build output contains the fix**

```powershell
Select-String -Path "packages/framework/next-auth/dist/oidc.js" -Pattern "id_token_hint"
```

Expected: the pattern appears in the file and the surrounding code shows it is inside a conditional (`if`), not unconditional.

- [ ] **Step 4: Commit the changeset**

```powershell
git add .changeset/
git commit -m "chore: add changeset for logout OIDC fix"
```

---

## Task 7: Manual verification

- [ ] **Step 1: Start the demo-legacy dev server**

```powershell
pnpm dev:demo
```

This runs `pnpm --filter @igrp/framework-next-template dev` (Next.js + Turbopack) for `templates/demo-legacy`.

- [ ] **Step 2: Log in and verify end-session URL is built**

1. Log in through the app.
2. Open browser DevTools → Network tab.
3. Click logout (navigate to `/logout`).
4. In the Network tab, look for a request to your Keycloak `end_session_endpoint` (e.g. `http://<keycloak>/realms/<realm>/protocol/openid-connect/logout`).
5. Confirm the request is made.
6. Confirm the browser is redirected back to `/login` after Keycloak processes the logout.

- [ ] **Step 3: Verify SSO is cleared**

After logout, navigate to the login page and attempt to log in again. Keycloak should prompt for credentials rather than auto-authenticating.

- [ ] **Step 4: Verify server logs show no spurious warnings (happy path)**

In the terminal running the dev server, confirm there are no `[getLogoutUrl]` warnings during a normal logout (token present, `end_session_endpoint` exists).
