# @igrp/framework-next-ui

Client-side UI shell for the IGRP Framework — the header, sidebar, navigation, auth chrome, providers and error surfaces that wrap every IGRP application.

The components and hooks are client code, but the barrel (`src/index.ts`) deliberately carries **no** `'use client'`: the directive sits on each leaf module, so a Server Component importing one export does not pull the whole package into its client bundle. Leaves without the directive — `IGRPBrandingStyle`, the branding helpers and the `IGRP_CHROME_STRINGS_*` catalogs — are server-safe. `src/__tests__/client-boundaries.test.ts` enforces both.

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

| Export                   | Purpose                                                                           |
| ------------------------ | --------------------------------------------------------------------------------- |
| `IGRPRootProvidersFull`  | Sidebar + header shell with `SidebarProvider` and the toaster — for the app shell |
| `IGRPRootProvidersBlank` | Toaster only, no sidebar — for login/logout and other chrome-less routes          |
| `IGRPRootProviders`      | **Deprecated** alias of `IGRPRootProvidersFull`                                   |
| `IGRPNestedProviders`    | Session, tooltip, theme, branding and the session watcher, correctly nested       |
| `IGRPSessionProvider`    | NextAuth `SessionProvider` wrapper                                                |
| `IGRPThemeProvider`      | `next-themes` wrapper                                                             |
| `IGRPBrandingProvider`   | Exposes the organization Brand to the chrome; `null` keeps every default          |
| `useIGRPBranding`        | The current Brand or `null`; never throws                                         |

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

### i18n (chrome catalog)

| Export                                                               | Purpose                                                                                                                            |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `IGRPChromeI18nProvider`                                             | `{ strings, children }` — supplies the chrome catalog. Mounted by `IGRPIntlProvider` (`@igrp/framework-next/i18n/client`)          |
| `useIGRPChromeI18n`                                                  | The catalog in effect; without a provider, the one for the `IGRP_LOCALE` cookie on the client, Portuguese on the server            |
| `igrpChromeStringsFor(tag)`                                          | Catalog for a locale or language tag (`fr`, `fr-FR`); anything unsupported → Portuguese. Never throws                              |
| `IGRP_CHROME_STRINGS_PT` / `_EN` / `_FR`                             | The catalogs (`IGRPChromeStrings`)                                                                                                 |
| `IGRP_LOCALE_COOKIE`                                                 | `'IGRP_LOCALE'`                                                                                                                    |
| `igrpResolveErrorCopy(error, { byCode, fallback }, custom?)`         | Error-screen `{ title, description }`: `custom` resolver (merged), then the catalog entry for the error's `IGRP_*` `code`, then `fallback` |
| `resolveMenuLabels(overrides?, base?)`                               | Merges partial menu labels over `base` (default `IGRP_MENU_LABELS_PT_PT`)                                                           |

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

Catalogs: `IGRP_MENU_LABELS_PT_PT`, `IGRP_NAV_USER_LABELS_PT_PT`, `IGRP_NOTIFICATIONS_LABELS_PT_PT`, `IGRP_COMMAND_SEARCH_LABELS_PT_PT`, `IGRP_MODE_SWITCHER_LABELS_PT_PT` — deprecated views into the pt chrome catalog `IGRP_CHROME_STRINGS_PT`, which ships alongside `IGRP_CHROME_STRINGS_EN` / `_FR` and is selected by `IGRPChromeI18nProvider` (mounted for you by `@igrp/framework-next`'s i18n). Props still win over the catalog. The standalone screens (`IGRPForbidden`, `IGRPTemplateNotFound`, `IGRPGlobalError`, `IGRPSegmentError`) take individual label props instead.

`IGRPTemplateHeader` mounts most of this chrome, so it forwards each child's overrides: `navUserLabels`, `commandSearchLabels`, `notificationsLabels`, `modeSwitcherLabels`, `breadcrumbHomeLabel`, `breadcrumbEllipsisLabel` and `settingsLabel`.

Placeholders like `{name}` and `{count}` are substituted with the design system's `igrpFormatMessage`. Do not switch these to `String.prototype.replace(string, string)` — it interprets `$&`, `` $` ``, `$'` and `$n` in the replacement, and both menu names (from the backend) and the search query (from the user) flow through here.

Timestamps are formatted with the design system's `useIGRPLocale()` — `pt-PT` unless an `IGRPI18nProvider` says otherwise — never the ambient runtime locale, which resolves to the server's under SSR and the browser's on the client and hydrates mismatched.

### Organization branding

`IGRPBrandingStyle` renders the Brand tokens as a hoisted `<style>` (`html:root` / `html.dark`), server-safe and before first paint. `igrpParseBranding` validates a stored Brand document and never throws; `igrpBrandingToCss` turns it into CSS text with a deterministic key order; `IGRP_BRANDING_CORE_TOKENS` lists the 50 tokens a Brand may override. `IGRPTemplateHeader` and `IGRPAuthForm` read the Brand logos through `useIGRPBranding`. The root layout in `@igrp/framework-next` wires all of this when `branding.enabled` is true. Preset themes (`IGRPTemplateThemeSelector`, `IGRPActiveThemeProvider`) were removed.

| Export                              | Purpose                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `igrpParseBranding(raw)`            | `string` → `IGRPBrandingParseResult`; never throws                      |
| `igrpBrandingToCss(branding)`       | `IGRPBranding \| null` → CSS text                                       |
| `IGRP_BRANDING_CORE_TOKENS`         | `IGRPBrandingTokenCatalogEntry[]` — `{ name, group }` per overridable token |
| `BRANDING_MAX_BYTES`                | Size cap for a Brand document (64 KiB)                                  |
| `isTokenName(name)`                 | `--lowercase-name` custom-property check                                |
| `isSafeCssValue(value)`             | One color (hex, keyword or color function), ≤128 chars, no `;{}<>@\`, `url(`, `expression(` |
| `isSafeLogoUrl(url)`                | `http(s)` URL without credentials or whitespace                         |

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

Apps don't usually compose these providers themselves: the server layouts in `@igrp/framework-next` do it, and `templates/demo-v1` (`src/app/layout.tsx`, `src/app/(igrp)/layout.tsx`) only renders those layouts. Read them rather than copying a snippet from here, because the provider nesting and the server/client split both matter.

- `IGRPRootLayout` (root layout) composes `IGRPNestedProviders` — session, tooltip, theme, branding, session watcher.
- `IGRPLayoutFull` (the `(igrp)` group layout) composes `IGRPRootProvidersFull`, filling its `sidebar` / `header` slots with `IGRPTemplateSidebar` + `IGRPTemplateHeader`; `IGRPLayoutBlank` composes `IGRPRootProvidersBlank` for chrome-less routes.

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
