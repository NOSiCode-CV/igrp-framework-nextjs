# framework-next: Streaming, Caching & Server Actions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-request API client isolation, `unstable_cache`-based cross-request caching, typed `"use server"` actions, and Suspense-streamed `IGRPLayout` to `@igrp/framework-next` and `@igrp/framework-next-ui`.

**Architecture:** `IGRPLayout` no longer blocks on `fetchLayoutData`; it renders `<Suspense>` + `<IGRPLayoutErrorBoundary>` wrappers around two async server components (`HeaderDataProvider`, `SidebarDataProvider`) that fetch in parallel. Each data fetcher is wrapped in `React.cache()` (per-request dedup) + `unstable_cache` (cross-request TTL). A new `@igrp/framework-next/actions` subpath exports typed `"use server"` actions, and `@igrp/framework-next/client` exports `useLayoutData()` for client-side refresh.

**Tech Stack:** Next.js 15 (`unstable_cache`, `revalidateTag`), React 19 (`cache`, `Suspense`), `@igrp/platform-access-management-client-ts`, TypeScript, pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-05-07-framework-next-streaming-caching-actions-design.md`

---

## File Map

### `packages/framework/next/src`

| File | Action |
|---|---|
| `lib/api-config.ts` | MODIFY — replace module vars with `React.cache()` per-request store |
| `lib/api-client.ts` | MODIFY — wrap `igrpGetAccessClient` in `React.cache()` |
| `hooks/use-menus.ts` | MODIFY — add `unstable_cache` + `React.cache` |
| `hooks/use-applications.ts` | MODIFY — add `unstable_cache` + `React.cache` |
| `hooks/use-user.ts` | MODIFY — add session-keyed `unstable_cache` + `React.cache` |
| `hooks/use-layout.ts` | MODIFY — `Promise.all` parallelization |
| `actions/index.ts` | CREATE — `"use server"` typed actions |
| `client/use-layout-data.ts` | CREATE — `"use client"` refresh hook |
| `layouts/providers/header-data-provider.tsx` | CREATE — async RSC, fetches user+apps |
| `layouts/providers/sidebar-data-provider.tsx` | CREATE — async RSC, fetches menus |
| `layouts/igrp-layout.tsx` | MODIFY — Suspense streaming refactor |
| `package.json` | MODIFY — add `./actions` and `./client` subpath exports |

### `packages/framework/next-ui/src`

| File | Action |
|---|---|
| `components/templates/layout-error-boundary.tsx` | CREATE — class-based `'use client'` ErrorBoundary |
| `components/templates/header-skeleton.tsx` | CREATE — header loading fallback |
| `components/templates/sidebar-skeleton.tsx` | CREATE — sidebar loading fallback |
| `components/templates/header-error.tsx` | CREATE — header error fallback |
| `components/templates/sidebar-error.tsx` | CREATE — sidebar error fallback |
| `components/providers/root.tsx` | MODIFY — accept `sidebar`/`header` ReactNode slots |
| `index.ts` | MODIFY — export new components |

---

## Task 1: Per-request config store

**Files:**
- Modify: `packages/framework/next/src/lib/api-config.ts`

- [ ] **Step 1: Replace `api-config.ts` with per-request `React.cache()` store**

```ts
// packages/framework/next/src/lib/api-config.ts
import { cache } from 'react';

export type IGRPClientRuntimeConfig = {
  token: string;
  baseUrl: string;
  timeout?: number;
};

const getRequestConfig = cache((): IGRPClientRuntimeConfig => ({
  token: '',
  baseUrl: '',
  timeout: 10_000,
}));

export function igrpSetAccessClientConfig(config: IGRPClientRuntimeConfig): void {
  Object.assign(getRequestConfig(), config);
}

export function igrpGetAccessClientConfig(): IGRPClientRuntimeConfig {
  return getRequestConfig();
}

export function igrpResetAccessClientConfig(): void {
  Object.assign(getRequestConfig(), { token: '', baseUrl: '', timeout: 10_000 });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `packages/framework/next`:
```
pnpm build:types
```
Expected: exits 0, no type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/lib/api-config.ts
git commit -m "feat(framework-next): per-request config store via React.cache()"
```

---

## Task 2: Per-request API client

**Files:**
- Modify: `packages/framework/next/src/lib/api-client.ts`

- [ ] **Step 1: Wrap `igrpGetAccessClient` in `React.cache()`**

```ts
// packages/framework/next/src/lib/api-client.ts
import { cache } from 'react';
import { AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { igrpGetAccessClientConfig, igrpResetAccessClientConfig } from './api-config';

export const igrpGetAccessClient = cache(async (): Promise<AccessManagementClient> => {
  const { baseUrl, token, timeout = 10_000 } = igrpGetAccessClientConfig();
  return AccessManagementClient.create({
    baseUrl,
    timeout,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
});

export function igrpResetAccessClient(): void {
  igrpResetAccessClientConfig();
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/lib/api-client.ts
git commit -m "feat(framework-next): per-request API client via React.cache()"
```

---

## Task 3: Cached `fetchMenus`

**Files:**
- Modify: `packages/framework/next/src/hooks/use-menus.ts`

Background: `unstable_cache` callbacks run outside the React render context and cannot call `React.cache()` functions (like `igrpGetAccessClient`). The fix is to extract credentials before entering `unstable_cache`, pass them as plain arguments to the raw fetch function, and include them in the cache key so entries are user-scoped.

- [ ] **Step 1: Rewrite `use-menus.ts` with caching**

```ts
// packages/framework/next/src/hooks/use-menus.ts
import { cache } from 'react';
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

export const fetchMenus = cache(async (appCode: string) => {
  try {
    const { token, baseUrl } = igrpGetAccessClientConfig();
    const cached = unstable_cache(
      async () => fetchMenusRaw(appCode, token, baseUrl),
      ['igrp-menus', appCode, token],
      { tags: [`igrp-menus-${appCode}`], revalidate: 300 },
    );
    return await cached();
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }
    console.error('[igrp-menus]: Erro ao carregar os menus da aplicação.:', error);
    return [];
  }
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/hooks/use-menus.ts
git commit -m "feat(framework-next): cache fetchMenus with unstable_cache + React.cache"
```

---

## Task 4: Cached `fetchAppsByUser` and `fetchAppByCode`

**Files:**
- Modify: `packages/framework/next/src/hooks/use-applications.ts`

- [ ] **Step 1: Rewrite `use-applications.ts` with caching**

```ts
// packages/framework/next/src/hooks/use-applications.ts
import { cache } from 'react';
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

export const fetchAppsByUser = cache(async () => {
  try {
    const { token, baseUrl } = igrpGetAccessClientConfig();
    const cached = unstable_cache(
      async () => fetchAppsByUserRaw(token, baseUrl),
      ['igrp-apps', token],
      { tags: ['igrp-apps'], revalidate: 300 },
    );
    return await cached();
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }
    console.error('[apps-by-user] Erro ao carregar os dados da aplicação.:', error);
    return [];
  }
});

export const fetchAppByCode = cache(async (appCode: string) => {
  try {
    if (!appCode)
      throw new Error(
        '[app-by-code]: O Modo de Visualização não está ativo. Quando está desativado, é necessário indicar o código da aplicação. Não foi encontrado nenhum código da aplicação.',
      );
    const { token, baseUrl } = igrpGetAccessClientConfig();
    const cached = unstable_cache(
      async () => fetchAppByCodeRaw(appCode, token, baseUrl),
      ['igrp-app-by-code', appCode, token],
      { tags: [`igrp-app-${appCode}`], revalidate: 300 },
    );
    return await cached();
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }
    console.error('[app-by-code] Não foi possível obter os dados da aplicação:', error);
    return null;
  }
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/hooks/use-applications.ts
git commit -m "feat(framework-next): cache fetchAppsByUser and fetchAppByCode with unstable_cache"
```

---

## Task 5: Cached `fetchCurrentUser`

**Files:**
- Modify: `packages/framework/next/src/hooks/use-user.ts`

- [ ] **Step 1: Rewrite `use-user.ts` with caching**

```ts
// packages/framework/next/src/hooks/use-user.ts
import { cache } from 'react';
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

export const fetchCurrentUser = cache(async () => {
  try {
    const { token, baseUrl } = igrpGetAccessClientConfig();
    const cached = unstable_cache(
      async () => fetchCurrentUserRaw(token, baseUrl),
      ['igrp-user', token],
      { revalidate: 60 },
    );
    return await cached();
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }
    console.error('[igrp-user] Erro ao carregar os dados do utilizador atual.:', error);
    return null;
  }
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/hooks/use-user.ts
git commit -m "feat(framework-next): cache fetchCurrentUser with session-keyed unstable_cache"
```

---

## Task 6: Parallelize `fetchLayoutData`

**Files:**
- Modify: `packages/framework/next/src/hooks/use-layout.ts`

- [ ] **Step 1: Replace sequential awaits with `Promise.all`**

```ts
// packages/framework/next/src/hooks/use-layout.ts
import type { IGRPHeaderDataArgs, IGRPSidebarDataArgs } from '@igrp/framework-next-types';

import { IgrpLayoutDataError } from '../errors';
import { fetchAppsByUser } from './use-applications';
import { fetchMenus } from './use-menus';
import { fetchCurrentUser } from './use-user';

export async function fetchLayoutData(
  getHeaderData: () => Promise<IGRPHeaderDataArgs>,
  getSidebarData: () => Promise<IGRPSidebarDataArgs>,
  previewMode: boolean,
  appCode: string | undefined,
) {
  let headerData = await getHeaderData();
  let sidebarData = await getSidebarData();

  if (!previewMode) {
    if (!appCode) {
      throw new IgrpLayoutDataError(
        'IGRP_APP_CODE_MISSING',
        '[igrp-layout]: Código da aplicação não encontrada.',
      );
    }

    const [menuItems, user, apps] = await Promise.all([
      fetchMenus(appCode),
      fetchCurrentUser(),
      fetchAppsByUser(),
    ]);

    headerData = {
      ...headerData,
      ...(user !== null && { user }),
    };

    sidebarData = {
      ...sidebarData,
      user: user ?? undefined,
      menuItems,
      apps,
      appCode,
      showPreviewMode: previewMode,
    };
  }

  return { headerData, sidebarData };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/hooks/use-layout.ts
git commit -m "perf(framework-next): parallelize fetchLayoutData with Promise.all"
```

---

## Task 7: Server actions subpath

**Files:**
- Create: `packages/framework/next/src/actions/index.ts`

- [ ] **Step 1: Create `src/actions/index.ts`**

```ts
// packages/framework/next/src/actions/index.ts
'use server';

import { revalidateTag } from 'next/cache';

import { fetchAppByCode, fetchAppsByUser } from '../hooks/use-applications';
import { fetchMenus } from '../hooks/use-menus';
import { fetchCurrentUser } from '../hooks/use-user';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function fetchMenusAction(appCode: string): Promise<ActionResult<Awaited<ReturnType<typeof fetchMenus>>>> {
  try {
    const data = await fetchMenus(appCode);
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Falha ao carregar os menus.' };
  }
}

export async function fetchCurrentUserAction(): Promise<ActionResult<Awaited<ReturnType<typeof fetchCurrentUser>>>> {
  try {
    const data = await fetchCurrentUser();
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Falha ao carregar os dados do utilizador.' };
  }
}

export async function fetchAppsByUserAction(): Promise<ActionResult<Awaited<ReturnType<typeof fetchAppsByUser>>>> {
  try {
    const data = await fetchAppsByUser();
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Falha ao carregar as aplicações.' };
  }
}

export async function fetchAppByCodeAction(appCode: string): Promise<ActionResult<Awaited<ReturnType<typeof fetchAppByCode>>>> {
  try {
    const data = await fetchAppByCode(appCode);
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Falha ao carregar os dados da aplicação.' };
  }
}

export async function revalidateMenusAction(appCode: string): Promise<void> {
  revalidateTag(`igrp-menus-${appCode}`);
}

export async function revalidateAppsAction(): Promise<void> {
  revalidateTag('igrp-apps');
}

export async function revalidateUserAction(): Promise<void> {
  // User cache is keyed by session token, not a revalidatable tag.
  // This action is a no-op on the server; the client must call router.refresh()
  // after invoking it to trigger an RSC re-render with the new session token.
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/actions/index.ts
git commit -m "feat(framework-next): add use-server actions subpath"
```

---

## Task 8: `useLayoutData` client hook

**Files:**
- Create: `packages/framework/next/src/client/use-layout-data.ts`

- [ ] **Step 1: Create `src/client/use-layout-data.ts`**

```ts
// packages/framework/next/src/client/use-layout-data.ts
'use client';

import { useRouter } from 'next/navigation';

import {
  revalidateAppsAction,
  revalidateMenusAction,
  revalidateUserAction,
} from '../actions/index';

export function useLayoutData(appCode: string) {
  const router = useRouter();

  return {
    refreshMenus: async () => {
      await revalidateMenusAction(appCode);
      router.refresh();
    },
    refreshApps: async () => {
      await revalidateAppsAction();
      router.refresh();
    },
    refreshUser: async () => {
      await revalidateUserAction();
      router.refresh();
    },
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/client/use-layout-data.ts
git commit -m "feat(framework-next): add useLayoutData client hook"
```

---

## Task 9: Update `package.json` with new subpaths

**Files:**
- Modify: `packages/framework/next/package.json`

- [ ] **Step 1: Add `./actions` and `./client` to the `exports` map**

In `packages/framework/next/package.json`, add after the `"./logger"` entry:

```json
"./actions": {
  "import": "./dist/actions/index.js",
  "types": "./dist/actions/index.d.ts",
  "default": "./dist/actions/index.js"
},
"./client": {
  "import": "./dist/client/use-layout-data.js",
  "types": "./dist/client/use-layout-data.d.ts",
  "default": "./dist/client/use-layout-data.js"
}
```

The complete `exports` block after the change:

```json
"exports": {
  ".": {
    "import": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "default": "./dist/index.js"
  },
  "./errors": {
    "import": "./dist/errors.js",
    "types": "./dist/errors.d.ts",
    "default": "./dist/errors.js"
  },
  "./app-error": {
    "import": "./dist/app-error.js",
    "types": "./dist/app-error.d.ts",
    "default": "./dist/app-error.js"
  },
  "./logger": {
    "import": "./dist/logger.js",
    "types": "./dist/logger.d.ts",
    "default": "./dist/logger.js"
  },
  "./actions": {
    "import": "./dist/actions/index.js",
    "types": "./dist/actions/index.d.ts",
    "default": "./dist/actions/index.js"
  },
  "./client": {
    "import": "./dist/client/use-layout-data.js",
    "types": "./dist/client/use-layout-data.d.ts",
    "default": "./dist/client/use-layout-data.js"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/framework/next/package.json
git commit -m "feat(framework-next): expose ./actions and ./client subpath exports"
```

---

## Task 10: `IGRPLayoutErrorBoundary` client component

**Files:**
- Create: `packages/framework/next-ui/src/components/templates/layout-error-boundary.tsx`

This is a minimal class-based error boundary. No external dependency needed — React class components are built in.

- [ ] **Step 1: Create `layout-error-boundary.tsx`**

```tsx
// packages/framework/next-ui/src/components/templates/layout-error-boundary.tsx
'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class IGRPLayoutErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles in `next-ui`**

Run from `packages/framework/next-ui`:
```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-ui/src/components/templates/layout-error-boundary.tsx
git commit -m "feat(framework-next-ui): add IGRPLayoutErrorBoundary class component"
```

---

## Task 11: Header and sidebar skeleton components

**Files:**
- Create: `packages/framework/next-ui/src/components/templates/header-skeleton.tsx`
- Create: `packages/framework/next-ui/src/components/templates/sidebar-skeleton.tsx`

- [ ] **Step 1: Create `header-skeleton.tsx`**

Uses `bg-muted animate-pulse` divs with semantic tokens — no dependency on a specific DS `Skeleton` export.

```tsx
// packages/framework/next-ui/src/components/templates/header-skeleton.tsx
'use client';

import { cn } from '@igrp/igrp-framework-react-design-system';

export function IGRPHeaderSkeleton() {
  return (
    <div
      className={cn(
        'bg-background sticky top-0 inset-x-0 isolate z-40 border-b flex items-center justify-between gap-2 px-4 py-2 min-w-0 h-16',
      )}
    >
      <div className={cn('flex items-center gap-2')}>
        <div className={cn('size-8 rounded bg-muted animate-pulse')} />
        <div className={cn('h-4 w-32 rounded bg-muted animate-pulse')} />
      </div>
      <div className={cn('flex items-center gap-2')}>
        <div className={cn('size-8 rounded-full bg-muted animate-pulse')} />
        <div className={cn('size-8 rounded-full bg-muted animate-pulse')} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `sidebar-skeleton.tsx`**

```tsx
// packages/framework/next-ui/src/components/templates/sidebar-skeleton.tsx
'use client';

import { cn } from '@igrp/igrp-framework-react-design-system';

export function IGRPSidebarSkeleton() {
  return (
    <div className={cn('flex flex-col gap-3 p-4 h-full')}>
      <div className={cn('h-10 w-full rounded bg-muted animate-pulse')} />
      <div className={cn('flex flex-col gap-2 mt-4')}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={cn('h-8 w-full rounded bg-muted animate-pulse')} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add packages/framework/next-ui/src/components/templates/header-skeleton.tsx
git add packages/framework/next-ui/src/components/templates/sidebar-skeleton.tsx
git commit -m "feat(framework-next-ui): add header and sidebar skeleton loading components"
```

---

## Task 12: Header and sidebar error fallback components

**Files:**
- Create: `packages/framework/next-ui/src/components/templates/header-error.tsx`
- Create: `packages/framework/next-ui/src/components/templates/sidebar-error.tsx`

- [ ] **Step 1: Create `header-error.tsx`**

```tsx
// packages/framework/next-ui/src/components/templates/header-error.tsx
'use client';

import { useRouter } from 'next/navigation';
import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

export function IGRPHeaderError() {
  const router = useRouter();

  return (
    <div
      className={cn(
        'bg-background sticky top-0 inset-x-0 isolate z-40 border-b flex items-center justify-between gap-2 px-4 py-2 min-w-0 h-16',
      )}
    >
      <span className={cn('text-sm text-muted-foreground')}>
        Falha ao carregar o cabeçalho.
      </span>
      <IGRPButton
        variant="ghost"
        size="sm"
        onClick={() => router.refresh()}
        showIcon
        iconName="RefreshCw"
      >
        Tentar novamente
      </IGRPButton>
    </div>
  );
}
```

- [ ] **Step 2: Create `sidebar-error.tsx`**

```tsx
// packages/framework/next-ui/src/components/templates/sidebar-error.tsx
'use client';

import { useRouter } from 'next/navigation';
import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

export function IGRPSidebarError() {
  const router = useRouter();

  return (
    <div className={cn('flex flex-col items-start gap-3 p-4')}>
      <span className={cn('text-sm text-muted-foreground')}>
        Falha ao carregar a navegação.
      </span>
      <IGRPButton
        variant="ghost"
        size="sm"
        onClick={() => router.refresh()}
        showIcon
        iconName="RefreshCw"
      >
        Tentar novamente
      </IGRPButton>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add packages/framework/next-ui/src/components/templates/header-error.tsx
git add packages/framework/next-ui/src/components/templates/sidebar-error.tsx
git commit -m "feat(framework-next-ui): add header and sidebar error fallback components"
```

---

## Task 13: Update `IGRPRootProviders` with slot props

**Files:**
- Modify: `packages/framework/next-ui/src/components/providers/root.tsx`

The current `sidebarData` and `headerData` props are required. We make them optional and add `sidebar`/`header` ReactNode slots. When slots are provided, they replace the data-driven components. Old callers passing data still work.

- [ ] **Step 1: Update `root.tsx`**

```tsx
// packages/framework/next-ui/src/components/providers/root.tsx
'use client';

import type {
  IGRPConfigArgs,
  IGRPHeaderDataArgs,
  IGRPSidebarDataArgs,
} from '@igrp/framework-next-types';
import {
  cn,
  IGRPToaster,
  SidebarInset,
  SidebarProvider,
} from '@igrp/igrp-framework-react-design-system';

import { IGRPTemplateHeader } from '../templates/header';
import { IGRPTemplateSidebar } from '../templates/sidebar';

export type IGRPRootProvidersArgs = {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  defaultOpen?: boolean;
  showHeader?: boolean;
  sidebarData?: IGRPSidebarDataArgs;
  headerData?: IGRPHeaderDataArgs;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  toasterConfig?: IGRPConfigArgs['toasterConfig'];
};

export function IGRPRootProviders({
  children,
  defaultOpen,
  showSidebar,
  showHeader,
  sidebarData,
  headerData,
  sidebar,
  header,
  toasterConfig,
}: IGRPRootProvidersArgs) {
  const {
    showToaster = true,
    position = 'bottom-right',
    theme = 'system',
    richColors = true,
    expand = false,
    duration = 5000,
  } = toasterConfig ?? {};

  const sidebarContent = sidebar ?? (sidebarData ? <IGRPTemplateSidebar data={sidebarData} /> : null);
  const headerContent = header ?? (headerData ? <IGRPTemplateHeader data={headerData} /> : null);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {showSidebar && sidebarContent && (
        <div className={cn('z-45')}>{sidebarContent}</div>
      )}

      <SidebarInset className={cn('min-w-0')}>
        {showHeader && headerContent}

        <div className={cn('p-4')}>{children}</div>

        {showToaster && (
          <IGRPToaster
            position={position}
            theme={theme}
            richColors={richColors}
            expand={expand}
            duration={duration}
            {...toasterConfig}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-ui/src/components/providers/root.tsx
git commit -m "feat(framework-next-ui): add sidebar/header ReactNode slot props to IGRPRootProviders"
```

---

## Task 14: Export new components from `next-ui`

**Files:**
- Modify: `packages/framework/next-ui/src/index.ts`

- [ ] **Step 1: Add new exports to `index.ts`**

Add after the `IGRPSegmentError` export (keeping the existing ordering pattern):

```ts
export { IGRPLayoutErrorBoundary } from './components/templates/layout-error-boundary';
export { IGRPHeaderSkeleton } from './components/templates/header-skeleton';
export { IGRPSidebarSkeleton } from './components/templates/sidebar-skeleton';
export { IGRPHeaderError } from './components/templates/header-error';
export { IGRPSidebarError } from './components/templates/sidebar-error';
```

- [ ] **Step 2: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next-ui/src/index.ts
git commit -m "feat(framework-next-ui): export new skeleton and error boundary components"
```

---

## Task 15: `HeaderDataProvider` async server component

**Files:**
- Create: `packages/framework/next/src/layouts/providers/header-data-provider.tsx`

This is a server component that fetches user + apps and renders `IGRPTemplateHeader`. It is placed inside a `<Suspense>` boundary by `IGRPLayout`.

- [ ] **Step 1: Create `src/layouts/providers/header-data-provider.tsx`**

```tsx
// packages/framework/next/src/layouts/providers/header-data-provider.tsx
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { IGRPTemplateHeader } from '@igrp/framework-next-ui';

import { fetchAppsByUser } from '../../hooks/use-applications';
import { fetchCurrentUser } from '../../hooks/use-user';

type HeaderDataProviderProps = {
  config: Pick<IGRPConfigArgs, 'layoutMockData' | 'previewMode'>;
};

export async function HeaderDataProvider({ config }: HeaderDataProviderProps) {
  const { previewMode, layoutMockData } = config;
  const headerData = await layoutMockData.getHeaderData();

  if (previewMode) {
    return <IGRPTemplateHeader data={headerData} />;
  }

  const [user] = await Promise.all([fetchCurrentUser()]);

  return (
    <IGRPTemplateHeader
      data={{
        ...headerData,
        ...(user !== null && { user }),
      }}
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/layouts/providers/header-data-provider.tsx
git commit -m "feat(framework-next): add HeaderDataProvider async server component"
```

---

## Task 16: `SidebarDataProvider` async server component

**Files:**
- Create: `packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx`

- [ ] **Step 1: Create `src/layouts/providers/sidebar-data-provider.tsx`**

```tsx
// packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { IGRPTemplateSidebar } from '@igrp/framework-next-ui';

import { IgrpLayoutDataError } from '../../errors';
import { fetchAppsByUser } from '../../hooks/use-applications';
import { fetchMenus } from '../../hooks/use-menus';
import { fetchCurrentUser } from '../../hooks/use-user';

type SidebarDataProviderProps = {
  config: Pick<IGRPConfigArgs, 'appCode' | 'layoutMockData' | 'previewMode'>;
};

export async function SidebarDataProvider({ config }: SidebarDataProviderProps) {
  const { appCode, previewMode, layoutMockData } = config;
  const sidebarData = await layoutMockData.getSidebarData();

  if (previewMode) {
    return <IGRPTemplateSidebar data={sidebarData} />;
  }

  if (!appCode) {
    throw new IgrpLayoutDataError(
      'IGRP_APP_CODE_MISSING',
      '[igrp-layout]: Código da aplicação não encontrada.',
    );
  }

  const [menuItems, user, apps] = await Promise.all([
    fetchMenus(appCode),
    fetchCurrentUser(),
    fetchAppsByUser(),
  ]);

  return (
    <IGRPTemplateSidebar
      data={{
        ...sidebarData,
        user: user ?? undefined,
        menuItems,
        apps,
        appCode,
        showPreviewMode: false,
      }}
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx
git commit -m "feat(framework-next): add SidebarDataProvider async server component"
```

---

## Task 17: Refactor `IGRPLayout` for streaming

**Files:**
- Modify: `packages/framework/next/src/layouts/igrp-layout.tsx`

`IGRPLayout` no longer calls `fetchLayoutData`. It passes Suspense-wrapped async server components as `sidebar`/`header` slots to `IGRPRootProviders`.

- [ ] **Step 1: Rewrite `igrp-layout.tsx`**

```tsx
// packages/framework/next/src/layouts/igrp-layout.tsx
import { Suspense } from 'react';
import {
  IGRPRootProviders,
  IGRPLayoutErrorBoundary,
  IGRPHeaderSkeleton,
  IGRPSidebarSkeleton,
  IGRPHeaderError,
  IGRPSidebarError,
} from '@igrp/framework-next-ui';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { igrpSetAccessClientConfig } from '../lib/api-config';
import { HeaderDataProvider } from './providers/header-data-provider';
import { SidebarDataProvider } from './providers/sidebar-data-provider';

export type IGRPLayoutArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
};

export async function IGRPLayout({ children, config }: IGRPLayoutArgs) {
  const {
    appCode,
    previewMode,
    showSidebar,
    showHeader,
    layout,
    apiManagementConfig,
    toasterConfig,
  } = config;

  const { session } = layout;

  if (!previewMode && apiManagementConfig?.baseUrl) {
    igrpSetAccessClientConfig({
      token: session?.accessToken || '',
      baseUrl: apiManagementConfig.baseUrl,
    });
  }

  // Only create slots when the section is enabled — avoids executing the async
  // server component when showSidebar/showHeader is false.
  const sidebarSlot = showSidebar ? (
    <IGRPLayoutErrorBoundary fallback={<IGRPSidebarError />}>
      <Suspense fallback={<IGRPSidebarSkeleton />}>
        <SidebarDataProvider config={config} />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  ) : null;

  const headerSlot = showHeader ? (
    <IGRPLayoutErrorBoundary fallback={<IGRPHeaderError />}>
      <Suspense fallback={<IGRPHeaderSkeleton />}>
        <HeaderDataProvider config={config} />
      </Suspense>
    </IGRPLayoutErrorBoundary>
  ) : null;

  return (
    <IGRPRootProviders
      defaultOpen={true}
      showSidebar={showSidebar}
      showHeader={showHeader}
      toasterConfig={toasterConfig}
      sidebar={sidebarSlot}
      header={headerSlot}
    >
      {children}
    </IGRPRootProviders>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
pnpm build:types
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/layouts/igrp-layout.tsx
git commit -m "feat(framework-next): stream IGRPLayout with Suspense + ErrorBoundary"
```

---

## Task 18: Build `@igrp/framework-next-ui`

**Files:**
- No file changes — this is a build verification step.

- [ ] **Step 1: Build `next-ui`**

Run from repo root:
```
pnpm build:next-ui
```
Expected: exits 0. Output in `packages/framework/next-ui/dist/`.

- [ ] **Step 2: Verify exported components are in dist**

```
ls packages/framework/next-ui/dist/components/templates/
```
Expected: files including `layout-error-boundary.js`, `header-skeleton.js`, `sidebar-skeleton.js`, `header-error.js`, `sidebar-error.js`.

- [ ] **Step 3: Commit (if any build artifacts or auto-generated files changed)**

If `packages/framework/next-ui/src/styles.css` or similar auto-generated files changed:
```bash
git add packages/framework/next-ui/
git commit -m "build(framework-next-ui): rebuild with new streaming components"
```

---

## Task 19: Build `@igrp/framework-next`

**Files:**
- No file changes — build verification step.

- [ ] **Step 1: Build `next`**

Run from repo root:
```
pnpm build:next
```
Expected: exits 0. Output in `packages/framework/next/dist/`.

- [ ] **Step 2: Verify new subpath entries are in dist**

```
ls packages/framework/next/dist/actions/
ls packages/framework/next/dist/client/
```
Expected:
- `dist/actions/index.js` and `dist/actions/index.d.ts`
- `dist/client/use-layout-data.js` and `dist/client/use-layout-data.d.ts`

- [ ] **Step 3: Verify the streaming layout change**

Run the demo template in preview mode to confirm the layout renders correctly:
```
pnpm dev:demo
```
Expected: layout renders with skeleton fallbacks briefly visible, then resolves to full header/sidebar. No console errors about missing props.

---

## Task 20: Add changesets

**Files:**
- Create: `.changeset/framework-next-streaming.md`
- Create: `.changeset/framework-next-ui-streaming.md`

- [ ] **Step 1: Add changeset for `@igrp/framework-next`**

```
pnpm changeset
```
When prompted:
- Select `@igrp/framework-next`
- Type: `patch`
- Summary: `Add per-request API client isolation, unstable_cache caching, server actions subpath, and streaming IGRPLayout with Suspense`

- [ ] **Step 2: Add changeset for `@igrp/framework-next-ui`**

```
pnpm changeset
```
When prompted:
- Select `@igrp/framework-next-ui`
- Type: `patch`
- Summary: `Add IGRPLayoutErrorBoundary, skeleton and error fallback components for streaming layout; IGRPRootProviders accepts sidebar/header slot props`

- [ ] **Step 3: Commit changesets**

```bash
git add .changeset/
git commit -m "chore: add changesets for framework-next and framework-next-ui streaming"
```

---

## Summary

| Task | Package | What changes |
|---|---|---|
| 1 | `next` | `api-config.ts` — per-request config |
| 2 | `next` | `api-client.ts` — per-request client |
| 3 | `next` | `use-menus.ts` — `unstable_cache` |
| 4 | `next` | `use-applications.ts` — `unstable_cache` |
| 5 | `next` | `use-user.ts` — `unstable_cache` |
| 6 | `next` | `use-layout.ts` — `Promise.all` |
| 7 | `next` | `actions/index.ts` — server actions |
| 8 | `next` | `client/use-layout-data.ts` — refresh hook |
| 9 | `next` | `package.json` — subpath exports |
| 10 | `next-ui` | `layout-error-boundary.tsx` |
| 11 | `next-ui` | `header-skeleton.tsx`, `sidebar-skeleton.tsx` |
| 12 | `next-ui` | `header-error.tsx`, `sidebar-error.tsx` |
| 13 | `next-ui` | `root.tsx` — slot props |
| 14 | `next-ui` | `index.ts` — exports |
| 15 | `next` | `header-data-provider.tsx` |
| 16 | `next` | `sidebar-data-provider.tsx` |
| 17 | `next` | `igrp-layout.tsx` — streaming |
| 18 | `next-ui` | build + verify |
| 19 | `next` | build + verify |
| 20 | both | changesets |
