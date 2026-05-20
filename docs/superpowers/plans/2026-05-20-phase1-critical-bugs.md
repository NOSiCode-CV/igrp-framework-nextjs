# Phase 1 — Critical Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three critical production bugs in `@igrp/framework-next` — module-level mutable sync state, unbounded memory-leaking cache Maps, and blocking startup sync during RSC render.

**Architecture:** All changes are surgical, single-file edits to `packages/framework/next/src/`. No API surface changes. One `patch` changeset on `@igrp/framework-next`.

**Tech Stack:** Next.js 15 `after()` (post-response work), `unstable_cache`, TypeScript.

---

## Pre-flight: verify cookies() is already correct

- [ ] Read `packages/framework/next/src/lib/delete-auth-cookies.ts` line 4 — confirm it reads `const store = await cookies();`
- [ ] Read `templates/demo-legacy/src/actions/igrp/layout.ts` line 9 — confirm it reads `const cookieStore = await cookies();`

Both should already be awaited. If so, Bug 4 from the spec is already resolved — no action needed.

---

## Task 1: Move `igrpStartupSync` out of the render path

The root layout currently `await`s `igrpStartupSync()` during RSC rendering. This blocks streaming and runs sync logic inside React's render graph. Fix: move it into `after()` so it runs post-response.

**Files:**
- Modify: `packages/framework/next/src/layouts/igrp-root-layout.tsx`

- [ ] **Step 1: Add `after` import and replace the `await` call**

Open `packages/framework/next/src/layouts/igrp-root-layout.tsx`. Replace the file contents with:

```tsx
import { after } from 'next/server';
import { IGRPNestedProviders } from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { igrpStartupSync } from '../lib/startup-sync';

export type IGRPRootLayoutArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
};

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

  const { session, activeThemeValue, isScaled } = layout;

  const sidebarData = await layoutMockData.getSidebarData();

  // Schedule sync post-response — does not block streaming or RSC render.
  after(() =>
    igrpStartupSync({
      syncEnabled: syncAccess,
      appInformation,
      baseUrl: apiManagementConfig?.baseUrl || '',
      appCode,
      menus: sidebarData.menuItems || [],
      m2mServiceId: apiManagementConfig?.m2mServiceId || '',
      m2mToken: apiManagementConfig?.m2mToken || '',
      appRoutes: apiManagementConfig?.appRoutes,
      paramMapBody: apiManagementConfig?.paramMapBody,
    }),
  );

  return (
    <html lang="pt" suppressHydrationWarning className={font}>
      <body
        className={`bg-background overscroll-none h-screen font-sans antialiased 
          ${activeThemeValue ? ` theme-${activeThemeValue}` : ''} 
          ${isScaled ? ' theme-scaled' : ''}`}
      >
        <IGRPNestedProviders
          session={session}
          activeThemeValue={activeThemeValue}
          sessionArgs={sessionArgs}
          themeArgs={undefined}
        >
          {children}
        </IGRPNestedProviders>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Build framework/next to confirm no TypeScript errors**

```powershell
pnpm build:next
```

Expected: build completes with no errors. The `after()` call is valid since `next/server` ships this in Next.js 15.

- [ ] **Step 3: Commit**

```powershell
git add packages/framework/next/src/layouts/igrp-root-layout.tsx
git commit -m "fix(framework-next): move igrpStartupSync into after() — unblock RSC render path"
```

---

## Task 2: Cap `_menuCaches` Map to prevent unbounded growth

`_menuCaches` in `use-menus.ts` is a module-level `Map` that grows by one entry per unique `appCode` and is never evicted. On long-running servers with many appCodes this leaks memory.

Fix: add a `MAX_CACHE_ENTRIES = 50` constant and evict the oldest entry (FIFO) when the limit is reached.

**Files:**
- Modify: `packages/framework/next/src/hooks/use-menus.ts`

- [ ] **Step 1: Add eviction logic to `getMenuCache`**

Open `packages/framework/next/src/hooks/use-menus.ts`. Replace the file contents with:

```ts
import { unstable_cache } from 'next/cache';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

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
// Capped at MAX_CACHE_ENTRIES to prevent unbounded memory growth on long-running servers.
const MAX_CACHE_ENTRIES = 50;
const _menuCaches = new Map<
  string,
  (token: string, baseUrl: string) => ReturnType<typeof fetchMenusRaw>
>();

function getMenuCache(appCode: string) {
  if (!_menuCaches.has(appCode)) {
    if (_menuCaches.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = _menuCaches.keys().next().value;
      if (oldestKey !== undefined) _menuCaches.delete(oldestKey);
    }
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
      const h = await headers();
      const callbackUrl = h.get('x-current-path');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
    }
    console.error('[igrp-menus]: Erro ao carregar os menus da aplicação.:', error);
    return [];
  }
}
```

- [ ] **Step 2: Build and confirm no errors**

```powershell
pnpm build:next
```

Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```powershell
git add packages/framework/next/src/hooks/use-menus.ts
git commit -m "fix(framework-next): cap _menuCaches Map at 50 entries — prevent memory leak"
```

---

## Task 3: Cap `_appByCodeCaches` Map to prevent unbounded growth

Same issue as Task 2 but in `use-applications.ts`. Both `_appByCodeCaches` (per-appCode) need eviction. `getCachedAppsByUser` is already hoisted (not in a Map) so only `_appByCodeCaches` needs the cap.

**Files:**
- Modify: `packages/framework/next/src/hooks/use-applications.ts`

- [ ] **Step 1: Add eviction logic to `getAppByCodeCache`**

Open `packages/framework/next/src/hooks/use-applications.ts`. Replace the file contents with:

```ts
import { unstable_cache } from 'next/cache';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

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

// One unstable_cache wrapper per appCode — created lazily, stored in a Map.
// Capped at MAX_CACHE_ENTRIES to prevent unbounded memory growth.
const MAX_CACHE_ENTRIES = 50;
const _appByCodeCaches = new Map<
  string,
  (token: string, baseUrl: string) => ReturnType<typeof fetchAppByCodeRaw>
>();

function getAppByCodeCache(appCode: string) {
  if (!_appByCodeCaches.has(appCode)) {
    if (_appByCodeCaches.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = _appByCodeCaches.keys().next().value;
      if (oldestKey !== undefined) _appByCodeCaches.delete(oldestKey);
    }
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
      const h = await headers();
      const callbackUrl = h.get('x-current-path');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
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
      const h = await headers();
      const callbackUrl = h.get('x-current-path');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
    }
    console.error('[app-by-code] Não foi possível obter os dados da aplicação:', error);
    return null;
  }
}
```

- [ ] **Step 2: Build and confirm no errors**

```powershell
pnpm build:next
```

Expected: build completes with no errors.

- [ ] **Step 3: Smoke-test with demo-legacy in preview mode**

```powershell
pnpm dev:demo
```

Navigate to `http://localhost:3000`. The app should load normally with the sidebar and header rendered. Check the terminal for any startup sync or cache errors.

- [ ] **Step 4: Commit**

```powershell
git add packages/framework/next/src/hooks/use-applications.ts
git commit -m "fix(framework-next): cap _appByCodeCaches Map at 50 entries — prevent memory leak"
```

---

## Task 4: Create changeset and release

- [ ] **Step 1: Create a patch changeset for `@igrp/framework-next`**

```powershell
pnpm changeset
```

When prompted:
- Select `@igrp/framework-next` (space to select, enter to confirm)
- Type: `patch`
- Summary: `fix: move startup sync to after(), cap cache Maps to prevent memory leaks`

- [ ] **Step 2: Verify changeset file was created**

```powershell
ls .changeset/
```

Expected: one new `.md` file with the changeset content.

- [ ] **Step 3: Commit the changeset**

```powershell
git add .changeset/
git commit -m "chore: changeset for framework-next phase-1 bug fixes"
```

- [ ] **Step 4: Follow `/release-framework` command to version and publish**

Type `/release-framework` in Claude Code to run the full release workflow (version, build, publish, verify).
