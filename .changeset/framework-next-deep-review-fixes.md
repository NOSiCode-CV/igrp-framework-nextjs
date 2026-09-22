---
'@igrp/framework-next': patch
'@igrp/framework-next-ui': patch
'@igrp/framework-next-types': patch
'@igrp/framework-next-auth': patch
'@igrp/template-migrator': patch
---

Deep review of `@igrp/framework-next`: fix the login-redirect swallow, the
basePath permission denial, the Server Action credential gap, and a batch of
correctness and hygiene issues.

**`@igrp/framework-next-ui`**

- `IGRPLayoutErrorBoundary` no longer swallows Next.js control-flow signals.
  The framework's header/sidebar data providers call `redirect('/login')` on a
  401/403 from Access Management, and `redirect` signals by throwing. Because
  the providers render behind a `<Suspense>` nested in this boundary, the throw
  reached the client, where the boundary latched before Next's own
  `RedirectBoundary` — so a user with an expired session saw a permanently
  broken header and sidebar instead of the login page. Both
  `getDerivedStateFromError` and `componentDidCatch` now call `unstable_rethrow`.

**`@igrp/framework-next`**

- **basePath permission checks no longer deny everyone.** `igrpGetClaims()`
  recovered the access token with `getToken` but no `cookieName`, so it looked
  for the stock NextAuth cookie while `withIGRPAuth` had written a
  basePath-scoped one. Every permission check from a Server Action or Route
  Handler denied a user who held the permission, in any app setting
  `NEXT_PUBLIC_BASE_PATH`. Naming is now delegated to `sessionCookieName`.
- **Server Actions work, and fail closed.** The four fetch actions in
  `@igrp/framework-next/actions` resolved credentials from an
  `AsyncLocalStorage` store that no Server Action ever has, so they built a
  client with no base URL and an empty bearer. They now recover the session
  (new `igrpEnsureAccessClientConfig`) and refuse before contacting Access
  Management when none can be recovered — these are POST endpoints taking a
  caller-supplied `appCode`, so the two had to be fixed together.
- `layoutData` replaces `layoutMockData`, which was production configuration
  wearing a preview-mode name. `layoutMockData` is still read for one release;
  setting both is rejected. New `igrpResolveLayoutDataSource` export.
- `igrpBuildConfig` now validates `layout` and (when sync is on)
  `appInformation.name`. Both are required by `IGRPConfigArgs` and neither was
  checked; a missing `appInformation` surfaced inside `after()`, where nothing
  but a server log ever sees it.
- The data hooks use `igrpGetAccessClient()` instead of four hand-rolled
  `AccessManagementClient.create` calls, so an unconfigured client now reports
  that clearly.
- `apiManagementConfig.timeout` is honoured on read paths. It was dead config:
  nothing ever wrote it into the per-request store, which only defaults
  `timeout` when it *creates* the store, so every read-path client sat on the
  10s default. `IGRPLayoutFull` now threads it through to both providers.
- `igrpGetClaims` decides the session-cookie name by probing the cookie jar
  rather than from `NEXT_PUBLIC_BASE_PATH` alone. `withIGRPAuth` only suffixes
  cookie names when `cookieIsolation` is `'basePath'` (its default), and this
  package cannot see that option — gating on the env var alone would have fixed
  the default configuration and broken `cookieIsolation: 'none'`.
- `igrpSyncRoutes`: resource names replace every path separator
  (`/admin/users` produced `svc--admin/users`), and the param-map parser is
  brace-counted instead of a non-greedy regex that truncated on nested objects.
- `igrpStartupSync` waits 60s before retrying a failed sync. It is scheduled
  via `after()` on every request, so a down Access Management server got a full
  sync attempt per request.
- `useLayoutData` no longer awaits two documented no-op Server Actions before
  `router.refresh()`.
- `IGRPRootLayout` accepts `lang` (defaults to `'pt'`); `IGRPLayoutFull` accepts
  `defaultSidebarOpen` (defaults to `true`).
- `IGRPGlobalLoading` no longer throws or redirects out of a loading placeholder.
- `igrpBuildQueryString` encodes parameter names as well as values.
- `igrpEnsureAccessClientConfig` is exported from the package root.
- Server-only modules carry a real `import 'server-only'` guard —
  `server-only` is now a declared dependency, so the existing guards resolve.
- Adds a `typecheck` script (the last framework package without one) and runs
  `typecheck` + `test` in `release`. Removes the unused ESLint devDependencies
  and the dead `safe-await` / `toUpperCaseIdentifier` / `mapperMenu` /
  `mapperUser` exports.
- The header and sidebar providers wrap a layout-data transport failure as
  `IgrpLayoutDataError` with code `IGRP_LAYOUT_DATA_FAILED` and the original
  error as `cause`, so a boundary's `onError` reporter gets a stable code
  instead of a bare `ApiClientError`. The code existed in `IgrpErrorCode` and
  was never thrown. `unstable_rethrow` runs first so a 401's `redirect('/login')`
  still reaches the router. `IGRP_APP_HOME_SLUG_INVALID`,
  `IGRP_AUTH_CONFIG_INVALID` and `IgrpAuthConfigError` are marked
  `@deprecated` rather than deleted — narrowing a public union is a breaking
  change even when nothing throws the members.
- `parseRouteParamMap` skips string literals while brace-counting. An opening
  brace inside a string inflated the depth, so the scan never rebalanced and
  dropped that route **and every route after it** from the resource sync.
- `vitest.config.ts` includes `.tsx`, which it did not — the layout providers
  could not be tested at all. They now have coverage (13 cases), as does
  `IGRPLayoutFull`'s wiring (5).
- `showPreviewMode` is no longer written by `SidebarDataProvider` — no consumer
  reads it and the field is `@deprecated`.

**`@igrp/framework-next-types`**

- Adds `IGRPLayoutDataSource` and `IGRPConfigArgs.layoutData`; deprecates
  `IGRPMockDataAsync` (now an alias) and `layoutMockData`.

**`@igrp/framework-next-auth`**

- `resolveSecureCookiesFlag` moves to the shared `/cookies` entry point so
  `@igrp/framework-next` can reuse it instead of copying cookie logic.

**`@igrp/template-migrator`**

- Migration `39-layout-data-source-rename` switches `templates/demo-v1` to
  `layoutData`.
