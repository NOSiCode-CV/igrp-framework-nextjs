---
'@igrp/framework-next-ui': patch
'@igrp/framework-next': patch
'@igrp/framework-next-auth': patch
'@igrp/framework-next-types': patch
---

Fix a silent React Compiler bailout, three stale-state bugs in the app shell, a
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
Because the error is raised *inside a `.d.ts`*, the near-universal
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
leaked the surrounding template: searching `` a$`b `` rendered
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
  re-applied raw values *after* the defaults resolved, so an explicit
  `position: undefined` beat the `'bottom-right'` default.

### `@igrp/framework-next-auth`: `useOptionalSession`

`./client` gains `useOptionalSession` (and the raw `SessionContext` it reads).
`useSession()` throws without a provider and `useSafeSession` delegates straight
to it, so neither can serve a component that must also render standalone —
`IGRPSectionPermissions` does, and was reaching into `next-auth/react` directly
for the context. It returns `null` for "no provider mounted", which means
*cannot tell*, not "unauthenticated"; a permission gate must keep its
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
