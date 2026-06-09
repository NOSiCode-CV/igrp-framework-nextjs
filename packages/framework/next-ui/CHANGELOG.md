# @igrp/framework-next-ui

## 0.1.0-beta.147

### Patch Changes

- Updated dependencies [4e0137a]
  - @igrp/framework-next-auth@0.1.0-beta.139
  - @igrp/framework-next-types@0.1.0-beta.141

## 0.1.0-beta.146

### Patch Changes

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.138
  - @igrp/framework-next-types@0.1.0-beta.140

## 0.1.0-beta.145

### Patch Changes

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.137
  - @igrp/framework-next-types@0.1.0-beta.139

## 0.1.0-beta.144

### Patch Changes

- Updated dependencies [0eb0323]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.135

## 0.1.0-beta.143

### Patch Changes

- Updated dependencies [7a89144]
  - @igrp/framework-next-auth@0.1.0-beta.136
  - @igrp/framework-next-types@0.1.0-beta.138

## 0.1.0-beta.142

### Patch Changes

- 6b42572: - Coordinated maintenance release: bump all framework packages to the next beta to keep versions aligned across the framework.
- Updated dependencies [6b42572]
  - @igrp/framework-next-auth@0.1.0-beta.135
  - @igrp/framework-next-types@0.1.0-beta.137
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.134

## 0.1.0-beta.141

### Patch Changes

- Updated dependencies [1829701]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.133

## 0.1.0-beta.140

### Patch Changes

- 7fb20b6: Fix sidebar menu active highlighting: submenu items inside FOLDER menus (collapsible and dropdown variants) now reflect the current route via `isActive`. Extract a shared `isItemActive` helper, thread `pathname` through `FolderMenuItem`/`SubLeafLink`, auto-open the collapsible and mark the folder trigger active when a child matches the current path.

  Also strengthen the selected-item treatment: the active menu item now renders with a soft brand tint, clearly distinct from the faint `sidebar-accent` hover wash. The treatment is driven by the dedicated `--sidebar-active` / `--sidebar-active-foreground` design-system tokens (so integrators can recolor the highlight from their app CSS) and centralized in a shared `ACTIVE_MENU_ITEM_CLASS` constant using semantic tokens only. Also fixes the active FOLDER trigger losing its highlight on hover — the DS primitive's `data-[state=open]:hover:bg-sidebar-accent` was overriding the active styling; a higher-specificity `data-[active=true]:data-[state=open]:hover:` rule now holds it.

- Updated dependencies [62faea7]
- Updated dependencies [773b8b0]
- Updated dependencies [b88c4b1]
- Updated dependencies [b88c4b1]
- Updated dependencies [ba91edb]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.132
  - @igrp/framework-next-auth@0.1.0-beta.134
  - @igrp/framework-next-types@0.1.0-beta.136

## 0.1.0-beta.139

### Patch Changes

- ec48e46: `IGRPSessionWatcher` no longer returns `null` on every `useSession` refetch. NextAuth briefly flips status to `'loading'` after `signOut`, on focus refetch, and on every polling interval; returning `null` there unmounted the whole subtree and forced child components to re-run their mount effects from scratch. The visible symptom was `/logout` running `signOut` twice and stalling on its loading template because the in-flight effect closure was racing the remount. The watcher now only renders `null` during the genuine initial probe (status `'loading'` AND no session data yet), which is the only state SSR can't already populate.
- Updated dependencies [48d2818]
- Updated dependencies [48dd45c]
- Updated dependencies [3377f52]
- Updated dependencies [db24347]
- Updated dependencies [c412311]
- Updated dependencies [55b7077]
- Updated dependencies [f89e1ab]
- Updated dependencies [ec48e46]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.131
  - @igrp/framework-next-auth@0.1.0-beta.133
  - @igrp/framework-next-types@0.1.0-beta.135

## 0.1.0-beta.138

### Patch Changes

- 12cc11b: fix(session-watcher): route to `/logout` when the session carries a failed-refresh error

  After a failed token refresh the session cookie still decodes, so `useSession().status` stays `authenticated` even though the access token is dead. `IGRPSessionWatcher` previously only reacted to `status === 'unauthenticated'`, so it ignored this state — the broken session stayed mounted and the next access-token-bearing request 401'd into the global error boundary.

  The watcher now also inspects `session.error`: when it equals `'RefreshAccessTokenError'` it navigates to `/logout` for a clean IdP single-logout (consistent with the server-side `onSessionExpired` contract). The existing auth-chrome skip (`/login*`, `/logout*`) still applies, so this can't loop.

- Updated dependencies [2a06c02]
- Updated dependencies [12cc11b]
- Updated dependencies [12cc11b]
- Updated dependencies [0cdef39]
- Updated dependencies [12cc11b]
- Updated dependencies [cc40fef]
- Updated dependencies [a1fbb7c]
- Updated dependencies [cc40fef]
- Updated dependencies [123e361]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.130
  - @igrp/framework-next-auth@0.1.0-beta.132
  - @igrp/framework-next-types@0.1.0-beta.134

## 0.1.0-beta.137

### Patch Changes

- 1d4a0b7: - Prepend `NEXT_PUBLIC_BASE_PATH` to the error image in `IGRPGlobalError` so the asset resolves correctly when the app is hosted under a base path.

## 0.1.0-beta.136

### Patch Changes

- b9c286f: fix: prepend NEXT_PUBLIC_BASE_PATH to auth carousel and login form images

  When basePath is configured, IGRPAuthCarousel and IGRPAuthForm passed
  consumer-provided image paths to next/image as-is. The optimizer fetched
  them without the basePath prefix, causing 404s on `/login` for images
  referenced by absolute root paths (e.g. `/logo-no-text.png`). The src
  values are now resolved through an idempotent basePath prefixer so
  consumers can keep passing raw `/foo.png` paths and existing already-
  prefixed paths are not double-prefixed.

- 2a0ef32: fix(session-watcher): don't push to /login when already on the auth UI

  `IGRPSessionWatcher` is mounted globally via `IGRPNestedProviders`, so it runs on every route — including `/login` and `/logout`. Previously, an unauthenticated state on `/login` triggered `router.push('/login?callbackUrl=<window.location.href>')`, which:
  - created a self-referential URL (`/login?callbackUrl=/apps/template/login`),
  - overwrote any legitimate `callbackUrl` set by middleware (e.g. `/dashboard`) with `/login`, so post-sign-in always landed on `/` regardless of intended target.

  The watcher now strips the configured `NEXT_PUBLIC_BASE_PATH` from `window.location.pathname` and skips the push when the path matches the auth chrome routes (`/login*`, `/logout*`). Genuine session-expiry on protected routes still triggers the push as before.

- Updated dependencies [2a0ef32]
- Updated dependencies [2196ef8]
  - @igrp/framework-next-auth@0.1.0-beta.131
  - @igrp/framework-next-types@0.1.0-beta.133

## 0.1.0-beta.135

### Patch Changes

- 73b0e36: fix: prepend NEXT_PUBLIC_BASE_PATH to fallback logo src in header

  When basePath is configured, the Next.js image optimizer fetches the source
  image internally without the basePath prefix, causing a 500 error for local
  public-folder images. The fallback src now reads NEXT_PUBLIC_BASE_PATH so the
  optimizer resolves the correct path.

## 0.1.0-beta.134

### Patch Changes

- 3cbddca: fix: replace fill with explicit dimensions on header logo image

  The `fill` prop on the logo `<Image>` caused it to be invisible when
  combined with a flex parent. Replaced with explicit `width={40} height={40}`
  and added `overflow-hidden` to the container for correct rounded-corner clipping.

## 0.1.0-beta.133

### Patch Changes

- 819f3b4: fix: header fails to load when showSidebar is false in IGRPLayoutFull

  `IGRPTemplateNavUser` calls `useIGRPSidebar()` unconditionally, which throws when
  no `SidebarProvider` is present. `IGRPRootProvidersFull` now always wraps with
  `SidebarProvider` regardless of whether the sidebar slot is provided, so the header
  renders correctly when `showSidebar={false}`.

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.130
  - @igrp/framework-next-types@0.1.0-beta.132

## 0.1.0-beta.132

### Patch Changes

- 56b14c3: Add `showSidebar` prop to `IGRPLayoutFull` to render header-only chrome without a sidebar.

  `IGRPRootProvidersFull` now accepts `sidebar` as optional — when absent, skips `SidebarProvider`/`SidebarInset` and renders a plain flex-column layout instead, avoiding sidebar CSS offsets.

## 0.1.0-beta.131

### Patch Changes

- f8dc318: feat: add IGRPRootProvidersFull/Blank, split menus, fix global error colors, extract breadcrumb hook, remove themeArgs
- Updated dependencies [f8dc318]
  - @igrp/framework-next-types@0.1.0-beta.131

## 0.1.0-beta.130

### Patch Changes

- 776aac2: Fix derived-state anti-pattern in app-switcher; bind notification unread count to prop; add unstable_rethrow to error boundaries; add i18n label props to error components; expose commands prop on command search
- Updated dependencies [ac94a9c]
- Updated dependencies [a4ef1fe]
- Updated dependencies [9a0dd9b]
- Updated dependencies [9f9ee3d]
- Updated dependencies [72268fd]
- Updated dependencies [ba86302]
- Updated dependencies [f283926]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.129
  - @igrp/framework-next-auth@0.1.0-beta.129
  - @igrp/framework-next-types@0.1.0-beta.130

## 0.1.0-beta.129

### Patch Changes

- fe2ed3d: - Update `@types/node` to v25.7.0 across all framework packages
  - Bump `typescript-eslint` and `vitest` to latest versions
- Updated dependencies [fe2ed3d]
  - @igrp/framework-next-auth@0.1.0-beta.128
  - @igrp/framework-next-types@0.1.0-beta.129
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.128

## 0.1.0-beta.128

### Patch Changes

- 420c647: fix(breadcrumbs): fix key collision and missing isMobile effect dep; add formatLabel prop for dynamic segments
- 66a4bc3: feat(breadcrumbs): controlled-first architecture with useSelectedLayoutSegments fallback

  IGRPTemplateBreadcrumbs now accepts `items?: BreadcrumbItem[]` for server-resolved labels (dynamic routes, user names, etc.) and `routeLabels?: Record<string, string>` as a shared config for static routes. When `items` is not provided, auto-derive mode uses `useSelectedLayoutSegments()` instead of `usePathname()` — route-context aware and handles parallel routes and route groups correctly.

  IGRPTemplateHeader gains `breadcrumbs` and `breadcrumbRouteLabels` props that forward to the breadcrumb component. IGRPLayout (framework-next) accepts and threads the same props through HeaderDataProvider to the header, enabling server layouts to inject pre-resolved items at any nesting level.

  `BreadcrumbItem` is now exported from `@igrp/framework-next-ui` for server component type annotations.

  Breaking: `customLabels` prop removed — migrate to `routeLabels` (full-href keys) and `formatLabel` (segment escape hatch).

- Updated dependencies [4e9ecd5]
  - @igrp/framework-next-auth@0.1.0-beta.127
  - @igrp/framework-next-types@0.1.0-beta.128

## 0.1.0-beta.123

### Patch Changes

- Updated dependencies [939446a]
  - @igrp/framework-next-auth@0.1.0-beta.120
  - @igrp/framework-next-types@0.1.0-beta.120

## 0.1.0-beta.122

### Patch Changes

- ef2342d: Add IGRPLayoutErrorBoundary, IGRPHeaderSkeleton, IGRPSidebarSkeleton, IGRPHeaderError, IGRPSidebarError components for streaming layout; export IGRPTemplateSidebar; IGRPRootProviders now accepts sidebar/header ReactNode slot props.

## 0.1.0-beta.121

### Patch Changes

- Fix header logo visibility and add dark-mode logo support in auth form.

  **Header logo (`IGRPTemplateHeader`):** `showIGRPHeaderLogo` and `showIGRPHeaderTitle` were inside a `!showIGRPSidebarTrigger` branch, making them silently ineffective whenever the sidebar trigger was enabled. They are now independent controls — the logo and title render based on their own flags regardless of whether the sidebar trigger is shown.

  **Dark-mode logo (`IGRPAuthForm`):** `IGRPSiteLogo` now accepts an optional `srcDark` field. When provided, the light logo is hidden in dark mode (`dark:hidden`) and the dark logo is shown (`hidden dark:block`), using CSS only — no JavaScript theme detection required, no hydration mismatch.

## 0.1.0-beta.120

### Patch Changes

- Updated dependencies [20a0850]
- Updated dependencies [2137c48]
  - @igrp/framework-next-auth@0.1.0-beta.119
  - @igrp/framework-next-types@0.1.0-beta.119

## 0.1.0-beta.119

### Patch Changes

- Rename provider ID from `oauth2` to `igrp-auth`.

  **Breaking changes:**
  - `AUTH_PROVIDER` now accepts `igrp-auth` or `none` only (`oauth2` is removed)
  - `AUTH_PROVIDER` defaults to `igrp-auth`
  - `OAUTH2_CLIENT_ID`, `OAUTH2_CLIENT_SECRET`, `OAUTH2_ISSUER`, `OAUTH2_SCOPES` env vars renamed to `IGRP_AUTH_CLIENT_ID`, `IGRP_AUTH_CLIENT_SECRET`, `IGRP_AUTH_ISSUER`, `IGRP_AUTH_SCOPES`
  - `OAUTH2_PROVIDER_ID` named export renamed to `IGRP_AUTH_PROVIDER_ID`
  - `AUTH_PROVIDER_IDS.OAUTH2` key renamed to `AUTH_PROVIDER_IDS.IGRP_AUTH`
  - NextAuth callback URL changes from `/api/auth/callback/oauth2` → `/api/auth/callback/igrp-auth`

  **Migration:** Update your `.env` file — replace `AUTH_PROVIDER=oauth2` with `AUTH_PROVIDER=igrp-auth`, and rename all `OAUTH2_*` vars to `IGRP_AUTH_*`. Re-register the redirect URI on your authorization server as `{NEXTAUTH_URL}/api/auth/callback/igrp-auth`.

- Updated dependencies
- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.118
  - @igrp/framework-next-types@0.1.0-beta.118

## 0.1.0-beta.118

### Patch Changes

- 5ec3586: Fix: update auth form to use OAUTH2_PROVIDER_ID after Keycloak provider removal in next-auth.
- Updated dependencies [724398a]
  - @igrp/framework-next-auth@1.0.0-beta.117
  - @igrp/framework-next-types@0.1.0-beta.117

## 0.1.0-beta.117

### Patch Changes

- f594936: refactor(menus): rewrite IGRPTemplateMenus with tree-builder + type-dispatch renderer; fix isActive false-positive, filter INACTIVE items, handle SYSTEM_PAGE

## 0.1.0-beta.116

### Patch Changes

- beta.116 — template migrator CLI, lock file relocation, and release tooling fixes.

  @igrp/template-migrator
  - New CLI package that automates IGRP template upgrades via `pnpm dlx @igrp/template-migrator@latest`.
  - Bundles all 6 demo-legacy migration guides (01–06) as a cumulative manifest with embedded payloads.
  - Commands: status, plan, apply (--yes / --to), list, rollback, check (CI gate).
  - Lock file moved from root `.igrpmigrations.lock.json` → `.igrpmigrations/lock.json`; backward-compat read of old path on first run.
  - Prebuild pack script cleans payload output on every run to prevent stale files.
  - tsup config: shims disabled (no \_\_dirname polyfill injection before shebang), banner removed (shebang lives in src/cli.ts line 1).

  @igrp/framework-next-template (templates/demo-legacy)
  - `.igrpmigrations/lock.json` pre-seeded to mark all 6 migrations as applied.
  - `create-zip-template.ps1` updated to strip migration guides and payloads from the published zip — only `lock.json` is included so consumers start fully up-to-date.
  - `MIGRATING.md` added: end-user upgrade guide (status → plan → apply workflow).

- Updated dependencies
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.116
  - @igrp/framework-next-auth@0.1.0-beta.116
  - @igrp/framework-next-types@0.1.0-beta.116

## 0.1.0-beta.115

### Patch Changes

- Edge-safe auth refactor + App Router error-handling overhaul.

  @igrp/framework-next-auth
  - Split withIGRPAuth() into Edge-safe shell + lazy Node helpers; next-auth (main) and next/headers are no longer static imports. Fixes TypeError reading 'custom' from openid-client leaking into the Edge middleware bundle under Next.js 15.5.15.
  - interopDefault() helper normalizes CJS/ESM default-import mismatch against next-auth v4 (KeycloakProvider, NextAuth).
  - tsup is now the single producer of dist/; added ./oidc and ./providers subpath exports; trimmed root barrel to Edge-safe modules only.
  - Tolerates AUTH_PROVIDER=none by returning a stub instance (404 on auth routes) instead of crashing NextAuth with an empty providers array.

  @igrp/framework-next
  - New ./errors subpath with typed IgrpError hierarchy (IgrpConfigError, IgrpAuthConfigError, IgrpLayoutDataError) and isIgrpError structural guard — designed to survive production error.message redaction via stable error.name.
  - Access-management config validation moved from IGRPLayout into igrpBuildConfig so throws fire at root-segment render where global-error.tsx can catch them.
  - IGRPLayout and fetchLayoutData now throw typed errors instead of raw Error.

  @igrp/framework-next-ui
  - New IGRPSegmentError component for segment-level error.tsx boundaries — renders inside layout chrome, offers reset + go-home actions, accepts resolveCopy(error) for i18n.

  @igrp/framework-next-template (templates/demo-legacy)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-legacy/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

- Updated dependencies
  - @igrp/framework-next-types@0.1.0-beta.115
  - @igrp/framework-next-auth@0.1.0-beta.115
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.115

## 0.1.0-beta.114

### Patch Changes

- Edge-safe auth refactor + App Router error-handling overhaul.

  @igrp/framework-next-auth
  - Split withIGRPAuth() into Edge-safe shell + lazy Node helpers; next-auth (main) and next/headers are no longer static imports. Fixes TypeError reading 'custom' from openid-client leaking into the Edge middleware bundle under Next.js 15.5.15.
  - interopDefault() helper normalizes CJS/ESM default-import mismatch against next-auth v4 (KeycloakProvider, NextAuth).
  - tsup is now the single producer of dist/; added ./oidc and ./providers subpath exports; trimmed root barrel to Edge-safe modules only.
  - Tolerates AUTH_PROVIDER=none by returning a stub instance (404 on auth routes) instead of crashing NextAuth with an empty providers array.

  @igrp/framework-next
  - New ./errors subpath with typed IgrpError hierarchy (IgrpConfigError, IgrpAuthConfigError, IgrpLayoutDataError) and isIgrpError structural guard — designed to survive production error.message redaction via stable error.name.
  - Access-management config validation moved from IGRPLayout into igrpBuildConfig so throws fire at root-segment render where global-error.tsx can catch them.
  - IGRPLayout and fetchLayoutData now throw typed errors instead of raw Error.

  @igrp/framework-next-ui
  - New IGRPSegmentError component for segment-level error.tsx boundaries — renders inside layout chrome, offers reset + go-home actions, accepts resolveCopy(error) for i18n.

  @igrp/framework-next-template (templates/demo-legacy)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-legacy/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

- Updated dependencies
  - @igrp/framework-next-types@0.1.0-beta.114
  - @igrp/framework-next-auth@0.1.0-beta.114
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.114
