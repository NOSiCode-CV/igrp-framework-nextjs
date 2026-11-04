# Design & Spec: User-Defined Layout for IGRP-Studio Apps

| | |
|---|---|
| **Status** | Draft, revised 2026-11-04 against the current template and framework. Awaiting approval. |
| **Author** | Fidel da Luz |
| **Date** | 2026-06-22 (revised 2026-11-04) |
| **Scope** | `templates/demo-v1` only, plus a template-migrator migration. One optional framework enhancement is listed for a separate decision. |
| **Affects** | `@igrp/framework-next-template` consumers; igrp-studio generated apps |
| **Risk** | Low on the default path (unchanged, fail-safe fallback). Medium on the custom path, which copies data loading the framework keeps private. |
| **Companion** | `specs/2026-06-22-custom-auth-design-spec.md` (same frame/canvas model, same env-switch pattern) |

---

## 0. What changed in this revision

The first draft predates several framework changes. Its reference code would have shipped a custom layout with **no menus and no user in production**. This revision:

- Fetches menus, user and apps through the public `@igrp/framework-next/actions` in production, and through `config.layoutData` only under auth bypass. That is what the framework's private `SidebarDataProvider` does.
- Uses `config.layoutData` (`layoutMockData` was removed; `igrpBuildConfig` now rejects it by name).
- Keeps everything the current `(igrp)/layout.tsx` does (`verifySession` + `getLayoutConfig`, `igrpGetClaims` → `IGRPSectionPermissions`, `IGRPQueryProvider`, `headerSlots`) and swaps only the `IGRPLayoutFull` element.
- Takes into account what `IGRPLayoutFull` gained since June: `headerSlots` (`start`, `search`, `notifications`, `settings`, `actions`) and `defaultSidebarOpen`. A header-only customisation no longer needs a custom layout (§4.1).
- Drops claims that are no longer true. `IGRPTemplateNavUser` now passes `image={user.picture}` and takes a configurable sign-out URL, so the "photo gap" and the bespoke user menu are no longer reasons for this feature.
- Renders menus with the public `IGRPTemplateMenus`, which handles `type`, `pageSlug` and `parentCode`. The draft's hand-rolled flat list built links from `url` alone and broke folder menus.
- Adds the template-migrator migration that every `templates/demo-v1` change needs (§11).

---

## 1. Executive summary

igrp-studio generates pages into the authenticated route group `src/app/(igrp)/(generated)/…`. Every generated app is wrapped by one fixed chrome, `IGRPLayoutFull` (header + sidebar), rendered in `src/app/(igrp)/layout.tsx`. An end user has no supported way to ship a generated app with their own sidebar or shell.

This proposal adds an **environment-driven switch** in `(igrp)/layout.tsx` that renders either `IGRPLayoutFull` (default) or a **template-owned `CustomLayout`** the end user can redesign.

**Key properties**
- **No framework-package changes.** Built only from public exports.
- **Generated pages are untouched.** The switch sits above `(generated)`.
- **Fail-safe.** An unset or unknown value renders `IGRPLayoutFull`.
- **Auth, permissions and preview mode are preserved.** The switch replaces one element. `verifySession`, the claims seeding and the providers above it are shared by both branches.

**Estimated effort:** ~1 day including the migration. The optional framework `sidebar?` slot (§8) adds ~0.5 day plus a release.

---

## 2. Background

### 2.1 The current `(igrp)/layout.tsx`

```
verifySession() ‖ getLayoutConfig()     → auth gate + cached session/theme
createConfig(layoutConfig)              → IGRPConfigArgs (holds functions + Session)
igrpGetClaims()                         → permission claims
getHeaderSearchCommands(config)         → promise, not awaited (streams)

<IGRPSectionPermissions state={claims}>
  <IGRPQueryProvider>
    <IGRPLayoutFull config headerSlots={{ search, actions: <IGRPLocaleSwitcher/> }}>
      {children}
```

### 2.2 What `IGRPLayoutFull` does (`packages/framework/next/src/layouts/igrp-layout-full.tsx`)

1. Seeds the per-request Access Management client (`igrpSetAccessClientConfig`) with the session token, base URL, timeout and resolved locale, unless in preview mode.
2. Renders the sidebar and header as **separate streamed slots**, each wrapped in `IGRPLayoutErrorBoundary` + `<Suspense>` with a skeleton.
3. Inside each slot, a private data provider re-seeds the AM client (Suspense does not reliably carry the AsyncLocalStorage store) and loads data:
   - **preview mode:** `config.layoutData.getSidebarData()` / `getHeaderData()`, which return the `src/temp/*` mocks.
   - **production:** `layoutData` for the static fields, **plus** `fetchMenus(appCode)`, `fetchCurrentUser()` and `fetchAppsByUser()` for the live data. The template's `layoutData` returns `user`, `menuItems` and `apps` as `undefined` outside bypass ([igrp.template.config.ts](../src/igrp.template.config.ts)).
4. Hands everything to `IGRPRootProvidersFull` (next-ui, client), the composition seam: `{ sidebar?, header, defaultOpen, toasterConfig, className, children }` → `SidebarProvider` + `SidebarInset` + `IGRPToaster`.

Step 3 is the trap: **`layoutData` alone is not enough in production.** A custom layout has to fetch the live data itself.

### 2.3 Problem

There is no template-level way to pick an alternative shell per app, and no documented contract for what such a shell must do.

---

## 3. Goals & non-goals

### Goals
- Let an end user supply a fully custom shell (sidebar + header) through a component they own.
- Select it per app with one environment variable.
- Leave the default path and the framework packages unchanged.
- Preserve auth gating, permission claims and preview-mode bypass in both branches.

### Non-goals
- Changing how igrp-studio generates pages.
- A second UI library, or bypassing the design system.
- A runtime/per-request layout picker.
- Exporting the framework's private data providers.

---

## 4. Proposed design

### 4.1 Do you need a custom layout at all?

| Want | Use | Needs this feature? |
|---|---|---|
| Extra header buttons, own search, own notifications/settings | `IGRPLayoutFull` `headerSlots` | No |
| Hide the sidebar | `IGRPLayoutFull showSidebar={false}` | No |
| Sidebar closed by default | `IGRPLayoutFull defaultSidebarOpen={false}` | No |
| Different sidebar design, top-nav shell, right/dual sidebar | `CustomLayout` | **Yes** |

The docs and the studio toggle should steer users to the first three rows before this one.

### 4.2 Selection in `(igrp)/layout.tsx`

Only the `IGRPLayoutFull` element changes. `CustomLayout` takes the same `config`, `headerSlots` and `children` props, so both arms get identical inputs:

```tsx
// src/app/(igrp)/layout.tsx  (excerpt; the rest of the file is unchanged)
import { CustomLayout } from "@/components/custom-layout/custom-layout";

  // Server-only env, read per request (this layout is force-dynamic).
  // Unset or unknown → the framework layout.
  const AppLayout =
    process.env.IGRP_APP_LAYOUT === "custom" ? CustomLayout : IGRPLayoutFull;

  return (
    <IGRPSectionPermissions state={claims}>
      <IGRPQueryProvider>
        <AppLayout
          config={config}
          headerSlots={{
            search: (
              <Suspense fallback={<AppSearch commands={[]} />}>
                <AppSearchSlot commands={searchCommands} />
              </Suspense>
            ),
            actions: <IGRPLocaleSwitcher action={setLocale} />,
          }}
        >
          {children}
        </AppLayout>
      </IGRPQueryProvider>
    </IGRPSectionPermissions>
  );
```

Both arms are imported statically, so the bundler can trace them. If the conditional component trips the async-component typing, an `if (…) return <CustomLayout …/>` before the default return is equivalent.

### 4.3 Contract

```ts
// src/components/custom-layout/types.ts
import type { IGRPHeaderSlots } from "@igrp/framework-next-ui";
import type { IGRPConfigArgs } from "@igrp/framework-next-types";

export type CustomLayoutProps = {
  config: IGRPConfigArgs;
  headerSlots?: IGRPHeaderSlots;
  children: React.ReactNode;
};
```

This is a subset of `IGRPLayoutFullArgs`, so the call site in §4.2 type-checks for both arms.

### 4.4 Data loading (the part the draft got wrong)

```ts
// src/components/custom-layout/load-layout-data.ts   ← SERVER
import "server-only";

import {
  fetchAppsByUserAction,
  fetchCurrentUserAction,
  fetchMenusAction,
} from "@igrp/framework-next/actions";
import type {
  IGRPConfigArgs,
  IGRPHeaderDataArgs,
  IGRPSidebarDataArgs,
} from "@igrp/framework-next-types";

export async function loadLayoutData(config: IGRPConfigArgs): Promise<{
  sidebar: IGRPSidebarDataArgs;
  header: IGRPHeaderDataArgs;
}> {
  const [sidebar, header] = await Promise.all([
    config.layoutData.getSidebarData(),
    config.layoutData.getHeaderData(),
  ]);

  // Bypass: layoutData already returns the src/temp/* mocks, and there is no
  // Access Management server to call.
  if (config.previewMode) return { sidebar, header };

  const [menus, user, apps] = await Promise.all([
    fetchMenusAction(config.appCode),
    fetchCurrentUserAction(),
    fetchAppsByUserAction(),
  ]);
  // The actions already turn 401/403 into redirect('/login').
  // Any other failure → (igrp)/error.tsx.
  for (const result of [menus, user, apps]) {
    if (!result.ok) throw new Error(`[custom-layout] ${result.code}`);
  }

  const liveUser = user.ok ? (user.data ?? undefined) : undefined;
  return {
    sidebar: {
      ...sidebar,
      menuItems: menus.ok ? menus.data : [],
      apps: apps.ok ? apps.data : [],
      user: liveUser,
      appCode: config.appCode,
    },
    header: { ...header, ...(liveUser && { user: liveUser }) },
  };
}
```

Why the public actions and not the hooks: `fetchMenus`/`fetchCurrentUser`/`fetchAppsByUser` are not exported. The actions wrap them and recover the AM client config from the session themselves (`igrpEnsureAccessClientConfig`), so the custom layout doesn't need the private `igrpSetAccessClientConfig` either.

**Trade-off against `IGRPLayoutFull`:** this awaits the data before the shell renders, and one failure takes the whole page to `(igrp)/error.tsx`. The framework streams each slot behind its own boundary and skeleton. Parity is possible with public pieces (`IGRPLayoutErrorBoundary`, `IGRPSidebarSkeleton`, `IGRPSidebarError`, `IGRPHeaderSkeleton`, `IGRPHeaderError` from next-ui) by moving each fetch into an async slot component under `<Suspense>`. Left out of the reference to keep it small; listed as risk §13.3.

### 4.5 The custom layout (server component)

```tsx
// src/components/custom-layout/custom-layout.tsx   ← SERVER (no "use client")
import { IGRPRootProvidersFull } from "@igrp/framework-next-ui";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { loadLayoutData } from "./load-layout-data";
import type { CustomLayoutProps } from "./types";

export async function CustomLayout({ config, headerSlots, children }: CustomLayoutProps) {
  const { sidebar, header } = await loadLayoutData(config);

  return (
    <IGRPRootProvidersFull
      defaultOpen={sidebar.defaultOpen ?? true}
      toasterConfig={config.toasterConfig}
      sidebar={<AppSidebar data={sidebar} />}
      header={<AppHeader data={header} slots={headerSlots} />}
    >
      {children}
    </IGRPRootProvidersFull>
  );
}
```

`config` holds functions and a live `Session`, so it **must not** cross into a client component. Only `data` (plain objects) and `slots` (elements) cross. Reusing `IGRPRootProvidersFull` keeps the required `SidebarProvider`, `SidebarInset` and toaster wiring.

### 4.6 The custom sidebar (client)

The reference reuses the public next-ui pieces for anything with real logic (menu tree, user menu) and leaves the frame free:

```tsx
// src/components/custom-layout/app-sidebar.tsx   ← CLIENT
"use client";

import type { IGRPSidebarDataArgs } from "@igrp/framework-next-types";
import { IGRPTemplateMenus, IGRPTemplateNavUser } from "@igrp/framework-next-ui";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarTrigger,
} from "@igrp/igrp-framework-react-design-system";

export function AppSidebar({ data }: { data: IGRPSidebarDataArgs }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex-row items-center gap-2">
        <SidebarTrigger className="shrink-0" />
        <span className="truncate font-semibold group-data-[state=collapsed]:hidden">
          {data.appCode}
        </span>
      </SidebarHeader>
      <SidebarContent>
        {/* Handles menu types (FOLDER, MENU_PAGE, EXTERNAL_PAGE, …), pageSlug, parentCode nesting and active state. */}
        <IGRPTemplateMenus menus={data.menuItems ?? []} showSearch={data.showMenuSearch} />
      </SidebarContent>
      <SidebarFooter>
        <IGRPTemplateNavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
```

An end user may replace `IGRPTemplateMenus` with their own rendering of `data.menuItems`. If they do, they own the menu rules: `type`, `pageSlug` vs `url`, `parentCode` nesting, `status`, `position` and `target`.

### 4.7 The custom header (client)

```tsx
// src/components/custom-layout/app-header.tsx   ← CLIENT
"use client";

import type { IGRPHeaderDataArgs } from "@igrp/framework-next-types";
import {
  type IGRPHeaderSlots,
  IGRPTemplateBreadcrumbs, IGRPTemplateModeSwitcher, IGRPTemplateNavUser,
} from "@igrp/framework-next-ui";
import { Separator, SidebarTrigger } from "@igrp/igrp-framework-react-design-system";

export function AppHeader({ data, slots }: { data: IGRPHeaderDataArgs; slots?: IGRPHeaderSlots }) {
  return (
    <header className="bg-background sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
        <IGRPTemplateBreadcrumbs />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {slots?.search}
        {slots?.actions}
        <IGRPTemplateModeSwitcher />
        {data.showUser !== false && data.user && <IGRPTemplateNavUser user={data.user} isHeader />}
      </div>
    </header>
  );
}
```

The header renders the same `headerSlots` the layout passes to `IGRPLayoutFull`, so the app's search and locale switcher stay in both branches. The header sits inside `SidebarProvider` (rendered in `SidebarInset`), so `SidebarTrigger` works. Before implementation, check each next-ui sub-piece's required props against its `*Props` type; the excerpt passes the minimum.

Any visible text an end user adds here goes through `src/i18n/messages`. `src/components` is in `lint:i18n`'s `check-literals` scope, and `build` runs it.

---

## 5. End-user freedom: the frame and the canvas

### The frame (non-negotiable)
1. `CustomLayout` is a **server component** taking `CustomLayoutProps`. `config` never crosses into a client component.
2. It renders `{children}`, the slot where generated pages mount.
3. Production data comes from the public actions; bypass data from `config.layoutData` (§4.4). Don't call Access Management any other way.
4. Anything that calls `useIGRPSidebar()` (`IGRPTemplateNavUser`, `IGRPTemplateAppSwitcher`, DS `SidebarMenuButton`/`SidebarTrigger`) stays inside `SidebarProvider`. Reusing `IGRPRootProvidersFull` provides it.
5. **Permissions stay above the switch.** `IGRPSectionPermissions` and `verifySession` live in `(igrp)/layout.tsx` and must not move into `CustomLayout`. A hidden menu item is navigation UX, not enforcement; pages keep their own `igrpAssertAuthorize` guards.
6. Template UI rules apply: design system only, semantic tokens only, `"use client"` on DS-importing files, `cn` from `/cn` in server files, user-visible text from `src/i18n/messages`.

### The canvas (free)
- No sidebar (top-nav), right-side sidebar, dual sidebar, icon rail vs wide drawer.
- Own header composition; reuse or replace the next-ui sub-pieces.
- Own menu rendering (taking on the rules in §4.6).
- Footer, tabs, split panes: any composition of DS primitives.

**Trade-off:** the further a layout moves from `IGRPRootProvidersFull`, the more plumbing it owns (`SidebarProvider`, `SidebarInset`, toaster).

---

## 6. Export-safety analysis

| Building block | Source | Public? |
|---|---|---|
| `Sidebar*`, `SidebarProvider`, `Separator`, … | DS root | ✅ |
| `IGRPRootProvidersFull`, `IGRPTemplateMenus`, `IGRPTemplateNavUser`, `IGRPTemplateBreadcrumbs`, `IGRPTemplateModeSwitcher`, `IGRPHeaderSlots` | `@igrp/framework-next-ui` | ✅ |
| `IGRPLayoutErrorBoundary`, `IGRPSidebarSkeleton`, `IGRPSidebarError`, `IGRPHeaderSkeleton`, `IGRPHeaderError` | `@igrp/framework-next-ui` | ✅ (for the streaming upgrade) |
| `fetchMenusAction`, `fetchCurrentUserAction`, `fetchAppsByUserAction` | `@igrp/framework-next/actions` | ✅ |
| `SidebarDataProvider`, `HeaderDataProvider`, `fetchMenus`, `igrpSetAccessClientConfig` | `framework-next` internals | ❌ private, not needed |

- **Don't re-export next-ui client components from `@igrp/framework-next`.** That is a `"use client"` barrel hazard and a duplicate public surface.
- **Don't export the private data providers.** That would lock their props into the public API. The ~20-line loader in §4.4 is the cost of "custom".

**Conclusion:** no framework-package changes.

---

## 7. Correctness: auth, permissions, preview mode

- **Auth:** `verifySession()` runs before the switch, in both branches. The actions behind §4.4 also refuse when no session can be recovered, and redirect to `/login` on 401/403.
- **Permissions:** `igrpGetClaims()` → `IGRPSectionPermissions` wraps both branches unchanged.
- **Preview / `AUTH_PROVIDER=none`:** `config.previewMode` (set from `isAuthBypass()` in `igrp.template.config.ts`) routes §4.4 to the mocks and skips every AM call.
- **No change** to `middleware.ts`, the root layout or `igrp.template.config.ts`.

---

## 8. Optional framework enhancement (separate decision)

For "keep the framework header and data, swap only the sidebar": an optional `sidebar?: ReactNode` on `IGRPLayoutFull` that replaces the default `SidebarDataProvider` slot.

- Additive and backward-compatible.
- **But** the replacement sidebar would still need live menus and user. Either the end user fetches them (the same §4.4 loader), or the prop becomes a render function `sidebar?: (data: IGRPSidebarDataArgs) => ReactNode`. A function can't cross into a client component, so it would have to be applied in the server `SidebarDataProvider`. Decide which before building.
- **Cost:** `patch` changeset on `@igrp/framework-next`, ordered `pnpm build:framework`, per-package release, and a template migration.

Not required for the env switch.

---

## 9. Best-practices conformance

- **Composition:** explicit variant selected by env; slot props (`sidebar`, `header`, `headerSlots`) rather than boolean modes.
- **React/Next:** parallel fetches with `Promise.all`; only serializable props or elements cross the RSC boundary; statically analysable imports; `force-dynamic` retained.
- **Design system:** DS primitives + public next-ui pieces; semantic tokens; `size-*`, `flex gap-*`; no `npx shadcn add`.

---

## 10. Work breakdown

| # | File | Type | Change |
|---|---|---|---|
| 1 | `src/app/(igrp)/layout.tsx` | SERVER | `IGRP_APP_LAYOUT` switch on the layout element only. |
| 2 | `src/components/custom-layout/types.ts` | shared | `CustomLayoutProps`. |
| 3 | `src/components/custom-layout/load-layout-data.ts` | SERVER | Bypass-aware loader (§4.4). |
| 4 | `src/components/custom-layout/custom-layout.tsx` | SERVER | Reference layout. |
| 5 | `src/components/custom-layout/app-sidebar.tsx` | CLIENT | Reference sidebar. |
| 6 | `src/components/custom-layout/app-header.tsx` | CLIENT | Reference header (renders `headerSlots`). |
| 7 | `.env.example` | config | Document `IGRP_APP_LAYOUT`. |
| 8 | `packages/framework/template-migrator/migrations/demo-v1/NN.MIGRATIONS-DDMMYYYY.md` + `payload/NN/` | migration | `file.create` for 2–6, `file.write` for 1, `env.add` for 7. Then `sync:template-lock`. |
| 9 | `specs/` (this doc) | docs | Design record. |

No `globals.css` change: `@source` already covers `src/**` and the DS `dist/`.

### Environment variable

| Name | `IGRP_APP_LAYOUT` |
|---|---|
| Visibility | Server-only (not `NEXT_PUBLIC_*`) |
| Values | `full` (default) \| `custom` |
| Unset / unknown | `IGRPLayoutFull` |
| Read site | `(igrp)/layout.tsx` only |

---

## 11. Build & release

1. Template edits (§10 rows 1–7).
2. Migration (row 8), then `pnpm --filter @igrp/template-migrator sync:template-lock` and commit `.igrp-migrations-lock.json`.
3. `pnpm --filter @igrp/template-migrator check:drift` must pass. It runs per MR in `check_template_drift` and in the migrator's `release`.
4. Release `@igrp/template-migrator` (`patch` changeset, per-package `release`, `--tag latest`), only when authorised.

No `pnpm build:framework`: no framework package changes.

---

## 12. Testing & verification

1. `pnpm build:demo`: Biome, `lint:i18n`, type-check.
2. `IGRP_PREVIEW_MODE=true`:
   - `IGRP_APP_LAYOUT=custom` → custom shell with mock menus/user; Ctrl/Cmd+B toggles; collapsed + dark mode; search and locale switcher in the header; console clean.
   - `full`, unset, and `nonsense` → `IGRPLayoutFull` unchanged.
3. **Bypass off, real backend (required, not optional):** `custom` shows live menus (including a folder menu and a `pageSlug` page), the live user and the app list. This is the case the first draft missed.
4. Bypass off, AM unreachable → `(igrp)/error.tsx`, not a blank sidebar.
5. Expired token on a custom-layout page → redirect to `/login`, sanitized `callbackUrl`.
6. A permission-gated page under `custom` → `forbidden.tsx` for a user without the permission.
7. `(generated)` routes render identically in both branches.
8. `check:drift` passes.

---

## 13. Risks & mitigations

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| 1 | Custom layout uses `layoutData` alone and ships empty in production | Was certain in the draft | §4.4 loader; test §12.3 is mandatory. |
| 2 | `config` passed to a client component (serialization error) | Medium | Contract §5.1; only `data`/elements cross. |
| 3 | No streaming: shell waits for AM; one failure takes the page to `error.tsx` | Medium | Accepted for the reference. Upgrade path in §4.4 uses only public pieces. |
| 4 | End-user menu rendering breaks folders or `pageSlug` | Medium | Reference reuses `IGRPTemplateMenus`; §4.6 lists the rules for replacing it. |
| 5 | `SidebarProvider` omitted, `useIGRPSidebar()` throws | Medium | Reuse `IGRPRootProvidersFull`; §5.4. |
| 6 | Permissions moved into or bypassed by the custom layout | Low | §5.5; the switch sits inside `IGRPSectionPermissions`. |
| 7 | Framework adds a header/sidebar feature the custom layout lacks | Medium over time | Expected cost of "custom". Reusing next-ui sub-pieces picks up most changes; release notes should flag shell changes. |
| 8 | Unknown env value disables the shell | Low | Fail-safe default. |

---

## 14. Decisions requested

1. **Approve the env switch** (§4) as revised.
2. **Selection form:** binary switch (recommended) vs a named-layout registry for studio.
3. **Streaming parity** for the reference layout (§4.4 trade-off): accept blocking for now (recommended), or build the Suspense/boundary version up front.
4. **Optional `sidebar?` slot on `IGRPLayoutFull`** (§8): include now, defer, or drop. If included, choose element vs render-function.
5. **igrp-studio integration:** scaffold `custom-layout/*` and expose `IGRP_APP_LAYOUT`, or manual opt-in first.

---

## 15. Appendix: referenced source

- `templates/demo-v1/src/app/(igrp)/layout.tsx`: switch site.
- `templates/demo-v1/src/igrp.template.config.ts`: `layoutData` (mocks only under bypass).
- `packages/framework/next/src/layouts/igrp-layout-full.tsx`: default layout.
- `packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx`, `header-data-provider.tsx`: private loading logic §4.4 mirrors.
- `packages/framework/next/src/actions/index.ts`: public data actions.
- `packages/framework/next-ui/src/providers/root-full.tsx`: slot-based provider.
- `packages/framework/next-ui/src/templates/header.tsx`: `IGRPHeaderSlots`.
- `packages/framework/next-ui/src/templates/sidebar.tsx`, `menus.tsx`, `nav-user.tsx`: reused sub-pieces.
- `packages/framework/next-types/src/types/{igrp,sidebar,header}.ts`: config and data types.
- `packages/framework/template-migrator/README.md`: adding a migration.
