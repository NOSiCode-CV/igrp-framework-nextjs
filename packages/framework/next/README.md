# @igrp/framework-next

Server-side entry point for the IGRP Framework — root and route-group layouts, the config builder, and the access-management API client.

## Requirements

- **Node.js** ≥ 22
- **Next.js** ^15.5.0
- **React** ^19.0.0 + **react-dom** ^19.0.0
- **zod** ^4.5.0 (peer)

---

## Installation

```bash
pnpm add @igrp/framework-next
```

---

## What's exported

### Layouts

| Export              | Entry | Purpose                                                                             |
| ------------------- | ----- | ----------------------------------------------------------------------------------- |
| `IGRPRootLayout`    | `.`   | Root-level server layout. Wraps `<html>` with theme + global providers.             |
| `IGRPLayoutFull`    | `.`   | Route-group server layout. Renders header + sidebar chrome around protected routes. |
| `IGRPLayoutBlank`   | `.`   | Route-group server layout without chrome (toaster only) — login/logout routes.      |
| `IGRPLayout`        | `.`   | **Deprecated** alias of `IGRPLayoutFull`; will be removed.                          |
| `IGRPGlobalLoading` | `.`   | Full-page loading indicator for `loading.tsx` files.                                |

#### `IGRPRootLayout` props

| Prop       | Type              | Required | Default   | Purpose                                                                 |
| ---------- | ----------------- | -------- | --------- | ----------------------------------------------------------------------- |
| `config`   | `IGRPConfigArgs`  | yes      | —         | Layout, session, API and sync configuration (from `igrpBuildConfig`).   |
| `children` | `React.ReactNode` | yes      | —         | The application tree.                                                   |
| `lang`     | `string`          | no       | see below | BCP-47 language written to the server-rendered `<html lang>` attribute. |

`lang` is optional. With `config.i18n` set it defaults to the resolved format locale (`pt-CV`, `en-GB`, …); without it, to the region of the `IGRP_LOCALE` cookie's language, else `'pt'`. An explicit `lang` always wins.

### Config builder

| Export                                | Entry | Purpose                                                                                          |
| ------------------------------------- | ----- | ------------------------------------------------------------------------------------------------ |
| `igrpBuildConfig`                     | `.`   | Validates and normalizes the full IGRP config: layout, API client, toaster, session.             |
| `igrpResolveLayoutDataSource(config)` | `.`   | Returns `config.layoutData`; throws `IgrpConfigError('IGRP_CONFIG_INVALID')` when it is missing. |

### Access-management API client

| Export                                                                | Entry | Purpose                                                                                                                                     |
| --------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `igrpGetAccessClient`                                                 | `.`   | Returns a pre-configured typed API client for the IGRP Access Management service.                                                           |
| `igrpGetAccessClientConfig`                                           | `.`   | Returns the raw config object used to construct the client.                                                                                 |
| `igrpBuildQueryString`                                                | `.`   | Type-safe query-string builder for access-management requests.                                                                              |
| `igrpResetAccessClient`                                               | `.`   | **Deprecated** — clears the per-request config only; use `igrpResetAccessClientConfig`.                                                     |
| `igrpSetAccessClientConfig(config)` / `igrpResetAccessClientConfig()` | `.`   | Write / clear the per-request (`AsyncLocalStorage`) store: `{ token, baseUrl, timeout?, locale? }` (`IGRPClientRuntimeConfig`).             |
| `igrpWithAccessClientConfig(partial, fn)`                             | `.`   | Runs `fn` with a copy of the store overridden by `partial`.                                                                                 |
| `igrpResolveDefaultTimeout(env?)`                                     | `.`   | Client timeout in ms: `IGRP_ACCESS_MANAGEMENT_TIMEOUT`, else 10000.                                                                         |
| `igrpEnsureAccessClientConfig()`                                      | `.`   | Seeds the store from the session cookie when empty — **call first in any Server Action or Route Handler**; `token === ''` means no session. |

### Permissions

Token-claims checks (server side). `@igrp/framework-next-ui`'s permission components are client-side rendering control only.

| Export                      | Entry | Purpose                                                                                                                    |
| --------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `igrpGetClaims()`           | `.`   | The request's `IGRPClaimsState` (`status: 'ok' \| 'error'`); a super-admin mock under auth bypass. Per-request `cache()`d. |
| `igrpAuthorize(name)`       | `.`   | `Promise<boolean>`, fail-closed. Use this in **Server Actions**.                                                           |
| `igrpAssertAuthorize(name)` | `.`   | **Pages only.** Missing permission → `forbidden()`; a claims decode error throws (5xx, not 403).                           |
| `isIgrpAuthBypass(env?)`    | `.`   | True when `IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none`.                                                                |

### Auth helpers

| Export                  | Entry | Purpose                                                                                                            |
| ----------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| `igrpDeleteAuthCookies` | `.`   | Clears THIS app's NextAuth session cookies on logout (current + pre-scoping names); never another co-hosted app's. |

### Organization branding

| Export                                                     | Entry | Purpose                                                                                                |
| ---------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------ |
| `igrpResolveRequestBranding(config)`                       | `.`   | The request's Brand, or `null` when `branding.enabled` is off, preview mode is on, or no Brand exists. |
| `igrpGetBranding({ baseUrl, token?, savedAt?, timeout? })` | `.`   | Cached Brand fetch (5 min TTL, stale-while-refresh); never fetches without `token`.                    |
| `igrpInvalidateBranding(baseUrl?)`                         | `.`   | Drops the cached Brand for `baseUrl`, or all of them.                                                  |
| `igrpBrandingMetadata(branding, fallbackIcon)`             | `.`   | `Metadata['icons']` from the Brand favicon, else `fallbackIcon`.                                       |
| `resolveBrandingToken(config)`                             | `.`   | The credential that reads the Brand (today: the session access token).                                 |
| `BRAND_FRESHNESS_COOKIE`                                   | `.`   | `'igrp_brand_v'` — a newer value forces a refetch.                                                     |

### Typed errors

| Export                                                                                      | Entry      | Purpose                                                |
| ------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------ |
| `IgrpError`, `IgrpConfigError`, `IgrpAuthConfigError`, `IgrpLayoutDataError`, `isIgrpError` | `./errors` | Typed error hierarchy for App Router error boundaries. |

### Other subpaths

| Entry         | Exports                                                                                                                                | Purpose                                                                                                                                                                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `./actions`   | `fetchMenusAction(appCode)`, `fetchCurrentUserAction()`, `fetchAppsByUserAction()`, `fetchAppByCodeAction(appCode)`, `ActionResult<T>` | `'use server'` actions returning `{ ok: true, data } \| { ok: false, error, code }` (show users the next-intl message `errors.actions.<code>`); refuse before any AM call when no session can be recovered. `revalidateMenusAction` / `revalidateAppsAction` are deprecated no-ops. |
| `./client`    | `useLayoutData(appCode)`                                                                                                               | Client hook: `{ refreshMenus, refreshApps, refreshUser }`, each a `router.refresh()` in a transition.                                                                                                                                                                               |
| `./logger`    | `logger.error(message, error?, meta?)`, `logger.warn(message, meta?)`, `logger.info(message, meta?)`                                   | Prefixed server-side console logger; stack traces in development only.                                                                                                                                                                                                              |
| `./app-error` | `AppError`, `parsePublicDigest`, `getDisplayableErrorMessage`, `PUBLIC_ERROR_DELIMITER`, `PublicErrorId`, `PublicErrorMessage`         | `new AppError({ error?, internalMessage?, publicMessage? })` carries a user-facing message through `error.digest`, which Next does not redact in production; `parsePublicDigest(error.digest)` recovers it in `error.tsx`.                                                          |

---

## Environment variables

Read directly by this package (everything else arrives through `igrpBuildConfig`):

| Variable                         | Read by                                                 | Purpose                                                               |
| -------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `IGRP_PREVIEW_MODE`              | `isIgrpAuthBypass`                                      | `true` → auth bypass.                                                 |
| `AUTH_PROVIDER`                  | `isIgrpAuthBypass`                                      | `none` → auth bypass.                                                 |
| `IGRP_ACCESS_MANAGEMENT_API`     | `igrpEnsureAccessClientConfig`, AM sync                 | AM base URL when the store has none (Server Actions, Route Handlers). |
| `IGRP_ACCESS_MANAGEMENT_TIMEOUT` | `igrpResolveDefaultTimeout`                             | AM client timeout in ms (default 10000).                              |
| `NEXTAUTH_SECRET`                | `igrpEnsureAccessClientConfig`                          | Decodes the session cookie to recover the access token.               |
| `NEXT_PUBLIC_BASE_PATH`          | `igrpEnsureAccessClientConfig`, `igrpDeleteAuthCookies` | Resolves the basePath-scoped auth cookie names.                       |
| `NODE_ENV`                       | `logger`, i18n fallback, AM sync                        | Development-only diagnostics.                                         |

---

## Usage

### Root layout

```tsx
// src/app/layout.tsx
import { IGRPRootLayout } from '@igrp/framework-next';
import { createConfig } from '@/igrp.template.config';
import { getLayoutConfig } from '@/lib/dal';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await createConfig(await getLayoutConfig());
  return <IGRPRootLayout config={config}>{children}</IGRPRootLayout>;
}
```

#### Localized document language

`<html lang>` is set on the first server-rendered response, never patched after hydration. With `config.i18n` (see `./i18n` below) the framework resolves the locale server-side (cookie or session preference, `Accept-Language`, default) and writes the format locale (`pt-CV`, `en-GB`, …); without i18n it follows the `IGRP_LOCALE` cookie, else `'pt'`. Pass `lang` only to override.

### i18n (`@igrp/framework-next/i18n`)

Five subpath entries, each a file-per-module leaf:

- `./i18n` — Edge-safe (middleware may import it): `igrpDefineI18n`, `igrpParseFormatLocales`, `igrpPickLocale`, `igrpSyncLocaleCookie`, the format helpers (`igrpFormatDate`, `igrpFormatNumber`, `igrpCompare`, …), `IGRP_LOCALES`, `IGRP_LOCALE_COOKIE`.
- `./i18n/server` — `server-only`: `igrpResolveLocale`, `igrpCreateRequestConfig` (for next-intl's `getRequestConfig`), `igrpSetLocale`, `igrpGetDesignSystemStrings`, `igrpGetChromeStrings`.
- `./i18n/client` — `IGRPIntlProvider` (mounted by `IGRPRootLayout`), `IGRPLocaleSwitcher` (`onChanged(locale, persisted)`), `useIGRPFormat` (`formatDate`, `formatDateTime`, `formatRelativeTime`, `formatNumber`, `compare`, all in the format locale and `i18n.timeZone`), `useIGRPLocaleInfo`.
- `./i18n/messages` — the generic `common`, `i18n` and `errors` namespaces in pt, en and fr, and `igrpMergeMessages`.
- `./i18n/testing` — `IGRPIntlTestProvider`, the same client context for tests.

Wire it with `igrpBuildConfig({ i18n: igrpDefineI18n({ defaultLocale: 'pt', … }) })`, a `src/i18n/request.ts` that passes `igrpCreateRequestConfig(i18n, catalogs)` to next-intl, and `createNextIntlPlugin` in `next.config.ts`. Without `config.i18n`, the root layout reads the `IGRP_LOCALE` cookie on the server and mounts the matching design-system and chrome catalogs (built-in strings, no app messages, no overrides); set `config.i18n` for the full setup.

### IGRP layout

```tsx
// src/app/(igrp)/layout.tsx
import { IGRPLayoutFull } from '@igrp/framework-next';
import { createConfig } from '@/igrp.template.config';
import { getLayoutConfig } from '@/lib/dal';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const config = await createConfig(await getLayoutConfig());
  return <IGRPLayoutFull config={config}>{children}</IGRPLayoutFull>;
}
```

`IGRPLayout` still works but is a deprecated alias of `IGRPLayoutFull`.

### Config builder

```ts
// src/igrp.template.config.ts
import { igrpBuildConfig } from '@igrp/framework-next';
import type { IGRPConfigClient } from '@igrp/framework-next-types';
import { cache } from 'react';
import { isAuthBypass } from '@/lib/utilities';
import { getPackageJson } from './lib/config/get-pkj';

export const createConfig: IGRPConfigClient = cache(async (layout) =>
  igrpBuildConfig({
    appCode: process.env.IGRP_APP_CODE || '',
    previewMode: isAuthBypass(),
    syncAccess: process.env.IGRP_SYNC_ACCESS === 'true',
    appInformation: getPackageJson(),
    layout,
    // Required: async getters for header and sidebar data (yours; demo-v1 returns mocks under isAuthBypass()).
    layoutData: { getHeaderData, getSidebarData },
    toasterConfig: { showToaster: true, position: 'bottom-right' },
    // apiManagementConfig (required unless previewMode), sessionArgs, i18n, branding ...
  }),
);
```

`igrpBuildConfig` validates the config (with `previewMode` it no longer requires the Access Management settings) and upper-cases `appCode`; it does not read the environment or swap any data. Preview mode is the template's job: `demo-v1` passes `previewMode: isAuthBypass()` and, under the same check, supplies mock user, menus and apps through `layoutData` — no auth or API backend needed.

### Typed errors

```ts
import { IgrpAuthConfigError, isIgrpError } from '@igrp/framework-next/errors';

export function describeError(error: unknown) {
  if (error instanceof IgrpAuthConfigError) return 'auth misconfigured';
  if (isIgrpError(error)) return error.code;
  return 'unexpected';
}
```

---

## Preview mode

Set `IGRP_PREVIEW_MODE=true` to run the template without authentication or an API backend. Mock data replaces live API calls; no redirects to `/login`.

See [`IGRP_PREVIEW_MODE` docs](../../../.claude/shared/preview-mode.md) in the monorepo.

---

## Build

```bash
# From repo root
pnpm build:next

# From package directory
pnpm build
```

Built with **Babel** in a single pass over `src/` (TypeScript strip, JSX, React Compiler). Escape hatch: `pnpm build:without_reactcompiler`.

---

## Position in the framework

This is the **top** of the dependency chain — it depends on all other framework packages but no other framework package depends on it:

```
framework-next-auth → framework-next-types → design-system → framework-next-ui → framework-next
```

Changes here affect only templates and apps, not other framework packages.

---

## License

MIT © IGRP Labs
