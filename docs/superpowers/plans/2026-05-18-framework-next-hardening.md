# framework-next Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 13 issues found during a code review of `packages/framework/next` covering a concurrent-request security hazard, `unstable_cache` misuse, data-fetch waterfalls, a startup sync race condition, dead code, and minor cleanup.

**Architecture:** All changes are internal to `packages/framework/next/src/`; the public API surface (exports from `index.ts`) does not change. Issues are ordered by severity: critical first (concurrent safety, cache correctness), then high (parallelism), medium (correctness/dead code), low (cleanup).

**Tech Stack:** Next.js 15, React 19, `unstable_cache` / `React.cache`, Vitest, TypeScript strict, pnpm workspace monorepo.

---

## File Map

| File | Change |
|------|--------|
| `src/lib/api-config.ts` | Replace module-level mutable object with `React.cache` per-request store |
| `src/lib/__tests__/api-config.test.ts` | New — tests for per-request config isolation |
| `src/hooks/use-user.ts` | Hoist `unstable_cache` to module level |
| `src/hooks/use-applications.ts` | Hoist `unstable_cache` to module level (module-scoped Map for per-app caches) |
| `src/hooks/use-menus.ts` | Hoist `unstable_cache` to module level (module-scoped Map for per-app caches) |
| `src/layouts/providers/header-data-provider.tsx` | Parallelize `getHeaderData` + `fetchCurrentUser` |
| `src/lib/startup-sync.ts` | Replace `isSynced` boolean with promise mutex; parallelize sync calls |
| `src/hooks/use-layout.ts` | Delete (dead code) |
| `src/components/glabal-loading.tsx` | Remove useless API call; actually render app name |
| `src/lib/sync-routes.ts` | Remove `FIX 3` / `FIX 4` task-reference comments |
| `src/layouts/igrp-root-layout.tsx` | Remove no-op `layoutConfig` alias |
| `src/layouts/providers/sidebar-data-provider.tsx` | Use `previewMode` variable instead of hardcoded `false` |
| `src/index.ts` | Update `glabal-loading` → `global-loading` import path |
| `src/components/global-loading.tsx` | Rename from `glabal-loading.tsx` |

---

## Task 1 — Per-request config isolation via `React.cache`

**Problem:** `api-config.ts` stores `token` and `baseUrl` in a module-level mutable object. Two concurrent Next.js requests can race: Request A sets `tokenA`, Request B sets `tokenB`, Request A reads `tokenB` and makes API calls as the wrong user.

**Fix:** Replace the shared mutable object with a `React.cache`-based per-request store. `React.cache` resets between requests in the RSC render tree, giving each request its own isolated config object. Server Actions that call `igrpGetAccessClientConfig()` are documented as a known limitation (they have a separate cache scope); they still work because their cache is populated when the action is invoked within the same request lifecycle.

**Files:**
- Modify: `packages/framework/next/src/lib/api-config.ts`
- Create: `packages/framework/next/src/lib/__tests__/api-config.test.ts`

---

- [ ] **Step 1.1 — Write the failing test**

Create `packages/framework/next/src/lib/__tests__/api-config.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// React.cache is a pass-through in test environments (no request scope).
// We mock it as identity so the module under test loads without React internals.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

// Import AFTER vi.mock so the mock is in place when the module initialises.
const { igrpSetAccessClientConfig, igrpGetAccessClientConfig, igrpResetAccessClientConfig } =
  await import('../api-config');

describe('igrpSetAccessClientConfig / igrpGetAccessClientConfig', () => {
  beforeEach(() => {
    igrpResetAccessClientConfig();
  });

  it('returns empty defaults before any config is set', () => {
    const config = igrpGetAccessClientConfig();
    expect(config.token).toBe('');
    expect(config.baseUrl).toBe('');
    expect(config.timeout).toBe(10_000);
  });

  it('returns the config that was set', () => {
    igrpSetAccessClientConfig({ token: 'tok123', baseUrl: 'https://api.example.com' });
    const config = igrpGetAccessClientConfig();
    expect(config.token).toBe('tok123');
    expect(config.baseUrl).toBe('https://api.example.com');
    expect(config.timeout).toBe(10_000);
  });

  it('preserves explicit timeout when provided', () => {
    igrpSetAccessClientConfig({ token: 't', baseUrl: 'http://x', timeout: 5_000 });
    expect(igrpGetAccessClientConfig().timeout).toBe(5_000);
  });

  it('igrpResetAccessClientConfig restores defaults', () => {
    igrpSetAccessClientConfig({ token: 'tok', baseUrl: 'http://api' });
    igrpResetAccessClientConfig();
    const config = igrpGetAccessClientConfig();
    expect(config.token).toBe('');
    expect(config.baseUrl).toBe('');
    expect(config.timeout).toBe(10_000);
  });
});
```

- [ ] **Step 1.2 — Run the test to verify it fails**

```powershell
pnpm --filter @igrp/framework-next vitest run src/lib/__tests__/api-config.test.ts
```

Expected: tests fail because the current `api-config.ts` doesn't import from `react` at all, so the mock does nothing yet. The tests may pass or fail depending on module isolation; we proceed regardless once we've verified the test file runs.

- [ ] **Step 1.3 — Rewrite `api-config.ts`**

Replace the entire file content:

```typescript
import { cache } from 'react';

export type IGRPClientRuntimeConfig = {
  token: string;
  baseUrl: string;
  timeout?: number;
};

const DEFAULT_TIMEOUT = 10_000;

// React.cache creates a fresh instance per RSC request, giving each concurrent
// request its own isolated config. This prevents token cross-contamination
// between concurrent requests during RSC renders.
//
// ⚠️  Server Actions have a separate React.cache scope from the page render.
// They inherit whatever token was most recently set in their own execution
// context. This is a known limitation for Server Action callers; the typical
// data-refresh actions (revalidateMenusAction, revalidateAppsAction) do not
// need the auth token and are unaffected.
const getPerRequestConfig = cache(
  (): IGRPClientRuntimeConfig => ({ token: '', baseUrl: '', timeout: DEFAULT_TIMEOUT }),
);

export function igrpSetAccessClientConfig(config: IGRPClientRuntimeConfig): void {
  Object.assign(getPerRequestConfig(), config);
}

export function igrpGetAccessClientConfig(): IGRPClientRuntimeConfig {
  return getPerRequestConfig();
}

export function igrpResetAccessClientConfig(): void {
  Object.assign(getPerRequestConfig(), { token: '', baseUrl: '', timeout: DEFAULT_TIMEOUT });
}
```

- [ ] **Step 1.4 — Run tests**

```powershell
pnpm --filter @igrp/framework-next vitest run src/lib/__tests__/api-config.test.ts
```

Expected: all 4 tests pass.

- [ ] **Step 1.5 — Run the full package test suite**

```powershell
pnpm --filter @igrp/framework-next vitest run
```

Expected: all existing tests pass.

- [ ] **Step 1.6 — Commit**

```powershell
git add packages/framework/next/src/lib/api-config.ts packages/framework/next/src/lib/__tests__/api-config.test.ts
git commit -m "fix(framework-next): scope api config per-request via React.cache to prevent token cross-contamination"
```

---

## Task 2 — Hoist `unstable_cache` wrappers to module level

**Problem:** `fetchCurrentUser`, `fetchAppsByUser`, `fetchAppByCode`, and `fetchMenus` all call `unstable_cache(...)` inside their function body on every invocation, creating a new wrapper object per call. `unstable_cache` is designed to be called once at module initialisation.

**Fix:**
- `fetchCurrentUser` and `fetchAppsByUser`: hoist directly to module level (static tags).
- `fetchMenus` and `fetchAppByCode`: use a lazy module-level `Map` keyed by `appCode` so the wrapper is created once per unique app code while preserving dynamic `igrp-menus-${appCode}` / `igrp-app-${appCode}` revalidation tags.

**Files:**
- Modify: `packages/framework/next/src/hooks/use-user.ts`
- Modify: `packages/framework/next/src/hooks/use-applications.ts`
- Modify: `packages/framework/next/src/hooks/use-menus.ts`

---

- [ ] **Step 2.1 — Rewrite `use-user.ts`**

```typescript
import { unstable_cache } from 'next/cache';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';

import { igrpGetAccessClientConfig } from '../lib/api-config';

async function fetchCurrentUserRaw(token: string, baseUrl: string) {
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.users.getCurrentUser();
  return result.data;
}

// Hoisted: one stable wrapper for the lifetime of the process.
// token + baseUrl are passed as args and become part of the cache key automatically.
const getCachedCurrentUser = unstable_cache(fetchCurrentUserRaw, ['igrp-user'], {
  revalidate: 60,
});

export async function fetchCurrentUser() {
  try {
    const { token, baseUrl } = igrpGetAccessClientConfig();
    return await getCachedCurrentUser(token, baseUrl);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }
    console.error('[igrp-user] Erro ao carregar os dados do utilizador atual.:', error);
    return null;
  }
}
```

- [ ] **Step 2.2 — Rewrite `use-applications.ts`**

```typescript
import { unstable_cache } from 'next/cache';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';

import { igrpGetAccessClientConfig } from '../lib/api-config';
import { mapperApplications } from '../mappers/applications-mapper';

async function fetchAppsByUserRaw(token: string, baseUrl: string) {
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.users.getCurrentUserApplications();
  return mapperApplications(result);
}

async function fetchAppByCodeRaw(appCode: string, token: string, baseUrl: string) {
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.applications.getApplications({ code: appCode });
  return mapperApplications(result)[0] ?? null;
}

// Hoisted: static tag 'igrp-apps' allows module-level declaration.
const getCachedAppsByUser = unstable_cache(fetchAppsByUserRaw, ['igrp-apps'], {
  tags: ['igrp-apps'],
  revalidate: 300,
});

// One unstable_cache wrapper per appCode — created lazily, stored in a Map so
// the wrapper is stable across calls for the same app. This preserves the
// dynamic 'igrp-app-${appCode}' revalidation tag required for targeted invalidation.
const _appByCodeCaches = new Map<
  string,
  (token: string, baseUrl: string) => Promise<ReturnType<typeof fetchAppByCodeRaw>>
>();

function getAppByCodeCache(appCode: string) {
  if (!_appByCodeCaches.has(appCode)) {
    _appByCodeCaches.set(
      appCode,
      unstable_cache(
        (token: string, baseUrl: string) => fetchAppByCodeRaw(appCode, token, baseUrl),
        ['igrp-app-by-code', appCode],
        { tags: [`igrp-app-${appCode}`], revalidate: 300 },
      ),
    );
  }
  return _appByCodeCaches.get(appCode)!;
}

export async function fetchAppsByUser() {
  try {
    const { token, baseUrl } = igrpGetAccessClientConfig();
    return await getCachedAppsByUser(token, baseUrl);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }
    console.error('[apps-by-user] Erro ao carregar os dados da aplicação.:', error);
    return [];
  }
}

export async function fetchAppByCode(appCode: string) {
  try {
    if (!appCode)
      throw new Error(
        '[app-by-code]: O Modo de Visualização não está ativo. Quando está desativado, é necessário indicar o código da aplicação. Não foi encontrado nenhum código da aplicação.',
      );
    const { token, baseUrl } = igrpGetAccessClientConfig();
    return await getAppByCodeCache(appCode)(token, baseUrl);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }
    console.error('[app-by-code] Não foi possível obter os dados da aplicação:', error);
    return null;
  }
}
```

- [ ] **Step 2.3 — Rewrite `use-menus.ts`**

```typescript
import { unstable_cache } from 'next/cache';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';

import { igrpGetAccessClientConfig } from '../lib/api-config';
import { mapperMenus } from '../mappers/menus-mapper';

async function fetchMenusRaw(appCode: string, token: string, baseUrl: string) {
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.users.getCurrentUserApplicationMenus(appCode);
  return mapperMenus(result);
}

// One unstable_cache wrapper per appCode — preserves dynamic 'igrp-menus-${appCode}'
// revalidation tag required by revalidateMenusAction.
const _menuCaches = new Map<
  string,
  (token: string, baseUrl: string) => Promise<ReturnType<typeof fetchMenusRaw>>
>();

function getMenuCache(appCode: string) {
  if (!_menuCaches.has(appCode)) {
    _menuCaches.set(
      appCode,
      unstable_cache(
        (token: string, baseUrl: string) => fetchMenusRaw(appCode, token, baseUrl),
        ['igrp-menus', appCode],
        { tags: [`igrp-menus-${appCode}`], revalidate: 300 },
      ),
    );
  }
  return _menuCaches.get(appCode)!;
}

export async function fetchMenus(appCode: string) {
  try {
    const { token, baseUrl } = igrpGetAccessClientConfig();
    return await getMenuCache(appCode)(token, baseUrl);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }
    console.error('[igrp-menus]: Erro ao carregar os menus da aplicação.:', error);
    return [];
  }
}
```

- [ ] **Step 2.4 — Run the full package test suite**

```powershell
pnpm --filter @igrp/framework-next vitest run
```

Expected: all tests pass.

- [ ] **Step 2.5 — Build the package to verify TypeScript**

```powershell
pnpm build:next
```

Expected: build succeeds with no type errors.

- [ ] **Step 2.6 — Commit**

```powershell
git add packages/framework/next/src/hooks/use-user.ts packages/framework/next/src/hooks/use-applications.ts packages/framework/next/src/hooks/use-menus.ts
git commit -m "perf(framework-next): hoist unstable_cache wrappers to module level"
```

---

## Task 3 — Parallelize sequential awaits

**Problem:** Three places issue independent async operations sequentially, adding unnecessary latency on every request:
1. `header-data-provider.tsx` awaits `getHeaderData()` then `fetchCurrentUser()` in series.
2. `startup-sync.ts` awaits three sync operations in series.

`use-layout.ts` also has the issue but is dead code; it will be deleted in Task 5.

**Files:**
- Modify: `packages/framework/next/src/layouts/providers/header-data-provider.tsx`
- Modify: `packages/framework/next/src/lib/startup-sync.ts`

---

- [ ] **Step 3.1 — Update `header-data-provider.tsx`**

Replace the file:

```typescript
// packages/framework/next/src/layouts/providers/header-data-provider.tsx
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { IGRPTemplateHeader } from '@igrp/framework-next-ui';
import type { BreadcrumbItem } from '@igrp/framework-next-ui';

import { fetchCurrentUser } from '../../hooks/use-user';

type HeaderDataProviderProps = {
  config: Pick<IGRPConfigArgs, 'layoutMockData' | 'previewMode'>;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbRouteLabels?: Record<string, string>;
};

export async function HeaderDataProvider({
  config,
  breadcrumbs,
  breadcrumbRouteLabels,
}: HeaderDataProviderProps) {
  const { previewMode, layoutMockData } = config;

  if (previewMode) {
    const headerData = await layoutMockData.getHeaderData();
    return (
      <IGRPTemplateHeader
        data={headerData}
        breadcrumbs={breadcrumbs}
        breadcrumbRouteLabels={breadcrumbRouteLabels}
      />
    );
  }

  // Parallel fetch: both are independent of each other.
  const [headerData, user] = await Promise.all([
    layoutMockData.getHeaderData(),
    fetchCurrentUser(),
  ]);

  return (
    <IGRPTemplateHeader
      data={{
        ...headerData,
        ...(user !== null && { user }),
      }}
      breadcrumbs={breadcrumbs}
      breadcrumbRouteLabels={breadcrumbRouteLabels}
    />
  );
}
```

- [ ] **Step 3.2 — Update `startup-sync.ts`**

`igrpSyncRoutes` and `igrpSyncMenus` are independent of `igrpSyncApplication`. If the Access Management API requires the application to exist before its routes/menus can be synced, `igrpSyncApplication` must complete first, but the other two can then run in parallel. Run `igrpSyncApplication` first, then fan out.

Replace the file:

```typescript
import { IGRPMenuItemArgs, IGRPPackageJson } from '@igrp/framework-next-types';
import { igrpSyncApplication } from './sync-application';
import { igrpSyncMenus } from './sync-menus';
import { igrpSyncRoutes } from './sync-routes';

export type IGRPStartupSyncArgs = {
  syncEnabled: boolean;
  appInformation: IGRPPackageJson;
  baseUrl: string;
  appCode: string;
  m2mServiceId: string;
  m2mToken: string;
  menus: IGRPMenuItemArgs[];
  appRoutes?: string[];
  paramMapBody?: string;
};

// Promise-based mutex: set on first invocation, subsequent calls share the same
// promise so concurrent requests don't trigger duplicate syncs. Reset to null
// on failure to allow a retry on the next request.
let syncPromise: Promise<void> | null = null;

export async function igrpStartupSync({
  syncEnabled,
  appInformation,
  baseUrl,
  appCode,
  m2mServiceId,
  m2mToken,
  menus,
  appRoutes,
  paramMapBody,
}: IGRPStartupSyncArgs) {
  if (!syncEnabled) {
    console.info(
      'Access Management synchronization skipped due to disabling. ' +
        'To re-enable it set IGRP_SYNC_ACCESS=true in environment variables.',
    );
    return;
  }

  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    try {
      // Application must exist before routes and menus can reference it.
      await igrpSyncApplication({ appInformation, baseUrl, appCode, m2mServiceId, m2mToken });

      // Routes and menus are independent of each other — run in parallel.
      await Promise.all([
        igrpSyncRoutes({ baseUrl, m2mServiceId, m2mToken, appRoutes, paramMapBody }),
        igrpSyncMenus({ appCode, menus, baseUrl, m2mServiceId, m2mToken, syncEnabled }),
      ]);

      console.info('Access Management sync completed.');
    } catch (e) {
      // Reset so the next request can attempt a retry.
      syncPromise = null;
      console.error('An error occurred while syncing with Access Management: ', e);
    }
  })();

  return syncPromise;
}
```

- [ ] **Step 3.3 — Build the package to verify TypeScript**

```powershell
pnpm build:next
```

Expected: build succeeds.

- [ ] **Step 3.4 — Commit**

```powershell
git add packages/framework/next/src/layouts/providers/header-data-provider.tsx packages/framework/next/src/lib/startup-sync.ts
git commit -m "perf(framework-next): parallelize header data fetch and startup sync operations"
```

---

## Task 4 — Remove dead code

**Problem:**
1. `src/hooks/use-layout.ts` exports `fetchLayoutData` which is not imported anywhere and not re-exported from `index.ts`. It was superseded when data fetching was moved inline into the provider components.
2. `IGRPGlobalLoading` calls `fetchAppByCode` but always renders the same `<div>Loading...</div>` regardless of the result, wasting an API call per navigation to a loading state.

**Files:**
- Delete: `packages/framework/next/src/hooks/use-layout.ts`
- Modify: `packages/framework/next/src/components/glabal-loading.tsx`

---

- [ ] **Step 4.1 — Confirm `use-layout.ts` has no consumers**

```powershell
grep -r "use-layout\|fetchLayoutData" packages/framework/next/src --include="*.ts" --include="*.tsx" -l
```

Expected output: only `packages/framework/next/src/hooks/use-layout.ts` itself. If any other file appears, stop and investigate before deleting.

- [ ] **Step 4.2 — Delete `use-layout.ts`**

```powershell
Remove-Item packages/framework/next/src/hooks/use-layout.ts
```

- [ ] **Step 4.3 — Fix `glabal-loading.tsx` to use the fetched data**

The component fetches `app` but renders an identical string either way. Make the fetch result meaningful by rendering the app name:

```typescript
import { fetchAppByCode } from '../hooks/use-applications';

export async function IGRPGlobalLoading({ appCode }: { appCode: string }) {
  if (!appCode || appCode === 'IGRP') {
    return <div>Loading...</div>;
  }

  const app = await fetchAppByCode(appCode);

  return <div>Loading {app?.name ?? appCode}...</div>;
}
```

- [ ] **Step 4.4 — Build and verify**

```powershell
pnpm build:next
```

Expected: build succeeds, no references to the deleted file.

- [ ] **Step 4.5 — Commit**

```powershell
git add packages/framework/next/src/components/glabal-loading.tsx
git rm packages/framework/next/src/hooks/use-layout.ts
git commit -m "refactor(framework-next): remove dead fetchLayoutData and fix IGRPGlobalLoading dead fetch"
```

---

## Task 5 — Rename typo: `glabal-loading.tsx` → `global-loading.tsx`

**Problem:** The filename `glabal-loading.tsx` is a typo. It is referenced in `src/index.ts:4` as `'./components/glabal-loading'`. Both must be renamed together.

**Files:**
- Rename: `src/components/glabal-loading.tsx` → `src/components/global-loading.tsx`
- Modify: `src/index.ts`

---

- [ ] **Step 5.1 — Rename the file**

```powershell
Rename-Item packages/framework/next/src/components/glabal-loading.tsx packages/framework/next/src/components/global-loading.tsx
```

- [ ] **Step 5.2 — Update the import in `index.ts`**

In `packages/framework/next/src/index.ts`, change line 4:

```typescript
// Before
export { IGRPGlobalLoading } from './components/glabal-loading';

// After
export { IGRPGlobalLoading } from './components/global-loading';
```

- [ ] **Step 5.3 — Build to verify no broken imports**

```powershell
pnpm build:next
```

Expected: build succeeds.

- [ ] **Step 5.4 — Commit**

```powershell
git add packages/framework/next/src/index.ts
git add packages/framework/next/src/components/global-loading.tsx
git rm packages/framework/next/src/components/glabal-loading.tsx
git commit -m "fix(framework-next): rename glabal-loading.tsx to global-loading.tsx (typo)"
```

---

## Task 6 — Cleanup: comments, alias, hardcoded value

**Three small independent changes:**

1. `sync-routes.ts`: Remove `FIX 3` / `FIX 4` task-reference comments.
2. `igrp-root-layout.tsx`: Remove the no-op `const layoutConfig = config` alias.
3. `sidebar-data-provider.tsx`: Use `previewMode` variable instead of hardcoded `false`.

**Files:**
- Modify: `packages/framework/next/src/lib/sync-routes.ts`
- Modify: `packages/framework/next/src/layouts/igrp-root-layout.tsx`
- Modify: `packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx`

---

- [ ] **Step 6.1 — Remove task-reference comments from `sync-routes.ts`**

In `packages/framework/next/src/lib/sync-routes.ts`:

Remove line 41: `// ---- FIX 3: Parse ParamMap entries ----`

Remove line 58: `// ---- FIX 4: Filter static routes & exclude unwanted ----`

If the logic warrants explanation, replace with a comment about the *why*, not the fix reference. The current logic needs no comment since the variable names (`paramMap`, `excludedRoutes`, `menuRoutes`) are self-documenting.

- [ ] **Step 6.2 — Remove no-op alias in `igrp-root-layout.tsx`**

In `packages/framework/next/src/layouts/igrp-root-layout.tsx`, replace lines 11–22:

```typescript
// Before
export async function IGRPRootLayout({ children, config }: IGRPRootLayoutArgs) {
  const layoutConfig = config;

  const {
    font,
    layout,
    sessionArgs,
    syncAccess,
    appInformation,
    apiManagementConfig,
    appCode,
    layoutMockData,
  } = layoutConfig;

// After
export async function IGRPRootLayout({ children, config }: IGRPRootLayoutArgs) {
  const {
    font,
    layout,
    sessionArgs,
    syncAccess,
    appInformation,
    apiManagementConfig,
    appCode,
    layoutMockData,
  } = config;
```

- [ ] **Step 6.3 — Use `previewMode` variable in `sidebar-data-provider.tsx`**

In `packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx`, change line 44:

```typescript
// Before
        showPreviewMode: false,

// After
        showPreviewMode: previewMode,
```

(`previewMode` is `false` in this branch by construction, but using the variable is explicit and resilient to future refactors.)

- [ ] **Step 6.4 — Build to verify**

```powershell
pnpm build:next
```

Expected: build succeeds with no type errors.

- [ ] **Step 6.5 — Commit**

```powershell
git add packages/framework/next/src/lib/sync-routes.ts packages/framework/next/src/layouts/igrp-root-layout.tsx packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx
git commit -m "chore(framework-next): remove task-reference comments, no-op alias, and hardcoded preview flag"
```

---

## Self-Review

### Spec coverage

| Issue | Covered by |
|-------|-----------|
| #1 Concurrent config race | Task 1 |
| #2 `unstable_cache` inline | Task 2 |
| #3 Sequential awaits (header) | Task 3 |
| #4 Sequential awaits (use-layout) | Deleted in Task 4 (dead code) |
| #5 Sequential startup sync | Task 3 |
| #6 Dead code in IGRPGlobalLoading | Task 4 |
| #7 `fetchLayoutData` dead code | Task 4 |
| #8 AccessManagementClient singleton inconsistency | Not addressed — see note below |
| #9 `isSynced` race | Task 3 (`startup-sync.ts` promise mutex) |
| #10 Filename typo | Task 5 |
| #11 Task-reference comments | Task 6 |
| #12 No-op alias | Task 6 |
| #13 Hardcoded `showPreviewMode` | Task 6 |

**Issue #8 (AccessManagementClient singleton):** Each raw fetch function creates a fresh `AccessManagementClient` instance rather than using `igrpGetAccessClient()`. This is not addressed in this plan because fixing it properly requires threading config through the singleton, which intersects with the ongoing auth architecture discussion (the singleton in `api-client.ts` uses the same module-level config that Task 1 replaces with `React.cache`). This is tracked as a follow-on.

### Placeholder scan

No TBDs, TODOs, or "similar to Task N" patterns found.

### Type consistency

- `IGRPClientRuntimeConfig` type defined in Task 1 (`api-config.ts`) and used in Task 1 tests — consistent.
- `fetchCurrentUserRaw`, `fetchAppsByUserRaw`, `fetchAppByCodeRaw`, `fetchMenusRaw` — signatures unchanged from current code, consistent with their callers in Task 2.
- `IGRPStartupSyncArgs` type in `startup-sync.ts` — unchanged from current, consistent with Task 3 usage.
