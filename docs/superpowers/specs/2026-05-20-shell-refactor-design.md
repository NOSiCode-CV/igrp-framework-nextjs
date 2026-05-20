# Shell Refactor + Best-Practices Hardening

**Date:** 2026-05-20  
**Packages touched:** `framework/next-ui`, `framework/next`, `framework-next-types`, `templates/demo-legacy`  
**Scope decision:** All three packages in a coordinated release, preceded by a standalone critical-bug patch.

---

## Background

A multi-skill review (Vercel React Best Practices, Composition Patterns, Next.js Best Practices, shadcn/ui, Web Interface Guidelines) across `packages/framework/next`, `packages/framework/next-ui`, and `templates/demo-legacy` surfaced 25 issues. This spec covers the full remediation in two phases.

---

## Phase 1 — Critical Bug Fixes (standalone PR, ships first)

Four surgical changes to `packages/framework/next`. No API surface changes. One patch release.

| # | File | Problem | Fix |
|---|---|---|---|
| 1 | `lib/startup-sync.ts` | Module-level mutable `syncPromise` — undefined behavior under concurrent RSC requests | Replace with `after()` from `next/server`; sync runs post-response, no shared mutable state |
| 2 | `hooks/use-menus.ts`, `hooks/use-applications.ts` | Module-level `Map` caches (`_menuCaches`, `_appByCodeCaches`) grow without bound on long-running servers | Replace with an LRU cache (max 50 entries) |
| 3 | `layouts/igrp-root-layout.tsx` | `igrpStartupSync()` called fire-and-forget during render — blocks streaming, accumulates state | Move into `after()` so it runs post-response |
| 4 | `lib/delete-auth-cookies.ts`, `actions/igrp/layout.ts` | `cookies()` not awaited — throws at runtime in Next.js 15 production | Await all `cookies()` calls |

**Changeset:** `patch` on `@igrp/framework-next`.

---

## Phase 2 — Architectural Refactor

### 2.1 New Shell Component API

#### `framework/next-ui` — two provider variants

**`IGRPRootProvidersFull`** replaces `IGRPRootProviders` for the full-chrome layout:

```tsx
type IGRPRootProvidersFullProps = {
  sidebar: React.ReactNode   // pre-rendered server slot
  header: React.ReactNode    // pre-rendered server slot
  defaultOpen?: boolean
  toasterConfig?: IGRPConfigArgs['toasterConfig']
  children: React.ReactNode
  className?: string
}
```

No `showSidebar` / `showHeader` booleans. Omitting the sidebar slot is not an option — use `IGRPLayoutBlank` instead.

**`IGRPRootProvidersBlank`** for chrome-free layout:

```tsx
type IGRPRootProvidersBlankProps = {
  toasterConfig?: IGRPConfigArgs['toasterConfig']
  children: React.ReactNode
  className?: string
}
```

Wraps children with Toaster + provider context only. No sidebar, no header, no SidebarProvider.

**`IGRPRootProviders`** — kept as a deprecated re-export of `IGRPRootProvidersFull` for one release cycle, then removed.

#### `framework/next` — two layout variants

**`IGRPLayoutFull`** (async server component):

```tsx
type IGRPLayoutFullProps = {
  config: IGRPConfigArgs
  children: React.ReactNode
}
```

Internally creates Suspense-wrapped `<SidebarDataProvider>` and `<HeaderDataProvider>` server slots, then passes them to `IGRPRootProvidersFull`. Always renders full chrome — no conditional logic, no flags.

**`IGRPLayoutBlank`** (async server component):

```tsx
type IGRPLayoutBlankProps = {
  config: IGRPConfigArgs
  children: React.ReactNode
}
```

Wraps children in `IGRPRootProvidersBlank` with toaster config. No data providers needed.

**`IGRPLayout`** — kept as a deprecated re-export of `IGRPLayoutFull` for one release cycle, then removed.

---

### 2.2 `IGRPConfigArgs` Cleanup (`framework-next-types`)

Remove `showSidebar?: boolean` and `showHeader?: boolean` from `IGRPConfigArgs` and from `igrpBuildConfig()` validation. These fields are made obsolete by the variant approach — the template chooses the layout variant in code, not through config flags.

`igrpBuildConfig()` retains: `toasterConfig`, `sessionArgs`, `activeThemeValue`, API config, preview-mode branching, mock data callbacks, `appCode`, `basePath`.

**Changeset:** `patch` on `@igrp/framework-next-types` and `@igrp/framework-next`.

---

### 2.3 `IGRPNestedProviders` Cleanup (`framework/next-ui`)

Remove dead `themeArgs?: React.ComponentProps<typeof IGRPThemeProvider>` prop. The ThemeProvider config (`attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`) is intentionally hardcoded — the IGRP theme system is opinionated and `.dark` class cascade is load-bearing.

---

### 2.4 `menus.tsx` File Split (`framework/next-ui`)

The 333-line `menus.tsx` bundles tree-building logic and four private sub-components. New structure:

```
src/components/templates/menus/
  index.ts                  ← re-exports IGRPTemplateMenus (import path unchanged)
  menus.tsx                 ← IGRPTemplateMenus public component (~80 lines)
  leaf-menu-item.tsx        ← LeafMenuItem
  folder-menu-item.tsx      ← FolderMenuItem
  sub-leaf-link.tsx         ← SubLeafLink
  section-group.tsx         ← SectionGroup
  utils.ts                  ← buildMenuSections(), resolveHref(), resolveAnchorTag()
```

Public import path `IGRPTemplateMenus` from `@igrp/framework-next-ui` is unchanged.

---

### 2.5 `breadcrumbs.tsx` Extraction (`framework/next-ui`)

Extract ResizeObserver overflow detection into `use-breadcrumb-overflow.ts`:

```tsx
function useBreadcrumbOverflow(ref: RefObject<HTMLElement>): boolean
```

Uses ResizeObserver + `requestAnimationFrame` debounce to prevent layout thrashing on resize. `breadcrumbs.tsx` drops from 243 to ~150 lines.

---

### 2.6 `session-watcher.tsx` Fix (`framework/next-ui`)

Two changes:

1. **Render `null` during `'loading'` status** — avoids flash of protected content before auth resolves. Session cookie is read near-synchronously from the SessionProvider context, so the blank window is sub-frame on repeat visits.

2. **`callbackUrl` on redirect** — uses `window.location.pathname + search` in the effect (client-only, no Suspense boundary required):

```tsx
if (status === 'unauthenticated') {
  const currentPath = window.location.pathname + window.location.search;
  const target =
    currentPath && currentPath !== '/'
      ? `/login?callbackUrl=${encodeURIComponent(currentPath)}`
      : '/login';
  router.push(target);
}
```

> **Status:** `session-watcher.tsx` already updated in this branch (callbackUrl + null-during-loading).

---

### 2.7 `IGRPGlobalError` Semantic Colors (`framework/next-ui`)

Replace hardcoded color classes with semantic tokens:

| Before | After |
|---|---|
| `text-gray-900` | `text-foreground` |
| `dark:text-gray-300` | removed (token handles dark mode) |
| `text-gray-500` | `text-muted-foreground` |

Applies to `errors/global.tsx` only. `errors/segment.tsx` already uses semantic tokens.

---

### 2.8 `demo-legacy` Migration

1. Replace `IGRPLayout` with `IGRPLayoutFull` in `src/app/(igrp)/layout.tsx`.
2. Remove `showSidebar: true` and `showHeader: true` from `src/igrp.template.config.ts` (fields removed from `IGRPConfigArgs`).
3. No other layout changes — `IGRPRootLayout` and provider chain are unchanged.

---

### 2.9 `callbackUrl` on All Login Redirects (already implemented)

Every redirect-to-`/login` path now appends `?callbackUrl=<current-path>` so the user is returned to their original destination after successful login. The login page already reads and uses `callbackUrl` via `signIn(providerId, { callbackUrl })`.

**Implementation strategy:** Middleware injects an `x-current-path` request header on every passing response. Server components and hooks read it via `headers()`. Client-side (`session-watcher`) uses `window.location`.

| File | Method | Status |
|---|---|---|
| `middleware.ts` | `request.nextUrl.pathname + search` → `loginUrl.searchParams.set('callbackUrl', ...)` + `x-current-path` header injection | ✅ Done |
| `lib/dal.ts` | `headers().get('x-current-path')` | ✅ Done |
| `hooks/use-user.ts` | `headers().get('x-current-path')` | ✅ Done |
| `hooks/use-menus.ts` | `headers().get('x-current-path')` | ✅ Done |
| `hooks/use-applications.ts` (×2) | `headers().get('x-current-path')` | ✅ Done |
| `session-watcher.tsx` | `window.location.pathname + search` | ✅ Done |
| `logout/page.tsx` (×3) | Intentionally unchanged — after logout, redirect to bare `/login` | ✅ Correct |

---

## Additional Quality Fixes (bundled with Phase 2)

These are lower-severity items from the review register, fixed in the same Phase 2 PR:

| # | File | Fix |
|---|---|---|
| 17 | `client/use-layout-data.ts` | Wrap `refreshMenus`, `refreshApps`, `refreshUser` in `useCallback`; use `useTransition` so refresh is non-blocking |
| 19 | `layouts/igrp-layout.tsx` | Wrap `IGRPGlobalLoading` in an error boundary so fetch failures don't propagate uncaught |
| 15 | `templates/nav-user.tsx` | Investigate and fix root cause of `hover:text-primary-foreground!` override |
| 21 | `config/error-messages.ts` | Replace `...` with `…` (proper ellipsis) in Portuguese copy |
| 23 | `app/(auth)/logout/page.tsx` | Add visible loading feedback during async logout (spinner or status text) |

---

## Changeset Plan

| Package | Change | Type |
|---|---|---|
| `@igrp/framework-next` | Phase 1 critical fixes | `patch` |
| `@igrp/framework-next-types` | Remove `showSidebar`/`showHeader` from `IGRPConfigArgs` | `patch` |
| `@igrp/framework-next-ui` | New variant providers, menus split, session-watcher, breadcrumbs hook, global-error colors, `themeArgs` removal | `patch` |
| `@igrp/framework-next` | New `IGRPLayoutFull`/`IGRPLayoutBlank`, deprecated `IGRPLayout` re-export, `use-layout-data` fixes | `patch` |

Build order: `framework-next-types` → `framework-next-ui` → `framework-next` → verify `demo-legacy` compiles.

---

## Out of Scope

- `framework-next-auth` changes — `getLoginRedirectUrl()` not modified; template middleware constructs the login URL directly.
- `design-system` changes — no DS component API changes in this effort.
- Adding `generateMetadata` to layouts — separate SEO initiative.
- `system-settings` deep-link URL state — separate UX initiative.
- Removing deprecated `IGRPLayout` / `IGRPRootProviders` re-exports — happens in the following release after consumers have had one cycle to migrate.
