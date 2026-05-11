# Framework Auth Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent silent auth failures from cascading into cryptic `ERR_INVALID_URL` crashes by adding a `baseUrl` guard in `@igrp/framework-next` and replacing the blanket error-swallowing in `@igrp/framework-next-auth`'s `serverSession`.

**Architecture:** Two targeted changes in two packages. `framework/next` gains a guard in `igrpGetAccessClient` that throws a clear misconfiguration error when `baseUrl` is empty. `framework/next-auth` distinguishes between "no session" (legitimate null) and "fetch crashed" (rethrown error) in `serverSession`, so callers can handle each case correctly.

**Tech Stack:** TypeScript, Vitest, Next.js App Router, NextAuth v4

---

## Files

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `packages/framework/next/src/lib/api-client.ts` | Guard `baseUrl` before creating client |
| Create | `packages/framework/next/src/lib/__tests__/api-client.test.ts` | Unit tests for the guard |
| Modify | `packages/framework/next-auth/src/config.ts` | Distinguish error vs no-session in `serverSession` |
| Modify | `packages/framework/next-auth/src/__tests__/config.test.ts` | Tests for new `serverSession` behaviour |

---

## Task 1: Guard empty `baseUrl` in `igrpGetAccessClient`

**Files:**
- Modify: `packages/framework/next/src/lib/api-client.ts:30-42`
- Create: `packages/framework/next/src/lib/__tests__/api-client.test.ts`

### Context

`igrpGetAccessClient()` currently passes whatever is in the config straight to `AccessManagementClient.create()`. When `baseUrl` is `''` (config was reset but never re-set because session was null), the SDK builds relative URLs like `/api/users/me/applications?` and `fetch()` throws `ERR_INVALID_URL`. The error surface is deep inside the SDK with no indication of the real cause.

Current code (`packages/framework/next/src/lib/api-client.ts:30-42`):
```ts
export async function igrpGetAccessClient(): Promise<AccessManagementClient> {
  const { baseUrl, token, timeout = 10000 } = igrpGetAccessClientConfig();

  clientInstance = AccessManagementClient.create({
    baseUrl,
    timeout,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return clientInstance;
}
```

- [ ] **Step 1: Create the test file with a failing test**

Create `packages/framework/next/src/lib/__tests__/api-client.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react cache so it works outside Next.js
vi.mock('react', () => ({
  cache: (fn: () => unknown) => fn,
}));

// Mock AccessManagementClient so tests don't hit the network
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  AccessManagementClient: {
    create: vi.fn().mockReturnValue({}),
  },
}));

describe('igrpGetAccessClient', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('throws a clear error when baseUrl is empty', async () => {
    const { igrpGetAccessClient } = await import('../api-client');
    // baseUrl defaults to '' — no igrpSetAccessClientConfig call
    await expect(igrpGetAccessClient()).rejects.toThrow(
      'igrpGetAccessClient: baseUrl is not configured. Call igrpSetAccessClientConfig() before making API requests.',
    );
  });

  it('returns a client when baseUrl is set', async () => {
    const { igrpGetAccessClient } = await import('../api-client');
    const { igrpSetAccessClientConfig } = await import('../api-config');
    igrpSetAccessClientConfig({ baseUrl: 'https://api.example.com', token: 'tok' });
    const client = await igrpGetAccessClient();
    expect(client).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd packages/framework/next
pnpm test 2>&1 | head -40
```

Expected: FAIL — `igrpGetAccessClient is not a function` or the test passes trivially (no guard exists yet).

- [ ] **Step 3: Add the guard in `api-client.ts`**

Replace `packages/framework/next/src/lib/api-client.ts:30-42` with:

```ts
export async function igrpGetAccessClient(): Promise<AccessManagementClient> {
  const { baseUrl, token, timeout = 10000 } = igrpGetAccessClientConfig();

  if (!baseUrl) {
    throw new Error(
      'igrpGetAccessClient: baseUrl is not configured. Call igrpSetAccessClientConfig() before making API requests.',
    );
  }

  clientInstance = AccessManagementClient.create({
    baseUrl,
    timeout,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return clientInstance;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
cd packages/framework/next
pnpm test 2>&1
```

Expected: PASS — both `throws a clear error when baseUrl is empty` and `returns a client when baseUrl is set`.

- [ ] **Step 5: Commit**

```bash
git add packages/framework/next/src/lib/api-client.ts packages/framework/next/src/lib/__tests__/api-client.test.ts
git commit -m "fix(framework-next): throw clear error when baseUrl is not configured in igrpGetAccessClient"
```

---

## Task 2: Stop swallowing errors in `serverSession`

**Files:**
- Modify: `packages/framework/next-auth/src/config.ts` (line 576–585)
- Modify: `packages/framework/next-auth/src/__tests__/config.test.ts`

### Context

Current `serverSession` inside `withIGRPAuth` (`config.ts:576-585`):

```ts
async function serverSession(): Promise<Session | null> {
  if (configError) throw configError;
  if (authIsDisabled) return null;
  try {
    const { getServerSession } = await import('next-auth');
    return (await getServerSession(authOptions)) as Session | null;
  } catch {
    return null;  // ← swallows everything: network errors, decode failures, refresh crashes
  }
}
```

When a token refresh fails (network error hitting the OIDC issuer), `getServerSession` throws. The catch turns it into `null`. The caller (`igrpSetAccessClientConfig`) never runs. `baseUrl` stays `''`. The crash surfaces as `ERR_INVALID_URL` deep in the SDK with no diagnosis.

The fix: rethrow errors that are NOT "no session found" (i.e., not a clean `null` return from NextAuth). NextAuth's `getServerSession` returns `null` when there is no session — it does not throw. Any `catch` here therefore means an actual error occurred and should propagate.

- [ ] **Step 1: Write the failing test**

Add to `packages/framework/next-auth/src/__tests__/config.test.ts` at the bottom of the file (before the last `}`):

```ts
describe('withIGRPAuth — serverSession', () => {
  it('returns null when there is no session (getServerSession returns null)', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });

    vi.doMock('next-auth', () => ({
      getServerSession: vi.fn().mockResolvedValue(null),
    }));

    const session = await instance.serverSession();
    expect(session).toBeNull();
  });

  it('rethrows errors from getServerSession instead of swallowing them', async () => {
    const withIGRPAuth = await getFactory();
    const instance = withIGRPAuth({ env: VALID_ENV });

    vi.doMock('next-auth', () => ({
      getServerSession: vi.fn().mockRejectedValue(new Error('OIDC network failure')),
    }));

    await expect(instance.serverSession()).rejects.toThrow('OIDC network failure');
  });

  it('throws configError when configuration is invalid', async () => {
    const withIGRPAuth = await getFactory();
    // Missing required env vars to force a configError
    const instance = withIGRPAuth({ env: { AUTH_PROVIDER: 'igrp-auth' } });
    await expect(instance.serverSession()).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd packages/framework/next-auth
pnpm test 2>&1 | grep -A 5 "serverSession"
```

Expected: FAIL on `rethrows errors from getServerSession` — current code returns null instead of rethrowing.

- [ ] **Step 3: Update `serverSession` in `config.ts`**

Replace lines 576–585 in `packages/framework/next-auth/src/config.ts`:

```ts
async function serverSession(): Promise<Session | null> {
  if (configError) throw configError;
  if (authIsDisabled) return null;
  const { getServerSession } = await import('next-auth');
  return (await getServerSession(authOptions)) as Session | null;
}
```

The try/catch is removed entirely. `getServerSession` returns `null` for "no session" — it does not throw. Any throw here is a real error (network failure during OIDC refresh, JWT decode error, etc.) and must propagate so callers can respond correctly.

- [ ] **Step 4: Run the full test suite**

```bash
cd packages/framework/next-auth
pnpm test 2>&1
```

Expected: All tests pass including the three new `serverSession` tests.

- [ ] **Step 5: Commit**

```bash
git add packages/framework/next-auth/src/config.ts packages/framework/next-auth/src/__tests__/config.test.ts
git commit -m "fix(framework-next-auth): rethrow getServerSession errors instead of swallowing them as null"
```

---

## Task 3: Rebuild and publish both packages

**Files:**
- Run build in `packages/framework/next`
- Run build in `packages/framework/next-auth`

- [ ] **Step 1: Build `framework/next-auth`**

```bash
cd packages/framework/next-auth
pnpm build 2>&1
```

Expected: exits 0, `dist/` updated.

- [ ] **Step 2: Build `framework/next`**

```bash
cd packages/framework/next
pnpm build 2>&1
```

Expected: exits 0, `dist/` updated.

- [ ] **Step 3: Bump versions**

In `packages/framework/next-auth/package.json`, increment the patch version (e.g. `0.1.0-beta.119` → `0.1.0-beta.120`).

In `packages/framework/next/package.json`, increment the patch version (e.g. `0.1.0-beta.124-1` → `0.1.0-beta.125`).

- [ ] **Step 4: Commit version bumps**

```bash
git add packages/framework/next-auth/package.json packages/framework/next/package.json
git commit -m "chore: bump framework-next-auth and framework-next patch versions"
```

- [ ] **Step 5: Publish both packages**

```bash
cd packages/framework/next-auth
pnpm release 2>&1

cd ../next
pnpm release 2>&1
```

Expected: both publish successfully to `https://sonatype.nosi.cv/repository/igrp/`.

---

## Task 4: Update the consumer project

**Files:**
- Modify: `D:\nosi-projects\igrp3\igrp-auth\frontend\igrp-application-center\package.json`
- Modify: `D:\nosi-projects\igrp3\igrp-auth\frontend\igrp-application-center\src\actions\access-client.ts`

- [ ] **Step 1: Update framework dependency versions**

In `igrp-application-center/package.json`, update both packages to the newly published versions:

```json
"@igrp/framework-next": "0.1.0-beta.125",
"@igrp/framework-next-auth": "0.1.0-beta.120"
```

- [ ] **Step 2: Install updated packages**

```bash
cd D:\nosi-projects\igrp3\igrp-auth\frontend\igrp-application-center
pnpm install 2>&1
```

Expected: lockfile updated, no errors.

- [ ] **Step 3: Verify `access-client.ts` is still correct**

The consumer's `src/actions/access-client.ts` currently does:

```ts
export async function getClientAccess() {
  igrpResetAccessClientConfig();
  const session = await serverSession();
  if (!session) {
    redirect("/login");
  }
  return await igrpGetAccessClient();
}
```

With the framework fixes:
- `serverSession()` now throws real errors instead of returning null — so the `!session` branch only triggers on a genuinely absent session, not on a swallowed network crash.
- `igrpGetAccessClient()` now throws a clear error if `baseUrl` is empty — an extra safety net if `serverSession` somehow exits without setting the config.

No changes needed here. Verify it looks exactly as above.

- [ ] **Step 4: Start the dev server and verify the root page works**

```bash
pnpm dev 2>&1
```

Navigate to `http://localhost:3000`. Expected: home page loads with application list, no `ERR_INVALID_URL` in server logs.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade framework-next and framework-next-auth with auth resilience fixes"
```
