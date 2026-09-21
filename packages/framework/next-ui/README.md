# @igrp/framework-next-ui

Client-side UI shell for the IGRP Framework — the header, sidebar, navigation, auth chrome, providers and error surfaces that wrap every IGRP application.

Every export is a Client Component or a client hook. The package declares `'use client'` on its barrel, so a Server Component may render these, but a module that imports one is itself a client module.

## Requirements

Peer dependencies, as declared in `package.json`:

- **Node.js** >= 22
- **Next.js** ^15.5.0
- **React** ^19.0.0 + **react-dom** ^19.0.0
- **next-auth** ^4.24.0

---

## Installation

```bash
pnpm add @igrp/framework-next-ui
```

---

## What's included

The names below are the real exports. `src/index.ts` is the whole public surface, and it carries no wildcard re-exports by design.

### Providers

| Export                    | Purpose                                                                           |
| ------------------------- | --------------------------------------------------------------------------------- |
| `IGRPRootProvidersFull`   | Sidebar + header shell with `SidebarProvider` and the toaster — for the app shell |
| `IGRPRootProvidersBlank`  | Toaster only, no sidebar — for login/logout and other chrome-less routes          |
| `IGRPRootProviders`       | **Deprecated** alias of `IGRPRootProvidersFull`                                   |
| `IGRPNestedProviders`     | Session, tooltip, theme, active-theme and the session watcher, correctly nested   |
| `IGRPSessionProvider`     | NextAuth `SessionProvider` wrapper                                                |
| `IGRPThemeProvider`       | `next-themes` wrapper                                                             |
| `IGRPActiveThemeProvider` | Syncs the active CSS theme class (`theme-*`) and its cookie                       |
| `useIGRPThemeConfig`      | Reads/sets the active theme; throws outside `IGRPActiveThemeProvider`             |

### Template chrome

| Export                      | Purpose                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| `IGRPTemplateHeader`        | Application header — logo, breadcrumbs, search, notifications, user |
| `IGRPTemplateSidebar`       | Collapsible application sidebar                                     |
| `IGRPTemplateMenus`         | Menu tree renderer with an optional filter                          |
| `IGRPTemplateNavUser`       | User avatar + dropdown                                              |
| `IGRPTemplateAppSwitcher`   | Application switcher in the sidebar header                          |
| `IGRPTemplateBreadcrumbs`   | Route-aware breadcrumb trail, controlled or auto-derived            |
| `IGRPTemplateCommandSearch` | Command palette, opened with Cmd+K or Ctrl+K                        |
| `IGRPTemplateNotifications` | Notifications dropdown                                              |
| `IGRPTemplateThemeSelector` | Named-theme selector                                                |
| `IGRPTemplateModeSwitcher`  | Compact light/dark toggle                                           |
| `IGRPTemplateImage`         | `next/image` that survives an un-whitelisted host and falls back    |
| `IGRPTemplateLoading`       | Full-page loading state                                             |
| `IGRPTemplateNotFound`      | 404 screen                                                          |
| `IGRPSessionWatcher`        | Redirects on expiry and schedules the adaptive token refresh        |

### Auth components

| Export             | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `IGRPAuthCarousel` | Full-height auth carousel (login page wrapper) |
| `IGRPAuthForm`     | Login form with OAuth2 provider support        |

### Error surfaces

| Export                                       | Purpose                                                          |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `IGRPGlobalError`                            | Body of a root `global-error.tsx` — wrap it in your own `<html>` |
| `IGRPSegmentError`                           | Body of a segment `error.tsx`                                    |
| `IGRPLayoutErrorBoundary`                    | Class boundary for a layout slot, with a reset context           |
| `useIGRPLayoutErrorReset`                    | Clears that boundary's latched error                             |
| `useIGRPLayoutRetry`                         | `router.refresh()`, then clear the boundary once it settles      |
| `IGRPHeaderSkeleton` / `IGRPSidebarSkeleton` | Loading fallbacks for the chrome slots                           |
| `IGRPHeaderError` / `IGRPSidebarError`       | Retry fallbacks for the chrome slots                             |

### Permissions

| Export                   | Purpose                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| `IGRPSectionPermissions` | Seeds server claims into context and keeps them live from the session |
| `usePermissions`         | `isAllowed(name)`, plus the raw claims                                |
| `IGRPAuthorization`      | Renders children only when the permission(s) are held                 |
| `IGRPGuardPage`          | Page-level convenience guard; renders `IGRPForbidden` when denied     |
| `IGRPForbidden`          | 403 screen                                                            |
| `igrpIsAllowedBy`        | The shared decision function — **an empty list always denies**        |

> The authoritative page gate is the server-side `igrpAssertAuthorize` in `@igrp/framework-next`. Everything here is client-side rendering control, not a security boundary.

---

## Strings and locale

Default copy is **pt-PT**, exposed as overridable props. Each component that carries copy also exports its default catalog, so an override can start from it:

```tsx
import { IGRPTemplateSidebar } from '@igrp/framework-next-ui';

<IGRPTemplateSidebar
  data={sidebarData}
  menuLabels={{ searchPlaceholder: 'Search menus...', navAriaLabel: 'Main menu' }}
  navUserLabels={{ logout: 'Sign out' }}
/>;
```

Catalogs: `IGRP_MENU_LABELS_PT_PT`, `IGRP_NAV_USER_LABELS_PT_PT`, `IGRP_NOTIFICATIONS_LABELS_PT_PT`, `IGRP_COMMAND_SEARCH_LABELS_PT_PT`, `IGRP_MODE_SWITCHER_LABELS_PT_PT`, `IGRP_THEME_SELECTOR_LABELS_PT_PT`. The standalone screens (`IGRPForbidden`, `IGRPTemplateNotFound`, `IGRPGlobalError`, `IGRPSegmentError`) take individual label props instead.

`IGRPTemplateHeader` mounts most of this chrome, so it forwards each child's overrides: `navUserLabels`, `commandSearchLabels`, `notificationsLabels`, `modeSwitcherLabels`, `breadcrumbHomeLabel`, `breadcrumbEllipsisLabel` and `settingsLabel`.

`IGRPTemplateThemeSelector` also takes its option lists as props — `themes` and `scaledThemes`, defaulting to `IGRP_DEFAULT_THEMES` / `IGRP_SCALED_THEMES`. A `value` is the suffix of the `theme-*` class `IGRPActiveThemeProvider` sets on `<body>`, so it has to match a theme your CSS defines; pass `scaledThemes={[]}` to hide that group.

Placeholders like `{name}` and `{count}` are substituted with the design system's `igrpFormatMessage`. Do not switch these to `String.prototype.replace(string, string)` — it interprets `$&`, `` $` ``, `$'` and `$n` in the replacement, and both menu names (from the backend) and the search query (from the user) flow through here.

Timestamps are formatted with the design system's `useIGRPLocale()` — `pt-PT` unless an `IGRPI18nProvider` says otherwise — never the ambient runtime locale, which resolves to the server's under SSR and the browser's on the client and hydrates mismatched.

### Avoiding the theme flash

`IGRPActiveThemeProvider` applies the `theme-*` class in a layout effect, so it lands before the browser paints — but that is still after hydration. To remove the flash entirely, render the class on `<body>` from the server using the same cookie value you pass as `activeThemeValue`:

```tsx
import { igrpActiveThemeClassName, IGRP_ACTIVE_THEME_COOKIE } from '@igrp/framework-next-ui';

const theme = (await cookies()).get(IGRP_ACTIVE_THEME_COOKIE)?.value;
// <body className={igrpActiveThemeClassName(theme)}>
```

---

## Assets the consuming app must provide

The package publishes `dist` only, so these are a contract with your app's `public/` directory:

| Path                | Used by                            | Override                                |
| ------------------- | ---------------------------------- | --------------------------------------- |
| `/logo-no-text.png` | `IGRPTemplateHeader` logo fallback | `fallbackLogo` prop                     |
| `/error-img.webp`   | `IGRPGlobalError`                  | pass `children` to render your own body |

`basePath` is applied for you — pass app-relative paths.

---

## Usage

`templates/demo-v1` is the canonical wiring: read its `src/app/layout.tsx` and `src/app/(igrp)/layout.tsx` rather than copying a snippet from here, because the provider nesting and the server/client split both matter.

- Root layout composes `IGRPRootProvidersFull` (or `IGRPRootProvidersBlank` for chrome-less routes).
- The `(igrp)` group layout composes `IGRPNestedProviders` around `IGRPTemplateSidebar` + `IGRPTemplateHeader`.

---

## Build

```bash
# From repo root
pnpm build:next-ui

# From the package directory
pnpm build       # clean -> babel -> tsc --emitDeclarationOnly
pnpm typecheck
pnpm test
```

Built with **Babel** in a single pass over `src/` (TypeScript strip, JSX, React Compiler) — no bundler and no SWC step. `src/tokens.css` is copied verbatim; there is no Tailwind prebuild. Escape hatch when the React Compiler misbehaves: `pnpm build:without_reactcompiler`.

`src/__tests__/build-pipeline.test.ts` asserts that every eligible client module in `dist/` actually carries React Compiler output. A bailout is otherwise silent — the plugin emits the original code and the build stays green — which is how `IGRPAuthForm` lost memoization to a `try/catch/finally` the compiler cannot lower.

---

## CSS

This package ships a `tokens` entry that re-exports the design-system tokens (single source of truth — no duplicate variable definitions):

```css
@import '@igrp/framework-next-ui/tokens';
```

If your app already imports `@igrp/igrp-framework-react-design-system/tokens` directly (the pattern used by `templates/demo-v1`), you don't need this import. There is no `/styles` entry — prebuilt CSS bundles were removed because they cause cascade conflicts; apps compile Tailwind themselves and import tokens only.

---

## License

MIT © IGRP Labs
