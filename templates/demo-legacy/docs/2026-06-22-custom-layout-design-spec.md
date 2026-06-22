# Design & Spec: User-Defined Layout for IGRP-Studio Apps

| | |
|---|---|
| **Status** | Draft — awaiting manager approval |
| **Author** | Fidel da Luz |
| **Date** | 2026-06-22 |
| **Scope** | `templates/demo-legacy` (template-only). One optional, additive framework enhancement flagged for a separate decision. |
| **Affects** | `@igrp/framework-next-template` consumers; igrp-studio generated apps |
| **Risk** | Low (default path unchanged; fail-safe fallback) |

---

## 1. Executive summary

igrp-studio generates application pages into the authenticated route group `src/app/(igrp)/(generated)/…`. Today every generated app is wrapped by a single, fixed chrome — `IGRPLayoutFull` (header + sidebar) — selected in `src/app/(igrp)/layout.tsx`. There is no supported way for an end user to ship a generated app with their own layout/sidebar.

This proposal adds an **environment-driven layout switch** in `(igrp)/layout.tsx` that selects, per app, between the default framework layout (`IGRPLayoutFull`) and an **end-user-authored custom layout component** that lives in the template and can be freely redesigned.

**Key properties**
- **Zero framework-package changes required.** Built entirely from already-public exports.
- **Generated pages are untouched.** The switch sits one level above `(generated)`; studio output does not change.
- **Fail-safe.** Unknown/unset env always falls back to `IGRPLayoutFull`.
- **Auth & preview-mode correctness preserved.** Both branches reuse the existing `verifySession → configLayout → createConfig` pipeline.

**Estimated effort:** ~0.5–1 day (template-only). Optional framework `sidebar?` slot: +0.5 day incl. changeset + ordered build + release.

---

## 2. Background & problem statement

The template is the canonical consumer of `@igrp/framework-next*`. Its authenticated shell is composed in three layers:

```
IGRPRootLayout (next, SERVER)            → <html><body> + IGRPNestedProviders (session/theme/tooltip/watcher)
  └─ IGRPLayoutFull (next, SERVER)       → wires private data-fetchers into the client provider
       ├─ SidebarDataProvider (PRIVATE)  → fetch menus/user/apps → <IGRPTemplateSidebar data=…/>
       ├─ HeaderDataProvider  (PRIVATE)  → fetch header data      → <IGRPTemplateHeader  data=…/>
       └─ IGRPRootProvidersFull (next-ui, CLIENT)   ← composition seam
            { sidebar?: ReactNode, header: ReactNode, children }
              └─ SidebarProvider (DS) + SidebarInset + IGRPToaster
```

The decisive fact: **`IGRPRootProvidersFull` already accepts `sidebar` and `header` as `ReactNode` slots** (`packages/framework/next-ui/src/components/providers/root-full.tsx`). The provider does not care *what* sidebar is passed — only that a `SidebarProvider` wraps the tree (required because `IGRPTemplateNavUser` and DS `SidebarMenuButton` call `useIGRPSidebar()` unconditionally). This is the extension point we build on.

**Problem:** there is no template-level mechanism to choose an alternative layout per generated app, and no documented contract for what an end-user layout must satisfy.

---

## 3. Goals & non-goals

### Goals
- Let an end user supply a fully custom layout (chrome + sidebar) for an igrp-studio app via a component they own.
- Select the layout per app through a single environment variable.
- Keep the default behavior and the framework packages unchanged.
- Preserve auth gating and preview-mode bypass in both branches.

### Non-goals
- Changing how igrp-studio generates pages.
- Introducing a second UI library or bypassing the design system.
- A runtime/per-request layout picker UI (the choice is per app/deploy, not per request).
- Reworking the framework's internal data-fetching providers.

---

## 4. Proposed design

### 4.1 Layout selection in `(igrp)/layout.tsx`

Both layouts share one contract — `{ config, children }` — so the route-group layout simply chooses which **server component** to render:

```tsx
// src/app/(igrp)/layout.tsx
import { IGRPLayoutFull } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";

import { configLayout } from "@/actions/igrp/layout";
import { CustomLayout } from "@/components/custom-layout/custom-layout";
import { createConfig } from "@/igrp.template.config";
import { verifySession } from "@/lib/dal";
import type { IGRPAppLayoutProps } from "@/components/custom-layout/types";

export const dynamic = "force-dynamic";

// Server-only env: the choice is resolved entirely server-side and never needs
// to reach the client bundle. Unknown/unset → the proven default.
function resolveAppLayout(): (props: IGRPAppLayoutProps) => Promise<React.ReactNode> {
  switch (process.env.IGRP_APP_LAYOUT) {
    case "custom":
      return CustomLayout;
    default:
      return IGRPLayoutFull;
  }
}

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await verifySession();

  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  const AppLayout = resolveAppLayout();
  return <AppLayout config={config}>{children}</AppLayout>;
}
```

Notes:
- **Explicit `default → IGRPLayoutFull`** makes the framework path fail-safe and keeps both arms statically imported (bundler-traceable).
- The env is read **inside the function** so it evaluates per render under `force-dynamic`, not snapshotted at module load.
- If async-server-component typing fights the function-valued variable, the equivalent `if (process.env.IGRP_APP_LAYOUT === "custom") return <CustomLayout …/>; return <IGRPLayoutFull …/>` form is acceptable and type-clean.

### 4.2 Shared contract

```tsx
// src/components/custom-layout/types.ts
import type { IGRPConfigArgs } from "@igrp/framework-next-types";

export type IGRPAppLayoutProps = {
  config: IGRPConfigArgs;
  children: React.ReactNode;
};
```

`IGRPLayoutFull` satisfies this for the `{ config, children }` call site (its other props are optional).

### 4.3 The custom layout — a SERVER component

This is the critical correctness point. `config` carries **functions** (`layoutMockData.getSidebarData/getHeaderData`) and a live `Session`; it **cannot** cross a `"use client"` boundary. `IGRPLayoutFull` works because it is a server component that fetches server-side and passes only serializable props to the client provider. The custom layout must do the same.

```tsx
// src/components/custom-layout/custom-layout.tsx   ← SERVER (no "use client")
import { IGRPRootProvidersFull } from "@igrp/framework-next-ui";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import type { IGRPAppLayoutProps } from "./types";

export async function CustomLayout({ config, children }: IGRPAppLayoutProps) {
  // getSidebarData/getHeaderData already honor preview mode → bypass-safe.
  const [sidebarData, headerData] = await Promise.all([
    config.layoutMockData.getSidebarData(),
    config.layoutMockData.getHeaderData(),
  ]);

  return (
    <IGRPRootProvidersFull
      defaultOpen={sidebarData.defaultOpen ?? true}
      toasterConfig={config.toasterConfig}          // only the plain slice crosses to client
      sidebar={<AppSidebar data={sidebarData} />}   // client element with serializable data prop
      header={<AppHeader data={headerData} />}      // custom header — also a free slot
    >
      {children}
    </IGRPRootProvidersFull>
  );
}
```

Reusing `IGRPRootProvidersFull` keeps the mandatory `SidebarProvider` + `SidebarInset` + toaster wiring intact, so any sidebar-context component (including the header's `SidebarTrigger`) continues to work.

### 4.5 The custom header

`IGRPRootProvidersFull` renders the `header` slot inside `SidebarInset` — i.e. **still under `SidebarProvider`** — so a custom header may use `SidebarTrigger` / `useIGRPSidebar()`, or omit them. The framework's `IGRPTemplateHeader` is driven by ~15 `show*` booleans on `IGRPHeaderDataArgs` (a boolean-prop-proliferation case). A custom header skips the flags and composes the pieces directly, reusing `headerData` only for content. Public next-ui sub-pieces (`IGRPTemplateBreadcrumbs`, `IGRPTemplateCommandSearch`, `IGRPTemplateModeSwitcher`, `IGRPTemplateNotifications`) can be reused or replaced.

```tsx
// src/components/custom-layout/app-header.tsx   ← CLIENT
"use client";

import type { IGRPHeaderDataArgs } from "@igrp/framework-next-types";
import {
  IGRPTemplateBreadcrumbs, IGRPTemplateCommandSearch,
  IGRPTemplateModeSwitcher, IGRPTemplateNotifications,
} from "@igrp/framework-next-ui";
import { cn, Separator, SidebarTrigger } from "@igrp/igrp-framework-react-design-system";

import { AppUserMenu } from "./app-user-menu";

type AppHeaderProps = { data: IGRPHeaderDataArgs; className?: string };

export function AppHeader({ data, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "bg-background sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b px-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />{/* works: header is inside SidebarProvider */}
        <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
        <IGRPTemplateBreadcrumbs />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <IGRPTemplateCommandSearch />
        <IGRPTemplateNotifications
          notifications={data.notifications ?? []}
          notificationsUrl={data.notificationsUrl}
        />
        <IGRPTemplateModeSwitcher />
        {data.showUser && data.user && <AppUserMenu user={data.user} />}
      </div>
    </header>
  );
}
```

### 4.6 The custom user menu + avatar

Two facts shape this:
1. The framework's `IGRPTemplateNavUser` wraps the avatar in `SidebarMenu/SidebarMenuItem/SidebarMenuButton` (sidebar scaffolding). In a header that coupling is unnecessary — a custom header menu is just `DropdownMenu` + a `Button` trigger + the avatar.
2. **`IGRPTemplateNavUser` renders `IGRPUserAvatar` without `image`**, so the user photo (`IGRPUserArgs.picture`) is never shown — only initials. A custom menu fixes this by wiring `image={user.picture}`.

`IGRPUserAvatar` is the **Custom** DS layer (built on `Avatar/AvatarImage/AvatarFallback`). Two valid approaches:
- **Reuse it, wired correctly** (recommended default — cheapest, fixes the photo gap):

```tsx
// src/components/custom-layout/app-user-menu.tsx   ← CLIENT
"use client";

import type { IGRPUserArgs } from "@igrp/framework-next-types";
import {
  Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  IGRPIcon, IGRPUserAvatar, igrpGetInitials,
} from "@igrp/igrp-framework-react-design-system";
import Link from "next/link";

type AppUserMenuProps = { user: IGRPUserArgs };

export function AppUserMenu({ user }: AppUserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-10 rounded-full p-0">
          <IGRPUserAvatar
            image={user.picture}                        // ← wired (framework nav-user omits this)
            alt={user.name}
            fallbackContent={igrpGetInitials(user.name)}
            fallbackClass="text-xs"
            className="size-10"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-lg">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-muted-foreground text-xs">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile"><IGRPIcon iconName="User" className="mr-1" />Perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/logout"><IGRPIcon iconName="LogOut" className="mr-1" />Terminar sessão</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- **Drop to `Avatar` primitives** for full control (status ring/dot, bespoke fallback):

```tsx
import { Avatar, AvatarFallback, AvatarImage, igrpGetInitials } from "@igrp/igrp-framework-react-design-system";

<Avatar className="size-10 ring-2 ring-primary ring-offset-2 ring-offset-background">
  <AvatarImage src={user.picture ?? undefined} alt={user.name} />
  <AvatarFallback>{igrpGetInitials(user.name)}</AvatarFallback>
</Avatar>
```

Both stay within the design system and semantic tokens. The custom menu also owns its items, labels, and logout URL — none of which are configurable on the framework `IGRPTemplateNavUser`.

### 4.4 The custom sidebar — design-system primitives

The end user composes their sidebar directly from DS primitives (the "Primitives" layer is correct here — full structural control is exactly when the three-layer rule says drop below Horizon). Reference implementation:

```tsx
// src/components/custom-layout/app-sidebar.tsx   ← CLIENT
"use client";

import type { IGRPMenuItemArgs, IGRPSidebarDataArgs } from "@igrp/framework-next-types";
import { IGRPTemplateNavUser } from "@igrp/framework-next-ui";
import {
  cn, IGRPIcon,
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarRail, SidebarTrigger,
} from "@igrp/igrp-framework-react-design-system";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & { data: IGRPSidebarDataArgs };

export function AppSidebar({ data, className, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const items = (data.menuItems ?? [])
    .filter((m) => m.status === "ACTIVE")
    .sort((a, b) => a.position - b.position);

  return (
    <Sidebar collapsible="icon" className={cn(className)} {...props}>
      <SidebarHeader className="flex-row items-center gap-2">
        <SidebarTrigger className="shrink-0" />
        <span className="truncate font-semibold group-data-[state=collapsed]:hidden">
          {data.appCode ?? "App"}
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item: IGRPMenuItemArgs) => {
              const href = item.url ?? "#";
              const isActive = href !== "#" && pathname.startsWith(href);
              return (
                <SidebarMenuItem key={item.code ?? item.name}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                    <Link href={href} target={item.target ?? "_self"}>
                      {item.icon && <IGRPIcon iconName={item.icon} />}
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <IGRPTemplateNavUser user={data.user} showNotifications={data.showNotifications} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
```

*(Verify `IGRPIcon`'s exact prop name against the DS before implementation; nested/`parentCode` menu grouping can be added if menus are hierarchical.)*

---

## 5. End-user freedom: the "frame" and the "canvas"

The end user can design the layout to their imagination, within a fixed contract.

### The frame (non-negotiable)
1. The custom layout is a **server component** with signature `{ config, children }` (RSC serialization limit — `config` holds functions and a Session).
2. It must render `{children}` — the slot where generated pages mount.
3. Both the **sidebar** and the **header** are `ReactNode` slots rendered inside `SidebarProvider`. Any component that calls `useIGRPSidebar()` (`IGRPTemplateNavUser`, `IGRPTemplateAppSwitcher`, DS `SidebarMenuButton`/`SidebarTrigger`) must stay inside that provider (reusing `IGRPRootProvidersFull` provides it). If none are used, no sidebar/provider is required.
4. Repo UI hard rules apply: design-system only, semantic tokens only, `"use client"` on DS-importing files, preview-mode honored when fetching data.

### The canvas (free)
- No sidebar (top-nav, full-width), right-side sidebar, dual sidebar, icon rail vs. wide drawer.
- **Custom header** — own logo/title, breadcrumbs, search, notifications, theme toggle, and user menu; reuse the public next-ui sub-pieces or replace them. The framework header's ~15 `show*` flags are bypassed in favor of direct composition.
- **Custom user menu + avatar** — own dropdown items, labels, and logout URL; wire `image={user.picture}` (the framework nav-user omits it, so photos never show today) or drop to `Avatar` primitives for a status ring/dot.
- Footer/command palette/tabs/split panes — any composition of DS primitives.
- Keep the framework header/sidebar and swap only one, or replace everything.

**Trade-off:** the more an end user diverges from `IGRPRootProvidersFull`, the more plumbing they own (the `SidebarProvider`, `SidebarInset`, toaster). Reusing the provider is the low-cost path; fully bespoke is allowed but re-creates that wiring.

---

## 6. Export-safety analysis (why no framework change is needed)

| Building block | Source today | Public? |
|---|---|---|
| `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarProvider`, `useSidebar`, … | DS root | ✅ |
| `IGRPRootProvidersFull`, `IGRPNestedProviders` | `@igrp/framework-next-ui` | ✅ |
| `IGRPTemplateSidebar`, `IGRPTemplateHeader`, `IGRPTemplateMenus`, `IGRPTemplateNavUser` | `@igrp/framework-next-ui` | ✅ |
| Data actions (`fetchMenusAction`, `fetchCurrentUserAction`, …) | `@igrp/framework-next/actions` | ✅ |
| `SidebarDataProvider` / `HeaderDataProvider` | `next/src/layouts/providers/` | ❌ private |

- **Do not re-export `IGRPRootProvidersFull` & friends from `@igrp/framework-next`.** They are client components owned by `next-ui`; the documented guidance is to import client chrome from `@igrp/framework-next-ui`. Re-exporting client components through the server-only `next` package is a `"use client"` barrel hazard and a duplicate public surface. **Not recommended.**
- The only non-public pieces are the two private server data-fetchers. A custom layout intentionally re-implements that ~10-line fetch (the point of "custom"). Exporting them is technically safe but would lock their prop shape into the public API for little benefit — **defer unless we commit to a supported bring-your-own-chrome API.**

**Conclusion:** the feature ships with zero framework-package changes.

---

## 7. Optional additive enhancement (separate decision)

For the common case "keep the framework's data-fetching + header, swap only the sidebar," consider adding an **optional `sidebar?: ReactNode` slot to `IGRPLayoutFull`** that, when provided, overrides the default `SidebarDataProvider`. Properties:
- Additive and backward-compatible (no behavior change when omitted).
- Lets end users override only the sidebar without re-implementing the data layer.
- **Cost:** touches a publishable package → changeset (`patch`), ordered `pnpm build:framework`, and a release per the repo workflow.

This is **not required** for the env-switch feature and is presented for a go/no-go decision (see §13).

---

## 8. Correctness: auth & preview mode

Both branches are wrapped by the same upstream pipeline in `(igrp)/layout.tsx`:
- `verifySession()` — auth gate (redirects to `/login` when no session; returns a stub under `isAuthBypass()`).
- `configLayout()` + `createConfig()` — unchanged config assembly.

The custom layout fetches sidebar/header data only via `config.layoutMockData.*`, which already swaps in `src/temp/*` mocks under `IGRP_PREVIEW_MODE=true` / `AUTH_PROVIDER=none`. Therefore **both layout branches behave correctly with bypass on and off** — satisfying the repo rule that every auth-aware branch stay bypass-aware. No change to `middleware.ts`, root layout, or the config builder.

---

## 9. Best-practices conformance

- **Composition (Vercel):** slot-based `sidebar`/`header` props (`patterns-children-over-render-props`); explicit variant components selected by env instead of boolean-mode props (`patterns-explicit-variants`, `architecture-avoid-boolean-props`).
- **React/Next (Vercel):** parallel data fetch with `Promise.all` (`async-parallel`); minimal serializable props across the RSC boundary (`server-serialization`); statically analyzable imports (`bundle-analyzable-paths`).
- **Next.js:** correct server/client split (`rsc-boundaries`); `force-dynamic` retained for per-request session reads.
- **Design system / shadcn:** consumes DS primitives — no `npx shadcn add` in the template; Horizon-where-it-fits, primitives for full control; semantic tokens only; `cn()`, `size-*`, `flex gap-*`.

---

## 10. Work breakdown (spec)

| # | File | Type | Change |
|---|---|---|---|
| 1 | `src/app/(igrp)/layout.tsx` | SERVER | Add `resolveAppLayout()` env switch; render selected layout. |
| 2 | `src/components/custom-layout/types.ts` | shared | `IGRPAppLayoutProps` contract. |
| 3 | `src/components/custom-layout/custom-layout.tsx` | SERVER | Reference custom layout (fetch + `IGRPRootProvidersFull`). |
| 4 | `src/components/custom-layout/app-sidebar.tsx` | CLIENT | Reference DS-primitive sidebar (end-user editable). |
| 5 | `src/components/custom-layout/app-header.tsx` | CLIENT | Reference custom header (end-user editable). |
| 6 | `src/components/custom-layout/app-user-menu.tsx` | CLIENT | Reference custom user menu + avatar (wires `user.picture`). |
| 7 | `.env.example` | config | Document `IGRP_APP_LAYOUT`. |
| 8 | `docs/` (this doc) | docs | Design record. |

No `globals.css` change: `@source` already globs `../src/**/*.{ts,tsx}` and tokens (incl. `--sidebar-*`) are already imported.

### Environment variable spec

| Name | `IGRP_APP_LAYOUT` |
|---|---|
| Visibility | Server-only (not `NEXT_PUBLIC_*`) |
| Values | `full` (default) \| `custom` |
| Unset / unknown | Falls back to `full` (`IGRPLayoutFull`) |
| Read site | `(igrp)/layout.tsx` only |

---

## 11. Testing & verification plan

1. `pnpm build:demo` (runs Biome) — type-check + lint the new files. No `pnpm build:framework` needed (no framework edits).
2. `pnpm dev:demo` with `IGRP_PREVIEW_MODE=true`:
   - `IGRP_APP_LAYOUT=custom` → custom shell renders; sidebar toggles (Ctrl/Cmd+B); collapsed/expanded + dark mode verified; console/network clean.
   - `IGRP_APP_LAYOUT=full` (and unset) → `IGRPLayoutFull` renders unchanged.
3. Regression: existing `(igrp)/(generated)` routes render identically under both branches.
4. Bypass-off smoke check (real provider) if a backend is available.

---

## 12. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Serialization error from passing `config` to a client component | Medium (easy mistake) | Custom layout is a **server** component; documented in §4.3 and contract. |
| End user omits `SidebarProvider` and `useIGRPSidebar()` throws | Medium | Reference layout reuses `IGRPRootProvidersFull`; documented in §5 frame rule 3. |
| Unknown env value disables the shell | Low | Fail-safe `default → IGRPLayoutFull`. |
| Drift from framework API over time | Low | Custom layout uses only documented public exports; covered by template build in CI. |

---

## 13. Decisions requested for approval

1. **Approve the env-switch, template-only approach** (§4) as specified.
2. **Selection form:** binary `switch` (recommended) vs. a `Record<string,Component>` registry to support several named layouts in studio.
3. **Optional `sidebar?` slot on `IGRPLayoutFull`** (§7): include now (additive, needs a release) or defer.
4. **igrp-studio integration:** should studio scaffold the `custom-layout/*` files and surface the `IGRP_APP_LAYOUT` toggle, or is this a manual opt-in for end users initially?

---

## 14. Appendix — referenced source

- `packages/framework/next-ui/src/components/providers/root-full.tsx` — slot-based provider.
- `packages/framework/next-ui/src/components/templates/sidebar.tsx` — `IGRPTemplateSidebar` composition.
- `packages/framework/next/src/layouts/igrp-layout-full.tsx` — default layout + private data-fetchers.
- `packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx` — private fetch logic to mirror.
- `packages/framework/next/src/actions/index.ts` — public data actions.
- `packages/framework/next-types/src/types/sidebar.ts` — `IGRPSidebarDataArgs`.
- `templates/demo-legacy/src/app/(igrp)/layout.tsx` — switch site.
