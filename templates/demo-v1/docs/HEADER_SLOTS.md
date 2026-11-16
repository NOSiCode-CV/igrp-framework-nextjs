# Header Slots

How to render **your own components** in the template header: replacing the built-in search, notifications or settings control, adding new ones, or composing the header and sidebar yourself from the framework's parts.

- [The model](#the-model)
- [The slots](#the-slots)
- [Quick start](#quick-start)
- [The command palette](#the-command-palette)
- [Recipe: replace notifications](#recipe-replace-notifications)
- [Recipe: add your own actions](#recipe-add-your-own-actions)
- [Recipe: a badge next to the logo](#recipe-a-badge-next-to-the-logo)
- [Recipe: page breadcrumbs](#recipe-page-breadcrumbs)
- [Recipe: renaming labels](#recipe-renaming-labels)
- [Composing the header and sidebar](#composing-the-header-and-sidebar)
- [Async server slots](#async-server-slots)
- [Rules and gotchas](#rules-and-gotchas)
- [Preview mode](#preview-mode)
- [API reference](#api-reference)

## The model

The header is rendered by the framework, not by your app:

```
(igrp)/layout.tsx  [server]
  → IGRPLayoutFull            @igrp/framework-next          [server]
    → IGRPLayoutHeader        error boundary + <Suspense>   [server]
      → HeaderDataProvider
            getHeaderData()   → flags, logo, URLs
            user              → layoutData.getUser() or Access Management
            menus             → the palette commands (shared with the sidebar)
        → IGRPHeaderDataProvider  @igrp/framework-next-ui   ['use client']
          → IGRPTemplateHeader    (or your parts composition)
```

A **slot** hands the framework a node to render in a position it owns. The
framework still fetches and owns **all** header data: user, logo, breadcrumbs,
sidebar trigger. A slot replaces *what renders in a position*, never *where the
data comes from*.

## The slots

Pass them as `slots` on `IGRPLayoutHeader`, and give that to `IGRPLayoutFull`
as `header`:

| Slot | Position | Renders when |
| --- | --- | --- |
| `start` | Left region, after the logo/title, before the breadcrumbs | you pass a node |
| `search` | Right cluster, first: replaces the built-in command palette | you pass a node |
| `settings` | Right cluster: replaces the built-in settings link | you pass a node |
| `notifications` | Right cluster: replaces the built-in notifications dropdown | you pass a node |
| `actions` | Right cluster, after notifications, before the theme switcher | you pass a node |

A supplied slot always renders. For `search`, `settings` and `notifications` the
matching `show*` flag in `getHeaderData()` only decides whether the **built-in**
renders when you pass no slot. To hide a built-in, turn its flag off; to replace
it, pass the slot.

The `show*` flags live in `src/igrp.template.config.ts`, in `getHeaderData()`.

`headerSlots` on `IGRPLayoutFull` still works, but is deprecated in favour of
`slots` on `IGRPLayoutHeader`.

## Quick start

```tsx
// src/app/(igrp)/layout.tsx
import { IGRPLayoutFull, IGRPLayoutHeader } from "@igrp/framework-next";

import { EnvBadge } from "@/components/header/env-badge";
import { MyNotifications } from "@/components/header/my-notifications";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const config = await createConfig(layoutConfig);

  return (
    <IGRPLayoutFull
      config={config}
      header={
        <IGRPLayoutHeader
          config={config}
          slots={{
            start: <EnvBadge />,
            notifications: <MyNotifications />,
          }}
        />
      }
    >
      {children}
    </IGRPLayoutFull>
  );
}
```

Slots are **elements** (`<MyThing />`), not component references (`MyThing`).
See [Rules and gotchas](#rules-and-gotchas).

## The command palette

The built-in palette (`⌘K` / `Ctrl+K`) lists every page the sidebar shows,
grouped by folder. The framework builds these entries on the server from the
same request-cached menu fetch the sidebar uses (`igrpGetLayoutMenus`), with the
sidebar's own href rules, and streams them into the palette so a slow menu fetch
never delays the header. There is nothing to wire.

Any component under the layout can open it:

```tsx
"use client";
import { useIGRPCommandPalette } from "@igrp/framework-next-ui";

export function SearchHint() {
  const { actions } = useIGRPCommandPalette();
  return <IGRPButton onClick={actions.open}>…</IGRPButton>;
}
```

To show other entries, render your own palette in `slots.search`. When you do,
the framework skips building the menu commands.

## Recipe: replace notifications

The built-in dropdown renders whatever `getHeaderData()` returns in
`notifications`, a static array. To drive it from your own API instead:

```tsx
// src/components/header/my-notifications.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { IGRPTemplateNotifications } from "@igrp/framework-next-ui";

export function MyNotifications() {
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
  });

  return (
    <IGRPTemplateNotifications
      notifications={data ?? []}
      onMarkAllRead={markAllRead}
    />
  );
}
```

`IGRPQueryProvider` is already mounted above `IGRPLayoutFull` in this template,
so react-query works inside a slot.

**One behavioural note.** The user menu also carries a link-only
"Notifications" entry. When you pass a `notifications` slot, the framework
**suppresses** that entry, so the header does not offer two entry points of
which your component owns only one. Your slot is also *not* hidden on small
screens; the framework's own bell is (`hidden md:block`) because the user menu
covers mobile.

## Recipe: add your own actions

`actions` is the open-ended slot. Compose a fragment and you control the order:

```tsx
slots={{
  actions: (
    <>
      <HelpButton />
      <IGRPLocaleSwitcher action={setLocale} />
      <IGRPAuthorization permission="manage_access">
        <AdminShortcut />
      </IGRPAuthorization>
    </>
  ),
}}
```

Permission-gate individual items yourself; see [Permissions](PERMISSIONS.md).

## Recipe: a badge next to the logo

`start` sits between the logo/title and the breadcrumbs, and gets its own
separator when a logo, title or sidebar trigger precedes it:

```tsx
slots={{ start: <IGRPBadge variant="outline">STAGING</IGRPBadge> }}
```

It sits *before* the breadcrumbs on purpose: breadcrumbs collapse under
pressure, and a slot after them would be the first thing crushed on a narrow
viewport.

## Recipe: page breadcrumbs

By default the breadcrumbs follow the URL. A page that knows better (a record
name instead of an id) declares its trail; it is cleared when the page unmounts:

```tsx
// any page, server or client
import { IGRPPageBreadcrumbs } from "@igrp/framework-next-ui";

<IGRPPageBreadcrumbs
  items={[
    { label: "Users", href: "/users" },
    { label: user.name, href: `/users/${user.id}` },
  ]}
/>
```

Client code can call `useIGRPBreadcrumbs(items)` instead. Order of precedence:
the page's trail, then `breadcrumbs` on `IGRPLayoutHeader`, then the URL.

## Recipe: renaming labels

`IGRPLayoutHeader` takes `settingsLabel`, `navUserLabels`,
`commandSearchLabels`, `notificationsLabels`, `modeSwitcherLabels`,
`breadcrumbHomeLabel` and `breadcrumbEllipsisLabel`; `IGRPLayoutSidebar` takes
`menuLabels` and `navUserLabels`. Each is a partial override of the chrome
catalog for the current locale:

```tsx
<IGRPLayoutHeader config={config} navUserLabels={{ logout: "Exit" }} />
```

## Composing the header and sidebar

When slots are not enough, give `IGRPLayoutHeader` (or `IGRPLayoutSidebar`)
`children` built from the framework parts. The data is still fetched for you;
the parts read it from context. In a composition a part shows by being
included, and the `show*` flags are not consulted.

```tsx
import {
  IGRPHeaderEnd,
  IGRPHeaderLogo,
  IGRPHeaderModeSwitcher,
  IGRPHeaderRoot,
  IGRPHeaderSearch,
  IGRPHeaderSidebarTrigger,
  IGRPHeaderStart,
  IGRPHeaderTitle,
  IGRPHeaderUser,
  IGRPNavUserItem,
} from "@igrp/framework-next-ui";

<IGRPLayoutFull
  config={config}
  header={
    <IGRPLayoutHeader config={config}>
      <IGRPHeaderRoot>
        <IGRPHeaderStart>
          <IGRPHeaderSidebarTrigger />
          <IGRPHeaderLogo />
          <IGRPHeaderTitle>Acme</IGRPHeaderTitle>
        </IGRPHeaderStart>
        <IGRPHeaderEnd>
          <IGRPHeaderSearch />
          <IGRPHeaderModeSwitcher />
          <IGRPHeaderUser items={<IGRPNavUserItem href="/help">Help</IGRPNavUserItem>} />
        </IGRPHeaderEnd>
      </IGRPHeaderRoot>
    </IGRPLayoutHeader>
  }
>
```

The parts are flat exports (`IGRPHeaderRoot`, not `IGRPHeader.Root`): a server
layout cannot read a property off a client component.

Header parts: `IGRPHeaderRoot`, `IGRPHeaderStart`, `IGRPHeaderEnd`,
`IGRPHeaderSidebarTrigger` (hidden when the layout has no sidebar),
`IGRPHeaderLogo`, `IGRPHeaderTitle`, `IGRPHeaderBreadcrumbs`,
`IGRPHeaderSearch`, `IGRPHeaderSettings`, `IGRPHeaderNotifications`,
`IGRPHeaderModeSwitcher`, `IGRPHeaderUser`.

Sidebar parts: `IGRPSidebarRoot`, `IGRPSidebarAppSwitcher`, `IGRPSidebarMenus`,
`IGRPSidebarUser`, with the design system's `SidebarHeader`, `SidebarContent`
and `SidebarFooter` for the regions. `sidebar={null}` on `IGRPLayoutFull`
renders no sidebar.

## Async server slots

A slot element may be produced by an **async Server Component**:

```tsx
async function TenantSwitcher() {
  const tenants = await fetchTenants(); // server-side
  return <TenantSwitcherClient tenants={tenants} />;
}

slots={{ actions: <TenantSwitcher /> }}
```

Each slot renders inside **its own `<Suspense>`** with a small icon-sized
placeholder, so a slow slot cannot delay the logo, breadcrumbs or user menu.
Wrap your slot in your own `<Suspense>` to control the fallback.

## Rules and gotchas

**Pass elements, not components.** The header is a Client Component rendered
from a Server Component. Elements cross that boundary; functions do not.

```tsx
slots={{ search: <MySearch /> }}  // ✅
slots={{ search: MySearch }}      // ❌ a function cannot be serialized
```

**The same rule applies to props you pass into a slot.**
`IGRPCommandItem.onSelect` is a callback, so a server module cannot build it.
A server module can build items with `href` (and `external` for a new tab)
instead: the palette navigates there itself.

**Navigate with the router, not `window.open`.** `router.push()` applies
`basePath` (`NEXT_PUBLIC_BASE_PATH`); `window.open()` does not, so an internal
path opened that way 404s.

**`typedRoutes` is on.** Targets resolved from runtime data need a cast:
`router.push(href as Parameters<typeof router.push>[0])`.

**Slots are client-boundary code.** Anything importing from the design system
needs `'use client'`; see [Design System](DESIGN_SYSTEM.md).

## Preview mode

Slots and parts render the same under `IGRP_PREVIEW_MODE=true` or
`AUTH_PROVIDER=none` as against a live backend. In preview this template's
`layoutData` supplies `getMenus`, `getUser` and `getApps` with the `src/temp`
mocks, so the palette, sidebar and user menu all show mock data. Any data your
own slot resolves is yours to branch, with `isAuthBypass()` from
`@/lib/utilities`. See [Authentication](AUTHENTICATION.md).

## API reference

```ts
// @igrp/framework-next-ui
export type IGRPHeaderSlots = {
  start?: React.ReactNode;
  search?: React.ReactNode;
  notifications?: React.ReactNode;
  settings?: React.ReactNode;
  actions?: React.ReactNode;
};

// @igrp/framework-next
export type IGRPLayoutHeaderArgs = {
  config: IGRPConfigArgs;
  slots?: IGRPHeaderSlots;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbRouteLabels?: Record<string, string>;
  fallbackLogo?: string;
  className?: string;
  fallback?: React.ReactNode;       // loading state
  errorFallback?: React.ReactNode;  // error state
  children?: React.ReactNode;       // parts composition
  // + the label props listed above
};

export type IGRPLayoutFullArgs = {
  children: React.ReactNode;
  config: IGRPConfigArgs;
  header?: React.ReactNode;
  sidebar?: React.ReactNode | null;
  toaster?: React.ReactNode | null;
  contentClassName?: string;
  defaultSidebarOpen?: boolean;
  // deprecated: showSidebar, headerSlots, breadcrumbs,
  // breadcrumbRouteLabels, rootProviderClassName
};
```

Delivered by template migrations `34-header-slots-and-app-search` and `91-layout-composition` — see
[Upgrading](MIGRATION_GUIDE.md).
