# Design: `@igrp/framework-next` — Streaming, Caching & Server Actions

**Date:** 2026-05-07
**Status:** Approved
**Scope:** `packages/framework/next`, `packages/framework/next-ui`

## Problem Statement

`@igrp/framework-next` has three interconnected performance and ergonomics gaps:

1. **Sequential fetches** — `fetchLayoutData` calls `fetchMenus`, `fetchCurrentUser`, and `fetchAppsByUser` one after another. The entire layout blocks until all three complete.
2. **No cross-request caching** — every request hits the platform API regardless of how recently the same data was fetched. No TTL, no tag-based invalidation.
3. **No server action surface** — fetchers are server-only async functions. Client components cannot call them directly; there is no typed invalidation API.

Additionally, the API client singleton (`let clientInstance`) and config store are module-global, meaning concurrent requests with different session tokens can contaminate each other.

---

## Goals

- Parallelize layout data fetches (A).
- Add a mixed caching strategy: menus/apps on TTL + tags, user on session scope (B).
- Export typed `"use server"` actions callable from both RSC and client components (C).
- Fix per-request API client and config isolation.
- Stream `IGRPLayout` shell immediately; resolve each data piece independently behind Suspense.
- Do NOT change the public API of `IGRPLayout`, `IGRPRootLayout`, or `igrpBuildConfig`.

## Non-Goals

- Changes to `@igrp/framework-next-auth` or `@igrp/framework-next-types`.
- Changes to templates (they consume the new API automatically).
- New data sources beyond the existing platform access-management client.

---

## Architecture

### Layer Map

```
IGRPLayout (server, @igrp/framework-next)
  ├─ igrpSetAccessClientConfig()          ← per-request, React.cache scoped
  ├─ <ErrorBoundary fallback=<IGRPHeaderError>>
  │    └─ <Suspense fallback=<IGRPHeaderSkeleton>>
  │         └─ <HeaderDataProvider appCode>   ← async RSC, fetches user + apps
  ├─ <ErrorBoundary fallback=<IGRPSidebarError>>
  │    └─ <Suspense fallback=<IGRPSidebarSkeleton>>
  │         └─ <SidebarDataProvider appCode>  ← async RSC, fetches menus
  └─ {children}
        ↓ (data streams to client as each Suspense resolves)
IGRPRootProviders (client, @igrp/framework-next-ui)
  ├─ IGRPLayoutContext — holds { menus, user, apps }, accepts undefined until resolved
  ├─ IGRPHeaderResolver (client bridge — pushes user+apps into context)
  ├─ IGRPSidebarResolver (client bridge — pushes menus into context)
  └─ useLayoutData() — reads context, exposes typed refresh functions
```

### Cache Strategy

| Data | Mechanism | Cache Key | TTL | Invalidation Tag |
|---|---|---|---|---|
| Menus | `unstable_cache` + `React.cache` | `["igrp-menus", appCode]` | 300 s | `igrp-menus-{appCode}` |
| Apps | `unstable_cache` + `React.cache` | `["igrp-apps"]` | 300 s | `igrp-apps` |
| User profile | `unstable_cache` + `React.cache` | `["igrp-user", sessionToken]` | 60 s | — (session-scoped) |
| API client | `React.cache` only | per render tree | request | automatic |

---

## Section 1 — Per-Request API Client Isolation

### Problem
`api-client.ts` stores `clientInstance` in a module-level variable. `api-config.ts` stores `token`/`baseUrl` in module-level variables. Both persist across concurrent requests.

### Solution

**`src/lib/api-config.ts`** — replace module-level vars with a `React.cache()`-initialized object:

```ts
import { cache } from "react";

const getRequestConfig = cache(
  (): IGRPClientRuntimeConfig => ({ token: "", baseUrl: "", timeout: 10_000 })
);

export const igrpSetAccessClientConfig = (cfg: Partial<IGRPClientRuntimeConfig>) =>
  Object.assign(getRequestConfig(), cfg);

export const igrpGetAccessClientConfig = (): IGRPClientRuntimeConfig =>
  getRequestConfig();

export const igrpResetAccessClientConfig = () =>
  Object.assign(getRequestConfig(), { token: "", baseUrl: "", timeout: 10_000 });
```

**`src/lib/api-client.ts`** — wrap getter in `React.cache()`:

```ts
import { cache } from "react";

export const igrpGetAccessClient = cache(() => {
  const { token, baseUrl, timeout } = igrpGetAccessClientConfig();
  return new AccessManagementClient({ token, baseUrl, timeout });
});

export const igrpResetAccessClient = () => {
  // no-op: React.cache clears automatically per request
  igrpResetAccessClientConfig();
};
```

**Breaking change:** `igrpResetAccessClient()` becomes a no-op for the instance (instance is request-scoped now). The config reset still works. Consumers that relied on explicit reset between tests must update mocks.

---

## Section 2 — Caching Layer

### Raw vs Cached Fetchers

Each data-fetching function splits into two layers:

1. **`*Raw` internal** — the actual `AccessManagementClient` call (not exported).
2. **`unstable_cache` wrapper** — caches the raw call with a key + TTL + optional tag.
3. **`React.cache` outer** — deduplicates within one render pass.

### Menus

```ts
// src/hooks/use-menus.ts
const fetchMenusUncached = async (appCode: string): Promise<IGRPMenuItemArgs[]> => {
  // existing API call logic
};

const fetchMenusCached = (appCode: string) =>
  unstable_cache(fetchMenusUncached, ["igrp-menus", appCode], {
    revalidate: 300,
    tags: [`igrp-menus-${appCode}`],
  })(appCode);

export const fetchMenus = cache(fetchMenusCached);
```

### Apps

```ts
// src/hooks/use-applications.ts
const fetchAppsByUserCached = unstable_cache(fetchAppsByUserUncached, ["igrp-apps"], {
  revalidate: 300,
  tags: ["igrp-apps"],
});

export const fetchAppsByUser = cache(fetchAppsByUserCached);
```

### User

Keyed by session token so each user session gets its own cache entry:

```ts
// src/hooks/use-user.ts
export const fetchCurrentUser = cache(async () => {
  const { token } = igrpGetAccessClientConfig();
  const cachedFetch = unstable_cache(fetchCurrentUserUncached, ["igrp-user", token], {
    revalidate: 60,
  });
  return cachedFetch();
});
```

### Parallelization in `fetchLayoutData`

```ts
// src/hooks/use-layout.ts
export async function fetchLayoutData(...) {
  if (previewMode) { /* existing mock path unchanged */ }

  const [menus, user, apps] = await Promise.all([
    fetchMenus(appCode),
    fetchCurrentUser(),
    fetchAppsByUser(),
  ]);

  // existing merge logic unchanged
}
```

---

## Section 3 — Server Actions Subpath

### New file: `src/actions/index.ts`

```ts
"use server";

import { revalidateTag } from "next/cache";
import { fetchMenus, fetchCurrentUser, fetchAppsByUser, fetchAppByCode } from "../hooks/...";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function fetchMenusAction(
  appCode: string
): Promise<ActionResult<IGRPMenuItemArgs[]>> {
  try {
    const data = await fetchMenus(appCode);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: "Failed to fetch menus" };
  }
}

export async function fetchCurrentUserAction(): Promise<ActionResult<IGRPUserDTO | null>> { ... }
export async function fetchAppsByUserAction(): Promise<ActionResult<IGRPApplicationArgs[]>> { ... }
export async function fetchAppByCodeAction(appCode: string): Promise<ActionResult<IGRPApplicationArgs | null>> { ... }

export async function revalidateMenusAction(appCode: string): Promise<void> {
  revalidateTag(`igrp-menus-${appCode}`);
}
export async function revalidateAppsAction(): Promise<void> {
  revalidateTag("igrp-apps");
}
export async function revalidateUserAction(): Promise<void> {
  // User cache is keyed by session token, not a revalidatable tag.
  // This action is a no-op on the server; the client must call router.refresh()
  // after invoking it to trigger an RSC re-render with the new session token.
}
```

### New subpath export in `package.json`

```json
"./actions": {
  "import": "./dist/actions/index.js",
  "types": "./dist/actions/index.d.ts",
  "default": "./dist/actions/index.js"
}
```

### Usage from a client component

```ts
import { revalidateMenusAction } from "@igrp/framework-next/actions";
// call directly from an onClick handler or form action
```

---

## Section 4 — Streaming `IGRPLayout`

### Refactored `src/layouts/igrp-layout.tsx`

`IGRPLayout` no longer calls `fetchLayoutData` directly. Instead it renders two async sub-components behind Suspense + ErrorBoundary pairs.

```tsx
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export async function IGRPLayout({ children, config }: IGRPLayoutArgs) {
  igrpSetAccessClientConfig({
    token: config.layout.session?.accessToken ?? "",
    baseUrl: config.apiManagementConfig?.baseUrl ?? "",
  });

  return (
    <IGRPRootProviders config={config}>
      <ErrorBoundary fallback={<IGRPHeaderError />}>
        <Suspense fallback={<IGRPHeaderSkeleton />}>
          <HeaderDataProvider appCode={config.appCode} session={config.layout.session} />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<IGRPSidebarError />}>
        <Suspense fallback={<IGRPSidebarSkeleton />}>
          <SidebarDataProvider appCode={config.appCode} />
        </Suspense>
      </ErrorBoundary>

      {children}
    </IGRPRootProviders>
  );
}

async function HeaderDataProvider({ appCode, session }: HeaderDataProviderProps) {
  const [user, apps] = await Promise.all([fetchCurrentUser(), fetchAppsByUser()]);
  return <IGRPHeaderResolver user={user} apps={apps} session={session} />;
}

async function SidebarDataProvider({ appCode }: { appCode: string }) {
  const menus = await fetchMenus(appCode);
  return <IGRPSidebarResolver menus={menus} />;
}
```

`IGRPHeaderSkeleton`, `IGRPSidebarSkeleton`, `IGRPHeaderError`, `IGRPSidebarError` are new components added to `@igrp/framework-next-ui`.

### Preview mode

When `config.previewMode` is true, `HeaderDataProvider` and `SidebarDataProvider` skip the fetch and use mock data directly — no Suspense delay.

---

## Section 5 — UI Provider Updates (`@igrp/framework-next-ui`)

### `IGRPRootProviders` changes

Accepts `undefined` for header/sidebar data (populated lazily by resolvers):

```ts
// Before
type IGRPRootProvidersProps = { headerData: IGRPHeaderDataArgs; sidebarData: IGRPSidebarDataArgs; ... }

// After
type IGRPRootProvidersProps = {
  headerData?: IGRPHeaderDataArgs;
  sidebarData?: IGRPSidebarDataArgs;
  ...
}
```

### New context + resolvers

`IGRPLayoutContext` holds `{ menus, user, apps }`, initialized to `undefined`. Resolver components (client, `"use client"`) call a context setter when their data arrives:

```ts
// IGRPHeaderResolver.tsx
"use client";
export function IGRPHeaderResolver({ user, apps, session }) {
  const { setHeader } = useContext(IGRPLayoutContext);
  useEffect(() => { setHeader({ user, apps, session }); }, [user, apps]);
  return null; // rendering is handled by header component reading context
}
```

### `useLayoutData()` hook

```ts
export function useLayoutData() {
  const { menus, user, apps } = useContext(IGRPLayoutContext);
  const router = useRouter();

  return {
    menus,
    user,
    apps,
    refreshMenus: async (appCode: string) => {
      await revalidateMenusAction(appCode);
      router.refresh();
    },
    refreshApps: async () => {
      await revalidateAppsAction();
      router.refresh();
    },
    refreshUser: () => router.refresh(),
  };
}
```

---

## Section 6 — Error Handling

### Three tiers

| Tier | Trigger | Behavior |
|---|---|---|
| Auth (401/403) | API returns auth error | Redirect to `/login` (unchanged) |
| Transient fetch error | Network/API failure | Throw — caught by nearest ErrorBoundary; renders `IGRPHeaderError` / `IGRPSidebarError` with retry |
| Server action error | Action called from client fails | Return `{ ok: false, error: string }` — never throw to client |

### Error component pattern (in `@igrp/framework-next-ui`)

```tsx
export function IGRPSidebarError() {
  const router = useRouter();
  return (
    <div>
      <p>Failed to load navigation.</p>
      <button onClick={() => router.refresh()}>Retry</button>
    </div>
  );
}
```

All fetch errors log via `logger.error()` before throwing — no change to the logging contract.

---

## Affected Files

### `packages/framework/next`

| File | Change |
|---|---|
| `src/lib/api-config.ts` | Replace module vars with `React.cache()` object |
| `src/lib/api-client.ts` | Wrap getter in `React.cache()` |
| `src/hooks/use-menus.ts` | Split into raw + `unstable_cache` + `React.cache` |
| `src/hooks/use-applications.ts` | Split into raw + `unstable_cache` + `React.cache` |
| `src/hooks/use-user.ts` | Split into raw + `unstable_cache` (token-keyed) + `React.cache` |
| `src/hooks/use-layout.ts` | `Promise.all` parallelization |
| `src/layouts/igrp-layout.tsx` | Suspense + ErrorBoundary streaming refactor |
| `src/actions/index.ts` | **New** — `"use server"` typed actions |
| `package.json` | Add `./actions` subpath export |

### `packages/framework/next-ui`

| File | Change |
|---|---|
| `src/components/templates/` | `IGRPRootProviders` accepts optional data |
| `src/components/templates/` | New: `IGRPHeaderResolver`, `IGRPSidebarResolver` |
| `src/components/templates/` | New: `IGRPHeaderSkeleton`, `IGRPSidebarSkeleton` |
| `src/components/errors/` | New: `IGRPHeaderError`, `IGRPSidebarError` |
| `src/hooks/` | New: `useLayoutData()` |

---

## Constraints & Risks

- **`react-error-boundary` dependency** — Next.js 15 RSC does not natively support `ErrorBoundary` as a server component. `react-error-boundary` (or inline client wrapper) must be used. This adds a small dependency to `@igrp/framework-next`.
- **`unstable_cache` API** — this is a Next.js API marked unstable; behavior may change in future Next.js releases. It is the only available cross-request caching primitive today.
- **`igrpResetAccessClient()` behavior change** — the instance can no longer be reset imperatively (it is `React.cache`-scoped). Any test or template code calling this to swap tokens between calls within the same render must be updated.
- **`IGRPRootProviders` prop change** — making `headerData`/`sidebarData` optional is backward compatible (existing callers passing data still work), but `IGRPRootProviders` must handle the `undefined` state without crashing.

---

## Success Criteria

- [ ] Layout shell renders without waiting for any API call.
- [ ] Menus and apps are served from `unstable_cache` on warm requests (no API call).
- [ ] User profile refreshes within 60 s of a session change.
- [ ] `fetchMenusAction` and `revalidateMenusAction` callable from a client component without errors.
- [ ] Concurrent requests with different session tokens receive correct, isolated data.
- [ ] No change required in `templates/demo-legacy` to benefit from streaming.
