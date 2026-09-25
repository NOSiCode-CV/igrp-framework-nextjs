# @igrp/framework-next-types

## 0.2.0-beta.1

### Patch Changes

- a0e6d3d: Deep review of `@igrp/framework-next`: fix the login-redirect swallow, the
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
    `timeout` when it _creates_ the store, so every read-path client sat on the
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

- 147f51a: Fix the published type declarations being unusable under `node16`/`nodenext`,
  close the contract gate's blind spot to Access Management DTO drift, and mirror
  the four `IGRPUserDTO` fields that drift had hidden.

  ### ⚠️ The current user's full Access Management DTO was being sent to the browser

  `fetchCurrentUser` returned `result.data` — the raw `IGRPUserDTO` — and both the
  header and sidebar data providers hand it straight to a `'use client'`
  component. Props to a client component are serialized into the RSC payload, so
  every authenticated page render shipped the whole DTO to the browser, including
  `nic` (national identity number), `phoneNumber` and `metadata`, the free-form
  `Record<string, unknown>` the authorization server owns and enriches into issued
  JWTs.

  It type-checked because `IGRPUserDTO` is assignable to the declared
  `IGRPUserArgs`, and a variable (unlike a fresh object literal) gets no
  excess-property check. `mapperUser` existed precisely to narrow this and had
  **no callers**.

  `fetchCurrentUser` now narrows at the fetch boundary via `mapUserDTO`, which
  lists every forwarded field explicitly and withholds `metadata`, `nic`,
  `phoneNumber` and `emailVerified` — none of which any framework component
  renders. Consumers reading `IGRPHeaderDataArgs.user` /
  `IGRPSidebarDataArgs.user` now receive exactly the declared `IGRPUserArgs`;
  code relying on an undeclared DTO field being present at runtime will stop
  seeing it. An app that needs one should read the DTO server-side and pass down
  that field rather than widening the shape every browser receives. Ten tests pin
  the boundary, since the type system structurally cannot.

  ### ⚠️ The published types were silently `any` for `nodenext` consumers

  `@igrp/framework-next-types` is `"type": "module"`, but `tsc` copied its
  extensionless relative specifiers straight into `dist/*.d.ts`
  (`from './types/header'`). Under `moduleResolution: "node16" | "nodenext"` that
  is TS2834 — and because the error is raised _inside a `.d.ts`_, the
  near-universal `skipLibCheck: true` swallows it. Every type in the package then
  resolved to `any`, with no diagnostic anywhere: a consumer could write
  `const x: IGRPMenuItemArgs = { totallyWrong: 123 }` and compile clean.

  Relative imports now carry an explicit `.js` extension, which `moduleResolution:
"bundler"` (what every in-repo consumer uses, and why nothing caught this)
  accepts unchanged. No API change — but a `nodenext` consumer that was compiling
  green may now see real type errors for the first time.

  ### The AM contract gate could not see a missing field

  `contract/am-contract.ts` asserted DTO → framework _assignability_, which proves
  the framework type is never wider than the wire. It is structurally blind to the
  opposite drift: a DTO that **grows** a field is still assignable to the older,
  smaller framework type. `IGRPUserDTO` had gained `nic`, `phoneNumber`,
  `emailVerified` and `metadata` with the gate green throughout, and
  `mapperUser` was silently dropping all four.

  The gate now also asserts **field coverage** via `MirrorsAllKeys`, for all twelve
  mirrored DTOs. A DTO field the framework does not carry fails the build and names
  itself (`missing: "nic"`). Deliberate omissions must be named in the assertion,
  so an intentional gap is distinguishable from an oversight.

  ### Type changes
  - **`IGRPUserArgs` is now documented as a deliberate subset of `IGRPUserDTO`,
    not a mirror of it** — it is the one framework shape serialized to the browser.
    The four DTO fields it does not carry (`metadata`, `nic`, `phoneNumber`,
    `emailVerified`) are named individually in the contract gate's exclusion list,
    so the key-coverage check still fails on any _other_ new DTO field: widening
    the browser payload has to be a decision someone writes down.
  - **`IGRPConfigClient` had a signature no template could use** — it read
    `() => Promise<IGRPConfigArgs>` and its docs pointed at a _default_ export,
    while the real factory is a named `createConfig` taking the per-request layout
    config. Now `(config: IGRPLayoutConfigArgs) => Promise<IGRPConfigArgs>`, and
    `templates/demo-v1` applies it (see migration 38 below).
  - **`IGRPRoleArgs.permissions`** stays optional but documents the wire truth: AM
    always sends it.
  - **Four fields deprecated — nothing reads them**, so setting them has never had
    an effect: `IGRPConfigArgs.showLanguageSelector`, `.loginUrl`, `.logoutUrl` and
    `.showSettings` (the settings link is gated by
    `IGRPHeaderDataArgs.showSettings`, a different object with the same field
    name), plus `IGRPSidebarDataArgs.showPreviewMode`, which `@igrp/framework-next`
    writes and no UI consumes. Kept for one release.

  ### Tooling and docs
  - **New `check:dist` gate, run after `tsc -b`.** The `.js`-extension fix above
    had nothing enforcing it: dropping one extension left `check:barrel`,
    `check:contract` and `tsc -b` all green while broken declarations shipped.
    `check:dist` asserts every relative specifier in `dist/**/*.d.ts` carries the
    extension, and names the file and specifier when one does not.
  - `MirrorsAllKeys`' `Ignored` parameter is constrained to `keyof From`, so a
    deliberate omission cannot outlive the field it exempts — if the AM client
    drops the property, the ignore stops compiling instead of persisting as a
    claim nobody re-checked.
  - `@igrp/framework-next-ui` pins `IGRPToasterPosition` against the position type
    `IGRPToaster` actually accepts, in both directions. Passing the value only
    proved one way: a member sonner _gained_ would have left the framework union
    quietly incomplete. Type-only, so Babel emits nothing.
  - `check:barrel` now recurses into subdirectories, recognises `export declare` /
    `export enum`, resolves `X as Y` to the exported name, and **gates the README
    export table** — matched against the table rows rather than the whole file (a
    name mentioned in prose used to count as documented), and checked both ways so
    a row naming a removed type fails too — the only export list a consumer reads, and the one that had
    quietly lost `IGRPMenuTypeSyncable` and `IGRPApplicationTypeSyncable`.
  - Dropped the `next` peer and dev dependency: nothing in the package references a
    Next.js type. `next-auth` (peer) and `react` (optional peer) stay — they are
    reached transitively through `SessionProviderProps`.
  - README no longer presents the framework **build order** as this package's
    dependency chain; `design-system` sits in that order but does not depend on it.

  ### Template migration 38

  `@igrp/template-migrator` ships `38-config-client-annotation`, which annotates
  the template's `createConfig` with the corrected `IGRPConfigClient` and drops the
  `as IGRPLayoutConfigArgs` cast from both layouts — the cast was never
  load-bearing (`getLayoutConfig()` was already assignable), and an `as` on a
  cross-package type is what hides the next drift.

  **It requires the `@igrp/framework-next-types` from this wave**: against an older
  pin, `igrp.template.config.ts` fails with "Expected 0 arguments, but got 1".
  Apply it together with the dependency-resync migration.

  ### Documentation and build hardening
  - **`verbatimModuleSyntax: true`** — the direct compiler guard on this
    package's central invariant. Imports and exports are now erased exactly as
    written, so a value import cannot slip into a package that ships no JavaScript
    entry point; it would have to be written as one and fails with TS1484.
  - **`isolatedDeclarations: true`** on the build config, with `allowJs` dropped
    (there is no JS under `src/`, and the two are mutually exclusive). For a
    declaration-only package this is the strongest available guarantee that every
    export stays emittable from its own declaration, and it passes today with no
    source changes — it only gets expensive to adopt later.
  - **`IGRPMockDataAsync` and `IGRPConfigArgs.layoutMockData` now document what
    they actually are.** Despite the name, the framework calls both functions on
    every render in _both_ modes and keeps most of what they return in production;
    only `user` / `showIGRPSidebarTrigger` (header) and `user` / `menuItems` /
    `apps` / `appCode` / `showPreviewMode` (sidebar) are overridden. Returning a
    stub "because it is only mock data" silently drops the entire header and
    sidebar configuration, with no error and no type complaint. The JSDoc carries
    the full override table; the rename itself is tracked in `KNOWN-ISSUES.md`.
  - **`IGRPSidebarDataArgs.menuItems`** documents that it is discarded whenever
    auth is real — every production app authors an array that is thrown away.
    Making it optional needs a default in `@igrp/framework-next-ui`; that default
    landed in the same wave, so the field **is** optional now — see the
    `next-ui-review-fixes` changeset.
  - Four cross-package handover notes added to the repo-root `KNOWN-ISSUES.md`
    (the `layoutMockData` rename, `menuItems` optionality, the dead
    `showPreviewMode` wire, and the 9-pin migration dependency drift), each with
    the diagnosis and the ordered steps to land it in the owning package.
  - **A `typecheck` script and `noUnusedLocals` / `noUnusedParameters`**, closing
    this package's share of repo `KNOWN-ISSUES` #1. The root `pnpm typecheck` is
    `pnpm -r run typecheck`, which silently skips packages that do not define the
    script — it covered only `next-auth` before, and now covers `next-types` too.
    Not added to `release`: unlike `next-auth`, this package's `build` already
    type-checks.

- 147f51a: Fix a silent React Compiler bailout, three stale-state bugs in the app shell, a
  gate that failed open, and an SSR/client split on every external menu link.

  ### ⚠️ `IGRPAuthForm` had lost React Compiler memoization, silently

  `babel-plugin-react-compiler` (through 1.0.0) cannot lower a `TryStatement` with
  a finalizer — `Todo: (BuildHIR::lowerStatement) Handle TryStatement with a
finalizer ('finally') clause`. It swallows that per function and emits the
  module **uncompiled**, so the build stays green while memoization disappears.
  `onSubmit`'s `try/catch/finally` put the whole login form in that state, and
  nothing in source review, `tsc` or the test suite could see it.

  The `finally` was wrong on its own terms too: on the happy path `signIn()` never
  resolves — it navigates away — so clearing the loading flag there un-spun the
  button mid-redirect. It is now cleared only on the failure path.

  `src/__tests__/build-pipeline.test.ts` asserts on the emitted `dist/` that every
  eligible client module carries compiler output — `.ts` as well as `.tsx`, since
  a hook is exactly as memoizable as a component and a bailout in one is exactly
  as silent. A second assertion pins that the first is not passing vacuously by
  naming the three client hooks it must be covering. It skips when `dist/` is
  absent, and `release` now runs `build && typecheck && test` before publishing.

  ### ⚠️ The published types were silently `any` for `nodenext` consumers

  `@igrp/framework-next-ui` and `@igrp/framework-next` are both `"type": "module"`,
  and `tsc --emitDeclarationOnly` copies module specifiers into `dist/*.d.ts`
  verbatim. Every relative specifier they emitted was extensionless — 62 and 17
  respectively — which is TS2835 under `moduleResolution: "node16" | "nodenext"`.
  Because the error is raised _inside a `.d.ts`_, the near-universal
  `skipLibCheck: true` swallows it and every exported type resolves to `any`.

  Reproduced against the published layout: a consumer could write

  ```ts
  export const bad: IGRPMenuLabels = { totallyMadeUpField: 12345 };
  export const alsoBad: IGRPForbiddenProps = { homeHref: { not: 'a string' } };
  ```

  and `tsc` exited **0**. The same file now reports TS2353 and TS2322.

  This is the identical defect already diagnosed and fixed in
  `@igrp/framework-next-types`; the fix was never carried to the two sibling
  packages with the same build shape. Note it affected only the **declarations** —
  `scripts/babel-plugin-add-import-extension.cjs` has always fixed the `.js` half,
  so the packages loaded correctly at runtime and only their types were broken,
  which is exactly how it survived three source-level reviews. Nothing in-repo
  could catch it either: `templates/demo-v1` uses `moduleResolution: "bundler"`,
  which accepts both spellings.

  Relative imports in `src/` now carry an explicit `.js` extension (174 specifiers
  across both packages, including dynamic `import()`), and both packages gained
  the `check:dist` gate `next-types` already had, wired into `build` and into the
  `build:without_reactcompiler` escape hatch. The Babel plugin is idempotent for
  specifiers that already carry an extension, so one spelling in `src/` satisfies
  both emitters. **No API change** — but an external `nodenext` consumer that was
  compiling green may now see real type errors for the first time.

  ### ⚠️ Every external menu link rendered differently on the server and the client

  `resolveAnchorTag` was built on the design system's `igrpIsExternalUrl`, which
  compares against `window.location.origin` **inside a `try`**. Under SSR the
  `ReferenceError` is swallowed and it answers `false` for every URL. So the
  server rendered external menu items as `next/link` and the client re-rendered
  them as `<a target="_blank" rel="noopener noreferrer">` — a hydration mismatch
  on the element type itself, plus a window in which the link carried no
  `rel="noopener"`.

  Externality is now decided from the URL's own shape (scheme or
  protocol-relative), which gives the same answer on both sides of hydration.
  `@igrp/igrp-framework-react-design-system` is unchanged; its helper is still
  correct in the browser, just not usable in code that server-renders.

  ### ⚠️ `IGRPAuthorization` and `IGRPGuardPage` failed open on an empty list

  `[].every(...)` is `true`, so `permission={[]}` rendered gated children to
  **everyone** under the default `mode="all"`, while the same input under
  `mode="any"` denied. An empty list now denies in both modes, through a shared
  `igrpIsAllowedBy` that both components — and consumers — can call. These remain
  client-side rendering control; the authoritative gate is still the server-side
  `igrpAssertAuthorize`.

  ### Stale state in the persistent chrome
  - **Folders no longer open on navigation.** The sidebar mounts once per session,
    so `<Collapsible defaultOpen>` was read on that one mount and never again:
    navigating from a leaf in folder A to a leaf in folder B left B collapsed
    while its trigger showed the active highlight. The open state is now
    controlled and opens on the `hasActiveChild` edge, so it reveals the route the
    user landed on without fighting a manual collapse elsewhere.
  - **Breadcrumbs re-measure their overflow.** `useBreadcrumbOverflow` observed an
    element whose box never changes when its children do, with deps of
    `[containerRef]` — so it measured once at mount and every later answer was
    stale: a long trail measured at mount kept its ellipsis on a two-segment
    route, and vice versa. It now takes a required `contentKey`, derived from the
    items (never from the collapsed output, which would oscillate).
  - **The session watcher reacts to navigation.** It read
    `window.location.pathname` inside an effect that depended only on
    `[status, session, router]`, so an unauthenticated user who client-navigated
    into a protected route was never redirected — `status` had not changed.
  - **Menu search survives a re-render.** The query reset keyed off the `menus`
    array identity, clearing what the user was typing on every render in which the
    caller rebuilt the array — which is every render for anyone passing an inline
    literal.

  ### Menu tree: nested folders are no longer dropped

  A `FOLDER` inside a `FOLDER` was typed as a leaf, so its entire subtree vanished
  from both the sidebar and menu search — routes the backend advertised became
  unreachable, with no error. The sidebar still renders two levels (that is what
  `SidebarMenuSub` and the icon-mode dropdown express), but deeper descendants are
  now hoisted into the nearest folder rather than discarded, with a cycle guard on
  `parentCode`.

  ### Accessibility
  - **Carousel.** `opacity-0` + `pointer-events-none` blocks the mouse and nothing
    else, so off-screen slides stayed in the tab order and the accessibility tree —
    with four slides, a keyboard user tabbed through sixteen invisible dots and a
    screen reader announced all four headings. Inactive slides are now `inert` +
    `aria-hidden`, and the dot strip is rendered once for the carousel instead of
    once per slide.
  - **Icon-mode menu dropdown now closes on selection.** An `onSelect` that called
    `preventDefault()` suppressed Radix's close, leaving the menu open over the
    page just navigated to.
  - **Folders emit one list item.** The icon-mode and expanded surfaces were two
    `SidebarMenuItem`s and only the button of the hidden one was hidden, leaving an
    empty `<li>` per folder in expanded mode.
  - **The header's settings link had no accessible name.** It renders an icon and
    nothing else, so a screen reader announced only the href. It now carries an
    `aria-label` plus `sr-only` text, overridable via `settingsLabel`.
  - `<p>` inside `<h3>` in the login form (the parser closes the heading early, so
    the DOM React hydrates is not the one it built), and an unbounded unread badge
    that could overflow its 14px circle.
  - The theme selector keyed its options by display `name`, which the standard and
    scaled groups share by design — now keyed by `value`, the CSS class suffix,
    which is unique by construction.
  - **The command palette's accessible name was English.** The design system's
    `CommandDialog` renders its `title` into an `sr-only` `DialogTitle` and
    defaults it to "Command Palette"; nothing passed one, so the one string only
    screen-reader users hear was the one string not in pt-PT. Now
    `labels.dialogTitle` / `labels.dialogDescription`.
  - **`IGRPLayoutErrorBoundary` reports what it catches.** It had no
    `componentDidCatch` at all — it rendered its fallback and dropped the error
    with no log, no stack and nothing for an observability tool to hook. It now
    logs by default and takes an `onError(error, info)` for a real reporter.
  - **The active theme no longer flashes.** The `theme-*` class was applied to
    `<body>` in a passive `useEffect`, i.e. after the browser had already painted
    — so every load showed the default theme first. It now uses a layout effect
    (isomorphic, so SSR does not warn), and `igrpActiveThemeClassName()` is
    exported so a root layout can render the class server-side and remove the
    flash before hydration too. `IGRP_ACTIVE_THEME_COOKIE` is exported alongside it.
  - `IGRPTemplateLoading` dropped an `aria-label` that duplicated — and would
    silently override — its own visible status text.

  ### pt-PT defaults, exposed as overridable props

  The chrome mixed hardcoded English (`Profile`, `Notifications`, `Settings`,
  `Log out`, `Mark all as read`, `Home`, `Toggle menu`, `(opens in new tab)`,
  `Applications Center`) into otherwise pt-PT surfaces, with no way for a consumer
  to change it. Every such string is now pt-PT by default and overridable.

  `IGRPTemplateModeSwitcher` and `IGRPTemplateThemeSelector` were English
  end-to-end with no props at all — including the theme names themselves
  (`Default` / `Blue` / `Green` / `Amber`), which is why the selector also gained
  `themes` / `scaledThemes`. Pass `scaledThemes={[]}` to hide the scaled group.

  New catalogs and props — all additive: `IGRP_MENU_LABELS_PT_PT`,
  `IGRP_NAV_USER_LABELS_PT_PT`, `IGRP_NOTIFICATIONS_LABELS_PT_PT`,
  `IGRP_COMMAND_SEARCH_LABELS_PT_PT`, `IGRP_MODE_SWITCHER_LABELS_PT_PT`,
  `IGRP_THEME_SELECTOR_LABELS_PT_PT`, `IGRP_DEFAULT_THEMES`, `IGRP_SCALED_THEMES`,
  plus `menuLabels` / `navUserLabels` on `IGRPTemplateSidebar`, `labels` on every
  component that owns copy, `settingsLabel` on `IGRPTemplateHeader`, and
  `subtitle` / `homeHref` / `homeLabel` on `IGRPTemplateNotFound`.
  `IGRPTemplateMenus`' `navAriaLabel` prop is deprecated in favour of
  `labels.navAriaLabel` and still wins for one release.

  Substitution goes through the design system's `igrpFormatMessage`, not
  `String.prototype.replace(string, string)` — which interprets `$&`, `` $` ``,
  `$'` and `$n` **in the replacement**. Menu names come from the backend and the
  search query is typed by the user, so a `$` sequence corrupted the output and
  leaked the surrounding template: searching ``a$`b`` rendered
  `Sem resultados para "aSem resultados para "b".`

  The design system's `useIGRPi18n()` catalog is closed to this package —
  `IGRPI18nStrings` enumerates DS component groups and the provider merges a fixed
  list — so props are the seam. `useIGRPLocale()` **is** usable, and
  `IGRPTemplateNotifications` now takes its timestamp locale from there instead of
  defaulting to a hardcoded `pt-PT`.

  ### API corrections
  - **`IGRPTemplateHeader` can feed its own command palette.** `commands` is now a
    prop; without it the built-in palette opened empty on every shortcut, and the
    only way to give it contents was replacing it wholesale via `slots.search`.
  - **`IGRPTemplateSidebar` renders `IGRPSidebarError` instead of throwing** when
    `data` is missing. A render throw from a client component escapes to the
    nearest boundary and takes the whole segment down for a pane-level problem.
  - **`IGRPTemplateNavUser`'s settings link defaulted to `/setting`** while the
    header's defaulted to `/settings`; whichever an app had not routed 404'd. Both
    are `/settings` now, and `logoutUrl` is a prop rather than a hardcoded
    `/logout`.
  - **The Applications Center entry was hidden from every two-app tenant**
    (`listApps.length > 1`). It now shows whenever `appCenterUrl` is set.
  - **Dead props removed**: `baseUrl` on `IGRPTemplateSidebar` and
    `IGRPTemplateAppSwitcher` — both declared in exported types, neither ever
    read. Nothing in the repo passed either.
  - **Newly exported**, all previously unreachable: `useIGRPThemeConfig` (the
    provider shipped without its hook, so the active theme could only be changed
    through the built-in selector), `IGRPThemeProvider`, `IGRPTemplateImage` and
    `igrpIsAllowedBy`.
  - `IGRPTemplateHeader.data` is typed optional, matching the `if (!data) return
null` it already had, and takes a `fallbackLogo` prop — the logo path is a
    contract with the consuming app's `public/`, since this package publishes
    `dist` only.
  - **The header now threads every child's label overrides**, not just
    `navUserLabels`: `commandSearchLabels`, `notificationsLabels`,
    `modeSwitcherLabels`, `breadcrumbHomeLabel` and `breadcrumbEllipsisLabel`.
    Each child owned a catalog that was unreachable through the header, which is
    how apps actually mount them.
  - **`IGRPGuardPage` forwards its 403 copy** — `forbiddenProps`, plus a
    `fallback` that replaces the screen outright. `IGRPForbidden`'s props existed
    and the guard passed none of them.
  - **`IGRPNestedProviders` dropped a `className` prop** it declared and never
    read — the same dead-prop defect removed from the sidebar and app switcher.
  - `useIGRPThemeConfig` threw naming two symbols that do not exist
    (`useThemeConfig`, `ActiveThemeProvider`); harmless while the hook was
    private, and now it is exported.
  - The `toasterConfig` spread on `IGRPToaster` is replaced by explicit props: it
    passed `showToaster` (a framework flag sonner has no use for) through, and
    re-applied raw values _after_ the defaults resolved, so an explicit
    `position: undefined` beat the `'bottom-right'` default.

  ### `@igrp/framework-next-auth`: `useOptionalSession`

  `./client` gains `useOptionalSession` (and the raw `SessionContext` it reads).
  `useSession()` throws without a provider and `useSafeSession` delegates straight
  to it, so neither can serve a component that must also render standalone —
  `IGRPSectionPermissions` does, and was reaching into `next-auth/react` directly
  for the context. It returns `null` for "no provider mounted", which means
  _cannot tell_, not "unauthenticated"; a permission gate must keep its
  server-seeded answer in that case rather than denying. Additive; no existing
  export changes.

  ### `@igrp/framework-next-types`: `menuItems` is optional

  `IGRPSidebarDataArgs.menuItems` is now optional, closing repo `KNOWN-ISSUES` #3.
  It is discarded whenever auth is real — `SidebarDataProvider` replaces it with
  `fetchMenus(appCode)` — so requiring it only forced every production app to
  author an array that is thrown away. `IGRPTemplateSidebar` supplies the `[]`
  default that made the type change safe.

  ### Housekeeping
  - **`src/index.css` removed.** It declared `@import 'tailwindcss'` plus a
    `@theme inline` block and a base layer, was in neither the `exports` map nor
    any import, and was still copied into `dist` — so the only way it could ever
    have been used was to start a second Tailwind build inside a consuming app,
    which `.claude/shared/tailwind-v4.md` forbids. `tokens.css` is unaffected and
    still the `./tokens` entry.
  - **`typecheck` script added**, closing this package's share of repo
    `KNOWN-ISSUES` #1 — the root `pnpm typecheck` now covers three of the four
    framework packages (`@igrp/framework-next` is the last one missing).
  - **`vitest` include widened to `.tsx`**, so a component test no longer requires
    editing the config first. New tests cover the menu tree builder, the
    SSR-safety of external-URL detection, the permission decision, and the build
    pipeline.
  - `withBasePath` / `stripBasePath` were copy-pasted across four files; they now
    live in `lib/utils.ts`.
  - `TODO.md` was empty and is gone. `public/` is not published (`files: ["dist"]`)
    and now carries a README saying so — those assets are a contract with the
    consuming app's own `public/`, resolved by URL from the app's origin, so
    publishing them would ship bytes no consumer can reach.
  - README rewritten: every export name in its tables was wrong (`IGRPHeader`,
    `IGRPSidebar`, `IGRPMenus`, `NestedProviders`, `IGRPModeToggle`, … — none of
    them exist), and it documented a `Node >= 20` / `Next ^15.5.15` requirement
    that does not match `package.json`.
  - Stale comments corrected: `babel.config.cjs` described a React Compiler pass
    over SWC output in `dist/` (there is no SWC step and no dist input), and four
    components carried `src/components/templates/…` paths that have not existed
    for some time.

- e900763: Fix the `next-types` package boundary and gate its Access Management types against the real DTO contract.

  **`@igrp/framework-next-types`**

  - The manifest advertised `main` / `module` / an `import` condition pointing at `dist/index.js`, which the declaration-only build never emits. `exports` now carries a `types` condition only — no phantom runtime entry.
  - Declared the peers the public surface actually embeds: `IGRPConfigArgs.sessionArgs` is `Partial<SessionProviderProps>`, which is React-typed, so `react` and `next` are now (optional) peers alongside `next-auth`.
  - `declarationMap` was on while `files` shipped `dist` only, so every published `.d.ts.map` pointed at sources that were not in the tarball. `src` now ships too.
  - Realigned the AM types with `@igrp/platform-access-management-client-ts`, which they mirror by hand and had drifted from: `IGRPPermissionArgs.description`, `IGRPRoleArgs.description` / `parentCode` and `IGRPDepartmentArgs.description` accept `null`; `IGRPRoleArgs.name` and `IGRPDepartmentArgs.status` are optional; `IGRPRoleArgs`, `IGRPResourceArgs` and `IGRPResourceItem` carry permission **names** (`string[]`) rather than permission objects; `IGRPResourceArgs.id` / `status` and `IGRPResourceItem.id` are optional; `IGRPFileUrlArgs.expiration` accepts a `Date`.
  - Added `contract/am-contract.ts` plus `pnpm check:contract` (wired into `build`): a build-time assertion that every AM DTO is assignable to its framework counterpart, so this drift cannot recur silently. The AM client is a devDependency and never reaches the published output.
  - `IGRPRoleDepartmentArgs` is now exported from the barrel — it is the element type of the required `IGRPMenuItemArgs.roles` but could not be named by consumers.
  - `IGRPHeaderDataArgs`: the eight `show*` flags are optional (default `false`, matching the renderer's existing truthiness checks) instead of all required.
  - `IGRPNotificationArgs.timestamp` accepts `string | Date`; ISO 8601 strings are now the documented form.
  - Marked the unused pure AM mirrors `@deprecated` in favour of the client's own DTOs: `IGRPResourceArgs`, `IGRPResourceItem`, `IGRPResourceType`, `IGRPGlobalConfigurationArgs`, `IGRPConfigurationType`, `IGRPFileUrlArgs`, `IGRPRoleUserArgs`.
  - `IGRPConfigArgs.layoutMockData` references `IGRPMockDataAsync` instead of re-declaring it inline; `Session` is imported from the `@igrp/framework-next-auth/session` subpath rather than the root barrel.
  - Added the missing `LICENSE`, and corrected a README that documented type names which do not exist (`IGRPConfig`, `IGRPSidebarConfig`, `IGRPHeaderConfig`), a `Session`/`JWT` re-export that does not happen, and the wrong Node/next-auth ranges.

  **`@igrp/framework-next`**

  - Dropped the unchecked `as IGRPStatus` / `as IGRPMenuType` / `as IGRPTargetType` casts from the application and menu mappers. TypeScript accepts a string enum where its literal union is expected, so the casts were never load-bearing — they only hid drift, and the contract gate now proves the assignment is sound.
  - `mapApplication` no longer silently drops `lastAccess`.

  **`@igrp/framework-next-auth`**

  - Split the type-check and emit configs. `tsconfig.json` carried `composite: true`, `noEmit: false` and `outDir: ./dist` on a package whose `dist/` is produced entirely by tsup, so any stray `tsc` or `tsc -b` in the package wrote a second, competing build over the tsup output. It is now type-check-only (`noEmit`, non-composite) with a `typecheck` script; `tsconfig.build.json` remains the composite, declaration-only emitting config. tsup's `dts` pass pins `noEmit: false` so the new config cannot silence declaration output — the `dist-contract` suite is what catches that if it regresses. No change to the published build.

  **`@igrp/framework-next-ui`**

  - `IGRPTemplateNotifications` called `.toLocaleString()` straight on `timestamp`, which throws when notifications come from a JSON API (a string, not a `Date`), and formatted with the ambient locale and time zone, producing a hydration mismatch on every row. It now accepts both forms, renders inside a `<time dateTime>` element, takes a `locale` prop (default `pt-PT`), and renders empty rather than `Invalid Date` for unparseable input.

- Updated dependencies [a0e6d3d]
- Updated dependencies [1eadf0f]
- Updated dependencies [ccfaeec]
- Updated dependencies [39eb67c]
- Updated dependencies [23343a3]
- Updated dependencies [90d5a73]
- Updated dependencies [8a6ecbe]
- Updated dependencies [1237546]
- Updated dependencies [342a9ba]
- Updated dependencies [147f51a]
- Updated dependencies [75fd1bc]
- Updated dependencies [e900763]
  - @igrp/framework-next-auth@0.2.0-beta.1

## 0.2.0-beta.0

### Minor Changes

- Start the `0.2.0-beta` pre-release line (from `0.1.0-beta.*`). No code changes relative to the last `0.1.0-beta` build on this branch.

## 0.1.0-beta.149

### Patch Changes

- - Framework packages no longer declare their internal `@igrp/*` siblings as exact-version peer dependencies. They are regular dependencies again, so installing or upgrading a single framework package no longer emits unmet-peer warnings across the whole set.
  - `@igrp/framework-next` widens its `zod` peer range from the exact `4.5.0` to `^4.5.0`, so an app on any `4.5.x` (the template ships `4.5.4`) satisfies it.
  - `@igrp/template-migrator` ships migration `30-resync-beta166-deps`, which carries a CLI-upgraded app's dependency set forward to the beta.166 framework release — including `zod`, `react-hook-form`, `@tanstack/react-query` and `@types/react-dom`, which no earlier migration had ever pinned.
- Library packaging hygiene across all published packages:

  - `@igrp/framework-next`: `next`, `react`, `react-dom` moved from `dependencies` to `peerDependencies` (range-based) — prevents duplicate React copies in consumer apps.
  - All packages: exact-pinned `peerDependencies` relaxed to caret ranges (`react ^19.2.0`, `next ^15.5.0`, `next-auth ^4.24.0`, `zod ^4.4.0`, etc.) so consumers on newer patch/minor versions no longer get unmet-peer errors.
  - `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next-ui`: `tailwindcss` moved to `devDependencies` (Tailwind compiles in the consuming app); unused `zod` dependency removed from `next-ui`; duplicated `publishConfig.exports` removed.
  - `@igrp/framework-next-types`: added an `exports` map (blocks deep imports into `dist/`, consistent with the other packages).
  - `@igrp/framework-next`, `@igrp/template-migrator`: `types` condition now listed first in `exports`.
  - `@igrp/template-migrator`: added `license`, `author`, top-level `types`, `publishConfig.tag`/`access`; `clean` now uses cross-platform `rimraf`.
  - All packages: added `repository`/`homepage`/`bugs` metadata, normalized `engines.node` to `>=22`, added `./package.json` export.

- Permissions hardening: server-action claims recovery + live client claims

  **`@igrp/framework-next`**

  - `igrpGetClaims()` now recovers the access token from the session cookie when no
    `AsyncLocalStorage` store was established, and seeds the store so the Access
    Management client works in the same call. Previously, calling `igrpAuthorize()`
    from a Server Action or Route Handler denied **every** user — super admins
    included — because the token was only reachable through a store that a fresh
    async context never enters. The recovery uses `getToken` + cookies (not
    `getServerSession`, which needs the app's `NextAuthOptions` and would return a
    session with no `accessToken`), behind dynamic imports so the module graph is
    unchanged for existing importers.
  - `igrpGetClaims()` no longer swallows Next.js control-flow signals. The
    cookie-recovery path can raise the static-render bailout (`cookies()` read
    during prerender), `redirect()`, or `forbidden()`; these are now re-thrown
    instead of being converted into a claims error state, so Next still marks the
    route dynamic rather than failing the build with a confusing 5xx. A genuine
    cookie/JWT failure (no `digest`) still fail-closes as before.
  - Dev-only diagnostic: `igrpGetClaims()` warns once per request when a
    non-super-admin token carries no `org` claim, which silently denies every
    bare-name permission check and is otherwise indistinguishable from a real
    denial.
  - `igrpAssertAuthorize` is documented as **pages only** — an action has no
    `forbidden.tsx` boundary, so use `igrpAuthorize` there.

  **`@igrp/framework-next-ui`**

  - `IGRPSectionPermissions` now re-decodes claims from the live session instead of
    freezing the server-seeded value for the whole page load. The seeded prop only
    ever arrived once per full page load (token rotation does not call
    `router.refresh()`, and shared layouts do not re-render on client navigation),
    so client gating answered from login-time claims until a reload. Guarded three
    ways: no `SessionProvider` mounted → keep the seeded state (read via
    `SessionContext`, because `useSession()` throws without a provider); session
    `loading` → keep the seeded state; non-JWT token (preview mode) → keep the
    seeded state. `setState` now sets an explicit override, the seam for a future
    active-role switch.
  - `IGRPForbidden` gains a "Voltar à Página Inicial" action, matching
    `IGRPTemplateNotFound`'s pattern (`IGRPButton asChild` + `next/link`, so
    `basePath` is applied automatically). Label and destination are overridable
    via the new `homeLabel` / `homeHref` props; pass `homeHref={null}` to render
    no action when the surrounding shell already offers navigation.

  **`@igrp/framework-next-types`**

  - New `IGRPPermissionCatalogEntry` (`{ name, description?, enabled }`) — a
    permission an app **declares** for registration in the Access Management
    catalog. Deliberately distinct from `IGRPPermissionArgs`, which is the record
    AM _returns_ (it carries AM's `id`, `status` and `departmentCode`), and from a
    permission **claim** on the access token. Registering an entry does not make
    it checkable.
  - New `apiManagementConfig.syncPermissions` (default `false`) and
    `apiManagementConfig.onCodePermissions`.

  **`@igrp/framework-next` — permission catalog sync**

  - New `igrpSyncPermissions`, wired as a fourth arm of the existing startup-sync
    pipeline alongside routes and menus. Gated by `syncPermissions` on top of the
    existing `syncAccess` / `previewMode` gates, so enabling the capability cannot
    make an existing deployment start writing to the shared AM without opting in.
  - Idempotent upsert keyed on `name`; entries removed from the catalog are not
    deleted in AM. An empty catalog is skipped rather than sent as an empty upsert.
  - `planAccessManagementSync` validates catalog names against
    `^[A-Za-z0-9._-]{1,255}$` and **skips** malformed entries with a warning
    instead of throwing — one bad name should not stop an app from booting. It
    also warns off-production when a catalog name contains a dot, because
    `claimsAllow` treats such a name as already department-qualified and a
    bare-name check would silently deny.
  - `id` is omitted from the wire payload rather than sent as `0`, which a backend
    matching on id could misread as an update.

  Both permission-gating changes above are additive: each affects only states that
  previously failed outright.

- Updated dependencies [fd98d4c]
- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.146

## 0.1.0-beta.148

### Patch Changes

- 658e6b8: - Framework packages no longer declare their internal `@igrp/*` siblings as exact-version peer dependencies. They are regular dependencies again, so installing or upgrading a single framework package no longer emits unmet-peer warnings across the whole set.
  - `@igrp/framework-next` widens its `zod` peer range from the exact `4.5.0` to `^4.5.0`, so an app on any `4.5.x` (the template ships `4.5.4`) satisfies it.
  - `@igrp/template-migrator` ships migration `30-resync-beta166-deps`, which carries a CLI-upgraded app's dependency set forward to the beta.166 framework release — including `zod`, `react-hook-form`, `@tanstack/react-query` and `@types/react-dom`, which no earlier migration had ever pinned.

## 0.1.0-beta.147

### Patch Changes

- f3e0c00: Library packaging hygiene across all published packages:

  - `@igrp/framework-next`: `next`, `react`, `react-dom` moved from `dependencies` to `peerDependencies` (range-based) — prevents duplicate React copies in consumer apps.
  - All packages: exact-pinned `peerDependencies` relaxed to caret ranges (`react ^19.2.0`, `next ^15.5.0`, `next-auth ^4.24.0`, `zod ^4.4.0`, etc.) so consumers on newer patch/minor versions no longer get unmet-peer errors.
  - `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next-ui`: `tailwindcss` moved to `devDependencies` (Tailwind compiles in the consuming app); unused `zod` dependency removed from `next-ui`; duplicated `publishConfig.exports` removed.
  - `@igrp/framework-next-types`: added an `exports` map (blocks deep imports into `dist/`, consistent with the other packages).
  - `@igrp/framework-next`, `@igrp/template-migrator`: `types` condition now listed first in `exports`.
  - `@igrp/template-migrator`: added `license`, `author`, top-level `types`, `publishConfig.tag`/`access`; `clean` now uses cross-platform `rimraf`.
  - All packages: added `repository`/`homepage`/`bugs` metadata, normalized `engines.node` to `>=22`, added `./package.json` export.

- 9e15f16: Permissions hardening: server-action claims recovery + live client claims

  **`@igrp/framework-next`**

  - `igrpGetClaims()` now recovers the access token from the session cookie when no
    `AsyncLocalStorage` store was established, and seeds the store so the Access
    Management client works in the same call. Previously, calling `igrpAuthorize()`
    from a Server Action or Route Handler denied **every** user — super admins
    included — because the token was only reachable through a store that a fresh
    async context never enters. The recovery uses `getToken` + cookies (not
    `getServerSession`, which needs the app's `NextAuthOptions` and would return a
    session with no `accessToken`), behind dynamic imports so the module graph is
    unchanged for existing importers.
  - `igrpGetClaims()` no longer swallows Next.js control-flow signals. The
    cookie-recovery path can raise the static-render bailout (`cookies()` read
    during prerender), `redirect()`, or `forbidden()`; these are now re-thrown
    instead of being converted into a claims error state, so Next still marks the
    route dynamic rather than failing the build with a confusing 5xx. A genuine
    cookie/JWT failure (no `digest`) still fail-closes as before.
  - Dev-only diagnostic: `igrpGetClaims()` warns once per request when a
    non-super-admin token carries no `org` claim, which silently denies every
    bare-name permission check and is otherwise indistinguishable from a real
    denial.
  - `igrpAssertAuthorize` is documented as **pages only** — an action has no
    `forbidden.tsx` boundary, so use `igrpAuthorize` there.

  **`@igrp/framework-next-ui`**

  - `IGRPSectionPermissions` now re-decodes claims from the live session instead of
    freezing the server-seeded value for the whole page load. The seeded prop only
    ever arrived once per full page load (token rotation does not call
    `router.refresh()`, and shared layouts do not re-render on client navigation),
    so client gating answered from login-time claims until a reload. Guarded three
    ways: no `SessionProvider` mounted → keep the seeded state (read via
    `SessionContext`, because `useSession()` throws without a provider); session
    `loading` → keep the seeded state; non-JWT token (preview mode) → keep the
    seeded state. `setState` now sets an explicit override, the seam for a future
    active-role switch.
  - `IGRPForbidden` gains a "Voltar à Página Inicial" action, matching
    `IGRPTemplateNotFound`'s pattern (`IGRPButton asChild` + `next/link`, so
    `basePath` is applied automatically). Label and destination are overridable
    via the new `homeLabel` / `homeHref` props; pass `homeHref={null}` to render
    no action when the surrounding shell already offers navigation.

  **`@igrp/framework-next-types`**

  - New `IGRPPermissionCatalogEntry` (`{ name, description?, enabled }`) — a
    permission an app **declares** for registration in the Access Management
    catalog. Deliberately distinct from `IGRPPermissionArgs`, which is the record
    AM _returns_ (it carries AM's `id`, `status` and `departmentCode`), and from a
    permission **claim** on the access token. Registering an entry does not make
    it checkable.
  - New `apiManagementConfig.syncPermissions` (default `false`) and
    `apiManagementConfig.onCodePermissions`.

  **`@igrp/framework-next` — permission catalog sync**

  - New `igrpSyncPermissions`, wired as a fourth arm of the existing startup-sync
    pipeline alongside routes and menus. Gated by `syncPermissions` on top of the
    existing `syncAccess` / `previewMode` gates, so enabling the capability cannot
    make an existing deployment start writing to the shared AM without opting in.
  - Idempotent upsert keyed on `name`; entries removed from the catalog are not
    deleted in AM. An empty catalog is skipped rather than sent as an empty upsert.
  - `planAccessManagementSync` validates catalog names against
    `^[A-Za-z0-9._-]{1,255}$` and **skips** malformed entries with a warning
    instead of throwing — one bad name should not stop an app from booting. It
    also warns off-production when a catalog name contains a dot, because
    `claimsAllow` treats such a name as already department-qualified and a
    bare-name check would silently deny.
  - `id` is omitted from the wire payload rather than sent as `0`, which a backend
    matching on id could misread as an update.

  Both permission-gating changes above are additive: each affects only states that
  previously failed outright.

- Updated dependencies [f3e0c00]
  - @igrp/framework-next-auth@0.1.0-beta.145

## 0.1.0-beta.146

### Patch Changes

- 3847b8b: Add token-claims permission gating: `decodeIgrpClaims`/`claimsAllow` (`@igrp/framework-next-auth/claims`), server helpers `igrpGetClaims`/`igrpAuthorize`/`igrpAssertAuthorize` (`@igrp/framework-next`), and client `IGRPSectionPermissions`/`usePermissions`/`IGRPAuthorization`/`IGRPGuardPage`/`IGRPForbidden` (`@igrp/framework-next-ui`).
- 41d8a51: `IGRPMenuItemArgs.id` is now optional (`id?: number`) to match the runtime
  `MenuEntryDTO.id?: number`, removing a type that promised an always-present id.
- Updated dependencies [3847b8b]
- Updated dependencies [a274c6e]
- Updated dependencies [c9cd44b]
- Updated dependencies [3b808b8]
- Updated dependencies [7d48f03]
  - @igrp/framework-next-auth@0.1.0-beta.144

## 0.1.0-beta.145

### Patch Changes

- 5b335b8: feat: honor showNotifications flag in nav-user — hide the Notifications dropdown item (header and sidebar) when notifications are disabled, and add showNotifications to IGRPSidebarDataArgs
- Updated dependencies [5b335b8]
  - @igrp/framework-next-auth@0.1.0-beta.143

## 0.1.0-beta.144

### Patch Changes

- fc2fe20: - `next-auth`: add `console.error` diagnostics when introspection marks the refresh token inactive or when `refreshOidcAccessToken` returns an error flag or throws — makes login-loop root causes visible in server logs
  - `next`: replace `unstable_cache` with `React.cache()` in `use-user` — prevents stale 401s caused by rotating access tokens being embedded in the `unstable_cache` key
- Updated dependencies [fc2fe20]
  - @igrp/framework-next-auth@0.1.0-beta.142

## 0.1.0-beta.143

### Patch Changes

- e51050a: feat: add showMenuSearch flag to IGRPSidebarDataArgs to control sidebar menu search visibility
- Updated dependencies [a9b2297]
  - @igrp/framework-next-auth@0.1.0-beta.141

## 0.1.0-beta.142

### Patch Changes

- Updated dependencies [5ebe890]
  - @igrp/framework-next-auth@0.1.0-beta.140

## 0.1.0-beta.141

### Patch Changes

- Updated dependencies [4e0137a]
  - @igrp/framework-next-auth@0.1.0-beta.139

## 0.1.0-beta.140

### Patch Changes

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.138

## 0.1.0-beta.139

### Patch Changes

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.137

## 0.1.0-beta.138

### Patch Changes

- Updated dependencies [7a89144]
  - @igrp/framework-next-auth@0.1.0-beta.136

## 0.1.0-beta.137

### Patch Changes

- 6b42572: - Coordinated maintenance release: bump all framework packages to the next beta to keep versions aligned across the framework.
- Updated dependencies [6b42572]
  - @igrp/framework-next-auth@0.1.0-beta.135

## 0.1.0-beta.136

### Patch Changes

- ba91edb: feat: gate menu-role sync on `IGRP_SYNC_ON_CODE_MENU_ROLES`

  The on-code menu push can now control the `syncRoles` argument of
  `client.m2m.syncApplicationMenus(appCode, menus, syncRoles)`.
  - **next-types**: new optional `apiManagementConfig.syncOnCodeMenuRoles?: boolean`. Defaults to `true` (matching the AM client default) when omitted.
  - **next**: `igrpSyncMenus` now requires a `syncRoles` arg and forwards it as the third parameter of `syncApplicationMenus`; `planAccessManagementSync` derives `syncOnCodeMenuRoles` from config (`true` unless explicitly `false`) and `igrpStartupSync` threads it through.

  Only consulted when the on-code menu push actually runs (`IGRP_SYNC_ON_CODE_MENUS=true` plus the outer `IGRP_SYNC_ACCESS` / `IGRP_PREVIEW_MODE` gates). Outer gating is unchanged.

- Updated dependencies [b88c4b1]
  - @igrp/framework-next-auth@0.1.0-beta.134

## 0.1.0-beta.135

### Patch Changes

- Updated dependencies [f89e1ab]
- Updated dependencies [ec48e46]
  - @igrp/framework-next-auth@0.1.0-beta.133

## 0.1.0-beta.134

### Patch Changes

- 0cdef39: docs(next-types): remove stale m2mScope JSDoc

  The JSDoc block above `appRoutes` in `apiManagementConfig` documented an `m2mScope` field that no longer exists (removed during the OAuth2 client_credentials migration 08). Removed the orphaned doc.

- 123e361: feat(next-types): add `syncOnCodeMenus` and `onCodeMenus` to `apiManagementConfig`

  Two new optional fields on `IGRPConfigArgs['apiManagementConfig']`:
  - `syncOnCodeMenus?: boolean` — when true, the framework pushes `onCodeMenus` to Access Management at startup.
  - `onCodeMenus?: IGRPMenuItemArgs[]` — the template-defined menu array used as the push payload.

  Both are optional; omitting them keeps the current (post-migration-08) no-push behavior.

- Updated dependencies [12cc11b]
- Updated dependencies [12cc11b]
- Updated dependencies [12cc11b]
- Updated dependencies [cc40fef]
- Updated dependencies [cc40fef]
  - @igrp/framework-next-auth@0.1.0-beta.132

## 0.1.0-beta.133

### Patch Changes

- 2196ef8: feat(types)!: migrate `apiManagementConfig` to OAuth2 `client_credentials`

  **Breaking** changes to `IGRPConfigArgs['apiManagementConfig']`:
  - **Removed** `m2mToken` — replaced by `m2mClientId` + `m2mClientSecret` (OAuth2 client_credentials). The downstream library (`@igrp/platform-access-management-client-ts`) still exposes `M2MClientConfig.token` as `@deprecated` for legacy pinning if needed.
  - **Removed** `syncOnCodeMenus` — the field had no effect. All sync phases (application, routes, menus) are gated on the top-level `syncAccess` flag in `IGRPRootLayout`.
  - **Renamed** `m2mServiceId` → `serviceId`. The value is service identity (resource name + `X-Machine-Service-ID` header), not an auth credential. The new prefix discipline: `m2m*` is reserved for OAuth2 credentials only.
  - **Added** required `m2mClientId: string` and `m2mClientSecret: string` for OAuth2 client_credentials authentication.

  Migration: rename `m2mServiceId` → `serviceId` and `m2mToken` → `m2mClientId`/`m2mClientSecret` in your `igrpBuildConfig` call. The TypeScript error guides the rename. See `templates/demo-v1/src/igrp.template.config.ts` for the canonical shape.

- Updated dependencies [2a0ef32]
  - @igrp/framework-next-auth@0.1.0-beta.131

## 0.1.0-beta.132

### Patch Changes

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.130

## 0.1.0-beta.131

### Patch Changes

- f8dc318: feat: remove showSidebar/showHeader from IGRPConfigArgs

## 0.1.0-beta.130

### Patch Changes

- Updated dependencies [f283926]
  - @igrp/framework-next-auth@0.1.0-beta.129

## 0.1.0-beta.129

### Patch Changes

- fe2ed3d: - Update `@types/node` to v25.7.0 across all framework packages
  - Bump `typescript-eslint` and `vitest` to latest versions
- Updated dependencies [fe2ed3d]
  - @igrp/framework-next-auth@0.1.0-beta.128

## 0.1.0-beta.128

### Patch Changes

- Updated dependencies [4e9ecd5]
  - @igrp/framework-next-auth@0.1.0-beta.127

## 0.1.0-beta.120

### Patch Changes

- Updated dependencies [939446a]
  - @igrp/framework-next-auth@0.1.0-beta.120

## 0.1.0-beta.119

### Patch Changes

- Updated dependencies [20a0850]
- Updated dependencies [2137c48]
  - @igrp/framework-next-auth@0.1.0-beta.119

## 0.1.0-beta.118

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.118

## 0.1.0-beta.117

### Patch Changes

- 724398a: Replace Keycloak and Autentika providers with a single generic `oauth2` OIDC provider.

  **Breaking changes:**
  - `AUTH_PROVIDER` now accepts `oauth2` or `none` only (`keycloak` and `autentika` are removed)
  - `AUTH_PROVIDER` defaults to `oauth2` (previously defaulted to `keycloak`)
  - `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER` env vars removed
  - `AUTENTIKA_CLIENT_ID`, `AUTENTIKA_CLIENT_SECRET`, `AUTENTIKA_HOST`, `AUTENTIKA_TENANT_NAME`, `AUTENTIKA_SCOPES` env vars removed
  - `KEYCLOAK_PROVIDER_ID` and `AUTENTIKA_PROVIDER_ID` named exports removed from all entry points

  **Migration:** Replace with `OAUTH2_CLIENT_ID`, `OAUTH2_CLIENT_SECRET`, `OAUTH2_ISSUER`, `OAUTH2_SCOPES` (optional, defaults to `openid`). The redirect URI to register on your server is `{NEXTAUTH_URL}/api/auth/callback/oauth2`.

- Updated dependencies [724398a]
  - @igrp/framework-next-auth@1.0.0-beta.117

## 0.1.0-beta.116

### Patch Changes

- beta.116 — template migrator CLI, lock file relocation, and release tooling fixes.

  @igrp/template-migrator
  - New CLI package that automates IGRP template upgrades via `pnpm dlx @igrp/template-migrator@latest`.
  - Bundles all 6 demo-v1 migration guides (01–06) as a cumulative manifest with embedded payloads.
  - Commands: status, plan, apply (--yes / --to), list, rollback, check (CI gate).
  - Lock file moved from root `.igrpmigrations.lock.json` → `.igrpmigrations/lock.json`; backward-compat read of old path on first run.
  - Prebuild pack script cleans payload output on every run to prevent stale files.
  - tsup config: shims disabled (no \_\_dirname polyfill injection before shebang), banner removed (shebang lives in src/cli.ts line 1).

  @igrp/framework-next-template (templates/demo-v1)
  - `.igrpmigrations/lock.json` pre-seeded to mark all 6 migrations as applied.
  - `create-zip-template.ps1` updated to strip migration guides and payloads from the published zip — only `lock.json` is included so consumers start fully up-to-date.
  - `MIGRATING.md` added: end-user upgrade guide (status → plan → apply workflow).

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.116

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

  @igrp/framework-next-template (templates/demo-v1)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-v1/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.115

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

  @igrp/framework-next-template (templates/demo-v1)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-v1/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

- Updated dependencies
  - @igrp/framework-next-auth@0.1.0-beta.114
