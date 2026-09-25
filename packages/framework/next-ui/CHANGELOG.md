# @igrp/framework-next-ui

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
- 23343a3: Stop pointing developers at `IGRP_SESSION_REFETCH_INTERVAL`, which nothing
  reads.
  
  `@igrp/framework-next` — the claims-expired error returned by
  `src/lib/permissions.ts` told the reader their poll interval was "too high" and
  named the env var as the thing to lower. Following that advice does nothing.
  The message now names what actually recovers the session (`IGRPSessionWatcher`
  scheduling a refresh from `session.expiresAt`) and what to check when it does
  not: that the watcher is mounted, and that the IdP is still issuing refresh
  tokens.
  
  `@igrp/framework-next-ui` — the comment in `IGRPSessionWatcher` describing the
  fallback poll cited the env var and a "default 150s" that has not been true
  since the adaptive scheduler landed. It now points at `sessionArgs.refetchInterval`
  and states there is no env var for it.
  
  Comment and message text only; no behavioural change.
- 4b5338f: Second review pass: fix packaging, input plumbing and three broken component behaviours.
  
  **Packaging — the published `dist` was not loadable by Node (all three packages)**
  
  Each package declares `"type": "module"`, so Node applies ESM resolution to `dist`,
  which requires fully specified paths. Babel copied relative specifiers through
  untouched, so `./components/horizon/button` stayed extensionless and a native
  `import()` failed with `ERR_MODULE_NOT_FOUND` — 165 such specifiers in the design
  system's `index.js`, and 167 in the published `0.1.0-beta.147` tarball. Bundlers
  probe extensions themselves, which is why it went unnoticed. A new Babel plugin
  (`scripts/babel-plugin-add-import-extension.cjs`) resolves each specifier against
  the source tree and appends `.js` (or `/index.js` for a directory), and
  `build-pipeline.test.ts` now fails if any slip through.
  
  **`IGRPInputSearch` — the debounce never debounced**
  
  `isDebouncedCallback` was called during render, so every render produced a new
  closure with a new `timeout` binding and `clearTimeout` never had anything to
  cancel. Typing five characters fired `onSearch` five times, each delayed by
  `debounceMs` (default 2000), so a handler wired to a request issued one request
  per keystroke, all landing later and out of order. It is now a `useDebouncedCallback`
  hook holding the timer in a ref, with cleanup on unmount.
  
  **`IGRPSelect` — three defects**
  
  - The `value` prop only seeded a reducer, so it was write-once: changing it after
    mount did nothing despite being documented as controlled.
  - In form mode the trigger label came from `formContext.getValues()` inside a
    `useMemo` that did not depend on the form value. `getValues` is not reactive, so
    `form.setValue()` moved the field on while the trigger kept the previous label.
    (`form.reset()` happened to work.) It now derives from `field.value`.
  - `showSearch` rendered a text input inside Radix's `SelectContent`, whose typeahead
    intercepts printable keys and pulls focus back to the matching item — only the
    first character ever landed. Typing "min" left "m" in the box. The input now stops
    propagation for typing keys while letting Escape/Tab/Enter/arrows reach Radix.
  - Group headings were derived from the unfiltered options, so a group whose options
    were all filtered out still rendered an empty heading.
  - Dropped a hand-rolled `aria-expanded` on the trigger that duplicated (and could
    contradict) the one Radix manages.
  
  **Inputs — IGRP-only props leaked to the DOM, and `inputClassName` did nothing**
  
  `IGRPInputProps` unions `IGRPBaseAttributes` with `React.ComponentProps<"input">`, so
  components forwarding rest props rendered `iconname`, `iconsize`, `inputclassname`
  and friends as invalid DOM attributes. Affected `IGRPTextarea`, `IGRPInputTime`,
  `IGRPInputHidden`, `IGRPInputPassword`, `IGRPInputUrl` and `IGRPInputPhone`.
  A new `igrpOmitNonDomProps` helper strips them. Along the way `inputClassName` —
  advertised by every input's public type but implemented only in `IGRPInputText` and
  `IGRPInputColor` — now works in textarea, time, password, url and phone, and
  `className` no longer doubles as the label's class in textarea, time and phone.
  `IGRPTextarea` gains `labelClassName` / `inputClassName`, which its `Pick` omitted.
  
  **`IGRPPdfViewer`**
  
  - **Default viewer changed from `"google"` to `"native"`.** The previous default sent
    every document URL to `https://docs.google.com/viewer?url=…`, so Google received —
    and had to be able to fetch — the URL. That is the wrong default for a government
    framework, and it was also the least robust: `"google"` has no fallback, while the
    nested components already defaulted to `"auto"`. Pass `viewerPreference="google"`
    explicitly to restore the old behaviour.
  - Removed a hardcoded 1-second `setTimeout` that hid the document list behind a
    spinner on mount regardless of whether anything was loading.
  - The `document` prop shadowed the global in four components; it is now aliased on
    destructuring. The public prop name is unchanged.
  
  **Removed `src/components/theme-provider.tsx`**
  
  Dead code: exported from nothing, imported by nothing. It was a second theme system
  that wrote `html.light/dark` and `localStorage["theme"]` directly — the keys
  `next-themes` owns — read `localStorage` in a `useState` initialiser (a `ReferenceError`
  on any server render), bound a global unmodified `d` keypress to toggle the theme with
  no opt-out, and removed its transition-suppressing `<style>` inside nested
  `requestAnimationFrame`, so switching theme in a background tab left every CSS
  transition on the page disabled. Theming goes through `next-themes` via
  `IGRPThemeProvider`, which is unaffected.
  
  **Lint**
  
  `igrp/token-policy` now also runs on `src/lib/**`. It was scoped to components only,
  so a raw palette colour added to `IGRPColors` — the map every badge, alert, card and
  stats-card pulls classes from — passed `pnpm lint` and shipped to every consumer of
  that slot.
  
  **`IGRPInputHidden` emitted visible layout**
  
  In form mode it rendered through `IGRPFormField`, which is a *layout* wrapper: an
  outer div, a `FormItem` (`flex flex-col gap-2`) and an inner flex row around the
  control. The input is `display:none`, but those three divs are not — inside a form
  laid out with `gap-*`, every hidden field consumed a gap and left a visible blank
  band. It now uses `Controller` directly and emits the input alone, with no wrapper
  markup. It also renders a bare `<input>` instead of the `Input` primitive (whose
  forty-odd sizing and border utilities are inert on a hidden element; `data-slot="input"`
  is preserved), and no longer forwards `required`, which is not a valid attribute on
  `type="hidden"`.
  
  Note: a validation error on a hidden field no longer renders a `FormMessage`. It had
  nowhere sensible to appear and the user cannot act on it; surface such errors through
  the form's global error instead.
  
  **Prop leaks: completing the round-two fix (14 more components)**
  
  The earlier pass fixed the components that had been found leaking and added a
  regression test covering exactly those — which made a partial fix look complete.
  Sweeping the whole surface found fourteen more forwarding IGRP-only props to the
  DOM: `IGRPDateTimeInput`, `IGRPInputSearch`, `IGRPInputFile`, `IGRPInputNumber`,
  `IGRPCheckbox`, `IGRPSwitch`, `IGRPRadioGroup`, `IGRPInputAddOn`, `IGRPButton`,
  `IGRPBadge`, `IGRPAvatar`, `IGRPStatsCard`, `IGRPHeadline` and `IGRPLink` — landing
  attributes such as `iconname` and `inputclassname` on `button`, `div`, `span` and
  `a` elements.
  
  The regression test is now exhaustive by construction: alongside the per-component
  assertions it walks `src/components`, collects every file whose props type mentions
  `IGRPBaseAttributes` or `IGRPInputProps`, and fails if any of them is missing from
  the sweep. A new component that forgets the guard cannot pass CI.
  
  Also fixed while there: `className` was reaching the label instead of the wrapper in
  `IGRPDateTimeInput` and `IGRPInputFile` (both now take `labelClassName`), and in
  `IGRPDateTimeInput` `className` was not applied to the field at all, so the
  documented prop did nothing.
  
  **Date inputs only accept a value written in `dateFormat`**
  
  `parseDateInput` (public API, and what `IGRPDatePickerInputSingle` parses typed text with)
  was strict about separators and year width but lenient about day and month width: with
  `dateFormat="dd-MM-yyyy"` it accepted `1-8-2026` and `26-8-2026`, which are not what that
  format renders. The rule is now a round trip — parse the text, re-render it with the same
  `dateFormat`, and require a match — so a value is accepted only when it is written the way
  the format writes it. This also replaces a string-length heuristic that stood in for
  validation on formats with named months, so `dd MMM yyyy` now takes `26 Aug 2026` and
  rejects `26 aug 2026` and `26 August 2026`.
  
  A format whose tokens are single letters (`d-M-yyyy`) additionally accepts the zero-padded
  spelling, because `maskDateInput` has to commit to a width while the user is still typing and
  pads to two; without that the mask would fight the parser and such a field would accept
  nothing at all. For `dd-MM-yyyy` the padded form *is* the format, so nothing is loosened.
  
  `maskDateInput` no longer zero-pads a four-digit year when a separator closes it early.
  Padding `26` to `0026` turned a half-typed year into a well-formed date in the year 26 — with
  `yyyy-MM-dd`, entering `26-08-2026` was silently accepted as `0026-08-20`.
  
  Typing is unchanged: the mask still rewrites keystrokes into `dateFormat`, so `1-8-2026` in a
  `dd-MM-yyyy` field still becomes `01-08-2026` and commits. What now gets rejected is text the
  mask cannot bring into shape — a pasted `2026-08-26` in a day-first field, a short year, a
  named month in the wrong case.
  
  **Dependency updates**
  
  `cn` 0.2.6 → 0.3.0 and `react-dropzone` 20.1.1 → 20.1.2 (runtime), plus `vitest`,
  `zod`, `react-hook-form` and `eslint-plugin-react-refresh` on the dev side, aligned
  across the workspace.
  
  `cn` is the class merger behind all 85 of its call sites, so it was diffed against
  0.2.6 rather than assumed: 1 624 cases built from the design system's own 712 class
  strings (single, base-plus-override and conditional forms) plus 31 Tailwind conflict
  pairs produced zero differences, and the export surface is unchanged. Its one real
  break is dropping `./package.json` from the exports map, which nothing here imports.
  
  **`@babel/*` is deliberately NOT updated to 8.x.** Re-tested against the current
  releases — `@babel/core` 8.0.5 with `babel-plugin-react-compiler` 1.0.0 — and it still
  fails exactly as before: the compiler cannot lower a destructured parameter with a
  default value, and `@babel/preset-react` 8 emits `react/jsx-dev-runtime` under the env
  the build scripts run in. See the header of `scripts/react-compiler-babel-config.cjs`.
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
  is TS2834 — and because the error is raised *inside a `.d.ts`*, the
  near-universal `skipLibCheck: true` swallows it. Every type in the package then
  resolved to `any`, with no diagnostic anywhere: a consumer could write
  `const x: IGRPMenuItemArgs = { totallyWrong: 123 }` and compile clean.
  
  Relative imports now carry an explicit `.js` extension, which `moduleResolution:
  "bundler"` (what every in-repo consumer uses, and why nothing caught this)
  accepts unchanged. No API change — but a `nodenext` consumer that was compiling
  green may now see real type errors for the first time.
  
  ### The AM contract gate could not see a missing field
  
  
  `contract/am-contract.ts` asserted DTO → framework *assignability*, which proves
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
    so the key-coverage check still fails on any *other* new DTO field: widening
    the browser payload has to be a decision someone writes down.
  - **`IGRPConfigClient` had a signature no template could use** — it read
    `() => Promise<IGRPConfigArgs>` and its docs pointed at a *default* export,
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
    proved one way: a member sonner *gained* would have left the framework union
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
    every render in *both* modes and keeps most of what they return in production;
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
- 6fc5bad: App switcher: items now show a pointer cursor and a trailing arrow when
  highlighted.
  
  Each application entry and the Applications Center entry get `cursor-pointer`
  and an `ArrowRight` icon that fades and slides in on hover or keyboard focus.
  Reduced-motion users see it appear without the transition. Long application
  names now truncate instead of pushing the arrow out of the menu.
- 1237546: Fix the header command palette crashing the whole header when opened (Ctrl+K / ⌘K).
  
  `IGRPTemplateCommandSearch` rendered `CommandInput` / `CommandList` directly inside the design system's `CommandDialog`. The current (shadcn-shaped) `CommandDialog` renders its children straight into `DialogContent` and no longer supplies the cmdk root, so `CommandInput` threw `Cannot read properties of undefined (reading 'subscribe')` on mount and `IGRPLayoutErrorBoundary` replaced the header with "Falha ao carregar o cabeçalho". The palette content is now wrapped in the design system's `Command`, matching the upstream shadcn composition. Filtering, grouping and the pt-PT labels are unchanged.
  
  Apps that compose `CommandDialog` / `IGRPCommandDialog` themselves need the same wrapper: `<CommandDialog><Command>…</Command></CommandDialog>`.
- 6fc5bad: Command palette: roomier layout. The box, input, group headings and separators
  get more padding, the input is taller, and items are larger with a gap between
  them and a pointer cursor. These styles apply only to `IGRPTemplateCommandSearch`
  and don't affect other `Command` surfaces.
- 55d4edf: The root barrel no longer carries `'use client'`. With it, any server component importing from `@igrp/framework-next-ui` (framework-next's layouts, a template page) registered the entire package as its client reference, so every page shipped every template component. Every leaf module already declared its own directive; `src/__tests__/client-boundaries.test.ts` now guards the barrel and the directive-free modules.
- 6fc5bad: Fix unreadable text on the highlighted user-menu item.
  
  `IGRPNavUser` painted the hovered item `bg-primary`, but the design-system
  dropdown item recolours every descendant on focus
  (`focus:**:text-accent-foreground`), and Radix focuses items on pointer-over. So
  the label and icon rendered dark on the dark primary fill. The override now keys
  on `focus:` and reaches the descendants. This also covers keyboard navigation,
  which the old `hover:` rule never styled.
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
- 913ff18: Fix the Babel build and a batch of design-system component defects found in review.
  
  **Build pipeline (affects all three React packages)**
  
  - Pin the Babel toolchain back to 7.x. `babel-plugin-react-compiler` is built against
    the Babel 7 AST; under `@babel/core` 8 its HIR lowering fails on every destructured
    parameter carrying a default value, and the compiler swallows those errors per
    function and emits the original code. The build stayed green while memoization
    silently disappeared — 443 bailouts across 71 design-system files, with only 67 of
    184 emitted modules keeping a memo cache. Now 8 bailouts across 6 files (genuine
    per-component limitations) and 110 memoized modules.
  - Bump `babel-plugin-react-compiler` to the 1.0.0 stable release.
  - Pin `development: false` on `@babel/preset-react`. On 8 the flag follows
    `api.env()`, and the build scripts set no `NODE_ENV`, so every package emitted
    `react/jsx-dev-runtime` imports in place of `react/jsx-runtime`.
  - Drop the unused `@babel/preset-env` / `@types/babel__preset-env` dev dependencies;
    the shared config deliberately never used them.
  - Add `src/build-pipeline.test.ts`, which asserts on emitted output so neither
    failure can recur unnoticed.
  
  **Packaging**
  
  - Move `shadcn` from `dependencies` to `devDependencies`. It is an authoring-time
    CLI that nothing under `src/` imports, and every consuming app was installing it.
  - Pin `cn` and `radix-ui` to exact versions, matching their neighbours.
  
  **i18n**
  
  - Add `formList`, `inputFile` and `copyTo` string groups, plus `chat.errorMessage`
    and four `dataTable` filter placeholders. `IGRPFormList`, `IGRPInputFile`,
    `IGRPCopyTo` and the data-table filters hardcoded Portuguese with no override path.
  - Add a `locale` prop to `IGRPI18nProvider` (default `pt-PT`) with a `useIGRPLocale`
    hook and the `IGRP_DEFAULT_LOCALE` constant. `IGRPInputNumber`, the data-table date
    filter and `IGRPPdfViewer` formatted with `Intl`'s runtime-default locale, which
    resolves differently on the server and in the browser and hydrated mismatched.
  - Export `igrpFormatMessage` for catalog strings with `{token}` placeholders.
  
  **Components**
  
  - `IGRPFormList`: the first item could not be collapsed — collapsing was
    indistinguishable from "not yet chosen", so it sprang back open. The remove button
    rendered on the last item of a list that refuses to go empty, where clicking it did
    nothing. Standalone mode keyed rows by index, so removing a row re-keyed every row
    after it and lost focus and local state inside `renderItem`. Also drops `forwardRef`
    for React 19 ref-as-prop, removing a cast and a `@ts-expect-error`.
  - `IGRPInputNumber`: `className` was applied to the label as well as the root; it now
    reads the existing `labelClassName` prop. `onChange` now fires with `undefined` when
    the field is cleared — clearing was previously unobservable, and the `onChange` type
    widened to `(value: number | undefined) => void` to match. The `Intl.NumberFormat`
    instance is memoized instead of rebuilt every render, and locale separators are
    cached rather than recomputed per keystroke.
  - `IGRPInputFile`: remove buttons in the dropzone all shared the accessible name
    "Remover"; they now name their file. File rows are keyed by file identity rather
    than index. `maxSize={0}` / `maxFiles={0}` rendered a literal `0`. The dropzone's
    file list now clears on `form.reset()`.
  - `IGRPChat`: a rejected `fetch` escaped as an unhandled rejection and left the
    composer disabled permanently; every exit path now clears the loading state. The
    user avatar icon uses `text-primary-foreground` against its `bg-primary` backdrop.
  - `IGRPTextList`: the staggered reveal leaked one `setTimeout` per item, firing after
    unmount and landing stale indices on a changed list.
  - `IGRPIcon`: an unknown icon name no longer warns during render, and the fallback
    glyph keeps the caller's `size`, `className` and `id` instead of collapsing layout.
  - `IGRPStatsCard`: `{...props}` was spread before the interactive handlers, so a
    caller's `onClick` was silently discarded.
  - Data-table date filter: controlled open state instead of remounting the whole
    popover via `key` to close it.
  - Add `"use client"` to `primitives/carousel`, `primitives/form`, `primitives/sidebar`
    and `theme-provider`, which upstream shadcn ships with it.
  
  **Lint**
  
  `pnpm lint` was failing on two upstream shadcn files. The rules they don't satisfy are
  now scoped off in `eslint.config.js` rather than the files being edited, which would
  create permanent drift on every shadcn release.
- 7b437c3: Build with a single Babel pass over `src/`, and fix the React Compiler gate.
  
  **The bug.** The React Compiler step gated on a literal `'use client'`
  (single-quoted) substring. `design-system` formats with Prettier
  `singleQuote: false`, so its output emits `"use client"` and the gate matched
  nothing — the compiler was a silent no-op across the entire package while the
  build still exited 0. The check is now quote-agnostic.
  
  **The cause.** The compiler ran as a second Babel pass over `dist/`, so it was
  analysing generated output rather than the code as written — which is both why
  the bug was invisible and why coverage was poor even where the gate did match.
  SWC, `.swcrc`, `dist_optimized` and `swap-dist.mjs` are gone; `build:js` now
  runs Babel once over `src/` (TypeScript strip, JSX, React Compiler) and
  `build:types` emits declarations. Output is unchanged in shape — file-per-module
  ESM at esnext, no bundling, no minification, no `@babel/preset-env` — because
  `templates/demo-v1` consumes `dist/` directly.
  
  Verified identical across all three packages: same emitted file list, same
  `use client` / `use server` boundaries (zero lost). Memoized modules rose from
  22 to 69 in `design-system` and 11 to 24 in `framework-next-ui`.
  
  **Also.** The compiler's skip rule tested substrings (`context`, `provider`,
  `index`, ...) against the whole file *path*, excluding every barrel and
  everything under a `providers/` directory regardless of content; it now tests
  the contents for `createContext`. `"use no memo"` remains the per-file opt-out.
  Compiled tests and their `.d.ts` no longer ship in the published tarballs.
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
- Updated dependencies [45d1285]
- Updated dependencies [e84e8d6]
- Updated dependencies [6fc5bad]
- Updated dependencies [6fc5bad]
- Updated dependencies [1eadf0f]
- Updated dependencies [e84e8d6]
- Updated dependencies [55d4edf]
- Updated dependencies [e84e8d6]
- Updated dependencies [e84e8d6]
- Updated dependencies [e84e8d6]
- Updated dependencies [e84e8d6]
- Updated dependencies [23343a3]
- Updated dependencies [6fc5bad]
- Updated dependencies [a0e6d3d]
- Updated dependencies [4b5338f]
- Updated dependencies [7b437c3]
- Updated dependencies [7b437c3]
- Updated dependencies [147f51a]
- Updated dependencies [913ff18]
- Updated dependencies [1eadf0f]
- Updated dependencies [ccfaeec]
- Updated dependencies [39eb67c]
- Updated dependencies [23343a3]
- Updated dependencies [90d5a73]
- Updated dependencies [8a6ecbe]
- Updated dependencies [1237546]
- Updated dependencies [342a9ba]
- Updated dependencies [147f51a]
- Updated dependencies [7b437c3]
- Updated dependencies [7b437c3]
- Updated dependencies [2c09827]
- Updated dependencies [913ff18]
- Updated dependencies [913ff18]
- Updated dependencies [e0015f2]
- Updated dependencies [7b437c3]
- Updated dependencies [913ff18]
- Updated dependencies [7b437c3]
- Updated dependencies [75fd1bc]
- Updated dependencies [e900763]
- Updated dependencies [2c09827]
- Updated dependencies [02bc0a8]
  - @igrp/igrp-framework-react-design-system@0.2.0-beta.1
  - @igrp/framework-next-types@0.2.0-beta.1
  - @igrp/framework-next-auth@0.2.0-beta.1

## 0.2.0-beta.0

### Minor Changes

- Start the `0.2.0-beta` pre-release line (from `0.1.0-beta.*`). No code changes relative to the last `0.1.0-beta` build on this branch.

## 0.1.0-beta.168

### Patch Changes

- - Framework packages no longer declare their internal `@igrp/*` siblings as exact-version peer dependencies. They are regular dependencies again, so installing or upgrading a single framework package no longer emits unmet-peer warnings across the whole set.
  - `@igrp/framework-next` widens its `zod` peer range from the exact `4.5.0` to `^4.5.0`, so an app on any `4.5.x` (the template ships `4.5.4`) satisfies it.
  - `@igrp/template-migrator` ships migration `30-resync-beta166-deps`, which carries a CLI-upgraded app's dependency set forward to the beta.166 framework release — including `zod`, `react-hook-form`, `@tanstack/react-query` and `@types/react-dom`, which no earlier migration had ever pinned.
- - The design system now requires `zod` `^4.5.0` instead of `^4.4.0`, matching the range `@igrp/framework-next` already declares. Apps on zod `4.4.x` must upgrade to `4.5.x`.
  - `@igrp/framework-next-ui` pins `react`, `react-dom` and `next-auth` as devDependencies so it builds and typechecks against the same versions every other framework package uses, instead of whatever the workspace happened to hoist.
  - `@igrp/template-migrator` gains a typecheck config for its `scripts/` folder; no change to the published CLI or migration set.
- feat(header): inject consumer components into the template header via `headerSlots`

  `IGRPLayoutFull` accepts a new `headerSlots` prop, letting an app render its own
  components in positions the framework owns: `start` (left region, after the
  logo/title), and `search`, `notifications`, `settings` and `actions` in the right
  cluster. `IGRPTemplateHeader` gains the matching `slots` prop and exports the
  `IGRPHeaderSlots` type.

  The framework still fetches and owns all header data — user, logo, breadcrumbs,
  sidebar trigger. A slot only replaces what renders in its position. `showSearch`,
  `showNotifications` and `showSettings` continue to gate their positions; `start`
  and `actions` are gated by the presence of the node. Each slot renders inside its
  own `<Suspense>`, so an async Server Component slot cannot delay the rest of the
  bar. Supplying a `notifications` slot also suppresses nav-user's link-only
  Notifications entry, which the injected component doesn't own.

  Also fixes the built-in command palette, which `IGRPTemplateHeader` mounted with
  no `commands` prop — `⌘K` opened a palette that could never contain anything. The
  template now supplies a menu-derived palette through the `search` slot, shipped as
  template migration `34-header-slots-and-app-search`.

- fix(next-ui): make "Tentar novamente" actually retry in the header/sidebar error fallbacks

  `IGRPLayoutErrorBoundary` latched `hasError` permanently, so the `router.refresh()`
  behind the retry button re-fetched the server tree but the boundary kept rendering
  `IGRPSidebarError` / `IGRPHeaderError` — the button appeared to do nothing.

  The boundary now exposes a reset through context (`useIGRPLayoutErrorReset`), and
  both fallbacks use the new `useIGRPLayoutRetry` hook: it refreshes inside a
  transition and clears the boundary only once that transition settles, so the
  boundary re-renders the freshly fetched tree instead of the failing one. The retry
  button also shows a loading state while the refresh is in flight.

  `useIGRPLayoutRetry` and `useIGRPLayoutErrorReset` are exported for consumers
  writing their own layout error fallbacks.

- Fix `@igrp/framework-next-ui/tokens`: its CSS imported the design system's removed `/styles` entry, so any consumer importing the tokens entry (as documented in the README) failed to compile with `"./styles" is not exported`. It now re-exports `@igrp/igrp-framework-react-design-system/tokens`, and the README CSS section was updated to match.
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

- - Fixed the sidebar menu search: results now show the item's icon, highlight the matched text, and display a result count, matching the visual style of the rest of the menu.
  - Added a clear ("×") button to the search field and disabled spellcheck/autocomplete, removing the browser's red squiggly underline on typed queries.
  - Replaced the plain "no results" text with a dashed empty-state card (icon + quoted query), consistent with the existing "no menus" empty state.
- fix(next-ui): don't crash the layout on runtime-supplied image hosts

  `IGRPTemplateAppSwitcher` and `IGRPTemplateHeader` rendered app pictures and the
  header logo with `next/image` using the default loader, which throws
  "hostname is not configured under images" for any host missing from the
  consuming app's `images.remotePatterns`. The throw escaped to
  `IGRPLayoutErrorBoundary` and took the whole sidebar/header down. Since these
  URLs come from the access-management backend at runtime, consumers cannot
  whitelist every host up front.

  Both now render through a new internal `IGRPTemplateImage`, which marks remote
  sources `unoptimized` (bypassing the hostname check) and falls back to the icon
  — or, for the header, to the bundled logo — when an image fails to load.

- Updated dependencies
- Updated dependencies [fd98d4c]
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @igrp/framework-next-types@0.1.0-beta.149
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.146
  - @igrp/framework-next-auth@0.1.0-beta.146

## 0.1.0-beta.167

### Patch Changes

- Updated dependencies [7ffc339]
- Updated dependencies [928c46b]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.145

## 0.1.0-beta.166

### Patch Changes

- bc0ddb6: feat(header): inject consumer components into the template header via `headerSlots`

  `IGRPLayoutFull` accepts a new `headerSlots` prop, letting an app render its own
  components in positions the framework owns: `start` (left region, after the
  logo/title), and `search`, `notifications`, `settings` and `actions` in the right
  cluster. `IGRPTemplateHeader` gains the matching `slots` prop and exports the
  `IGRPHeaderSlots` type.

  The framework still fetches and owns all header data — user, logo, breadcrumbs,
  sidebar trigger. A slot only replaces what renders in its position. `showSearch`,
  `showNotifications` and `showSettings` continue to gate their positions; `start`
  and `actions` are gated by the presence of the node. Each slot renders inside its
  own `<Suspense>`, so an async Server Component slot cannot delay the rest of the
  bar. Supplying a `notifications` slot also suppresses nav-user's link-only
  Notifications entry, which the injected component doesn't own.

  Also fixes the built-in command palette, which `IGRPTemplateHeader` mounted with
  no `commands` prop — `⌘K` opened a palette that could never contain anything. The
  template now supplies a menu-derived palette through the `search` slot, shipped as
  template migration `34-header-slots-and-app-search`.

- Updated dependencies [93cb0dd]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.144

## 0.1.0-beta.165

### Patch Changes

- 5c3ceba: fix(next-ui): make "Tentar novamente" actually retry in the header/sidebar error fallbacks

  `IGRPLayoutErrorBoundary` latched `hasError` permanently, so the `router.refresh()`
  behind the retry button re-fetched the server tree but the boundary kept rendering
  `IGRPSidebarError` / `IGRPHeaderError` — the button appeared to do nothing.

  The boundary now exposes a reset through context (`useIGRPLayoutErrorReset`), and
  both fallbacks use the new `useIGRPLayoutRetry` hook: it refreshes inside a
  transition and clears the boundary only once that transition settles, so the
  boundary re-renders the freshly fetched tree instead of the failing one. The retry
  button also shows a loading state while the refresh is in flight.

  `useIGRPLayoutRetry` and `useIGRPLayoutErrorReset` are exported for consumers
  writing their own layout error fallbacks.

- a57d25e: fix(next-ui): don't crash the layout on runtime-supplied image hosts

  `IGRPTemplateAppSwitcher` and `IGRPTemplateHeader` rendered app pictures and the
  header logo with `next/image` using the default loader, which throws
  "hostname is not configured under images" for any host missing from the
  consuming app's `images.remotePatterns`. The throw escaped to
  `IGRPLayoutErrorBoundary` and took the whole sidebar/header down. Since these
  URLs come from the access-management backend at runtime, consumers cannot
  whitelist every host up front.

  Both now render through a new internal `IGRPTemplateImage`, which marks remote
  sources `unoptimized` (bypassing the hostname check) and falls back to the icon
  — or, for the header, to the bundled logo — when an image fails to load.

## 0.1.0-beta.164

### Patch Changes

- 5a4ec99: - The design system now requires `zod` `^4.5.0` instead of `^4.4.0`, matching the range `@igrp/framework-next` already declares. Apps on zod `4.4.x` must upgrade to `4.5.x`.
  - `@igrp/framework-next-ui` pins `react`, `react-dom` and `next-auth` as devDependencies so it builds and typechecks against the same versions every other framework package uses, instead of whatever the workspace happened to hoist.
  - `@igrp/template-migrator` gains a typecheck config for its `scripts/` folder; no change to the published CLI or migration set.
- Updated dependencies [5a4ec99]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.143

## 0.1.0-beta.163

### Patch Changes

- 658e6b8: - Framework packages no longer declare their internal `@igrp/*` siblings as exact-version peer dependencies. They are regular dependencies again, so installing or upgrading a single framework package no longer emits unmet-peer warnings across the whole set.
  - `@igrp/framework-next` widens its `zod` peer range from the exact `4.5.0` to `^4.5.0`, so an app on any `4.5.x` (the template ships `4.5.4`) satisfies it.
  - `@igrp/template-migrator` ships migration `30-resync-beta166-deps`, which carries a CLI-upgraded app's dependency set forward to the beta.166 framework release — including `zod`, `react-hook-form`, `@tanstack/react-query` and `@types/react-dom`, which no earlier migration had ever pinned.
- Updated dependencies [658e6b8]
  - @igrp/framework-next-types@0.1.0-beta.148

## 0.1.0-beta.162

### Patch Changes

- f3e0c00: Fix `@igrp/framework-next-ui/tokens`: its CSS imported the design system's removed `/styles` entry, so any consumer importing the tokens entry (as documented in the README) failed to compile with `"./styles" is not exported`. It now re-exports `@igrp/igrp-framework-react-design-system/tokens`, and the README CSS section was updated to match.
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

- Updated dependencies [b501876]
- Updated dependencies [f3e0c00]
- Updated dependencies [9e15f16]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.142
  - @igrp/framework-next-auth@0.1.0-beta.145
  - @igrp/framework-next-types@0.1.0-beta.147

## 0.1.0-beta.161

### Patch Changes

- 22b57b3: - Fixed the sidebar menu search: results now show the item's icon, highlight the matched text, and display a result count, matching the visual style of the rest of the menu.
  - Added a clear ("×") button to the search field and disabled spellcheck/autocomplete, removing the browser's red squiggly underline on typed queries.
  - Replaced the plain "no results" text with a dashed empty-state card (icon + quoted query), consistent with the existing "no menus" empty state.

## 0.1.0-beta.160

### Patch Changes

- 19a6edc: `usePermissions()` now exposes `isAllowed(name)` instead of `can(name)` — a clearer name for the permission-check function. `<IGRPAuthorization>` and `<IGRPGuardPage>` are updated accordingly. This is a breaking rename to the permission-gating client API; consumers calling `usePermissions().can(...)` must switch to `.isAllowed(...)`.

## 0.1.0-beta.159

### Patch Changes

- 2d9bdef: - Add `IGRPRepetitiveComponent` — generic render-prop component for mapping a list of items with a key extractor, exported from the design system root
  - Fix `IGRPModalDialog` sticky header/footer layout: use `-mx-6 px-6` for true edge-to-edge spanning, correct z-index to `z-10`, and add `max-h-[95vh]` on the full-size variant; simplify `IGRPModalDialogDescription` to accept standard `children` instead of a `name` shorthand prop
  - Add template-migrator migration 24: resync `demo-v1` `(igrp)/layout.tsx` (hoists `IGRPQueryProvider`) and `.env.example` to beta.159, bumping all `@igrp/*` framework deps
- Updated dependencies [2d9bdef]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.141

## 0.1.0-beta.158

### Patch Changes

- ffa6994: fix(next-ui): stabilize IGRPTemplateBreadcrumbs routeLabels default so the memo is not busted every render

  The `routeLabels` prop defaulted to a fresh `{}` literal, which changed identity on every render and broke the `useMemo` that derives breadcrumb items (the common case where the prop is omitted recomputed every render). It now defaults to a shared frozen module-level reference, so the memo is stable. No API change.

- 3847b8b: Add token-claims permission gating: `decodeIgrpClaims`/`claimsAllow` (`@igrp/framework-next-auth/claims`), server helpers `igrpGetClaims`/`igrpAuthorize`/`igrpAssertAuthorize` (`@igrp/framework-next`), and client `IGRPSectionPermissions`/`usePermissions`/`IGRPAuthorization`/`IGRPGuardPage`/`IGRPForbidden` (`@igrp/framework-next-ui`).
- 770c1bc: Client-boundary and render-safety hardening:

  - Add the missing top-of-file `'use client'` directive to `IGRPTemplateSidebar`, `IGRPTemplateNavUser`, `IGRPTemplateNotFound`, `IGRPTemplateLoading`, and `IGRPThemeProvider`. They use client-only hooks / DS components and previously relied on the package barrel's boundary, which would break the moment any of them was imported via a deeper path.
  - `IGRPTemplateHeader` no longer calls `igrpToast()` during render (a side effect that updated the toaster provider mid-render — a React anti-pattern and impure under the React Compiler). The no-data warning now runs in a `useEffect`, and the component returns `null` instead of `undefined`.

- efdf17d: refactor(next-ui): extract a shared MenuItemLink for the sidebar menu surfaces

  The identical `isAnchor ? <a> : <Link>` branch in `leaf-menu-item`, `sub-leaf-link`, and `search-results` is now a single internal `MenuItemLink` (forwardRef, single root element) so it still composes with the Radix `asChild` Slots (SidebarMenuButton / SidebarMenuSubButton / DropdownMenuItem). Pure dedup with no behavior change: external links still open in a new tab with `rel="noopener noreferrer"`, `aria-current="page"` and each call site's `aria-label`/`className` are preserved exactly, and active highlighting is unchanged. Internal component only — not added to the public export surface.

- 770c1bc: Fix a Rules-of-Hooks violation in `IGRPSegmentError`: the `children` short-circuit `return` ran before `useState`/`useEffect`, so toggling the `children` prop between renders changed the hook count and could crash the error boundary itself (the worst place to crash). Hooks now run on every render; the `children` passthrough is guarded inside the effect and returned after the hooks, mirroring `IGRPGlobalError`.
- 41d8a51: Menu tree React keys fall back to `code` when a menu entry has no `id`,
  avoiding `folder-undefined`/`leaf-undefined` key collisions.
- 3b91dc2: `IGRPTemplateNavUser` and `IGRPTemplateNotifications`: emit basePath-relative
  `next/link` hrefs (`/profile`, `/notifications`, `/setting`) instead of
  `window.location.origin`-based absolute URLs. Fixes the SSR/CSR hydration
  mismatch, the full-page reload, and the 404 under a `NEXT_PUBLIC_BASE_PATH`
  deployment.
- 689b5ac: Memoize `IGRPActiveThemeProvider`'s context value (the React Compiler skips
  provider files, so it must be manual). Auth carousel: root backdrop uses the
  `bg-muted` token and the dot row uses `flex gap-2`; on-photo caption colors are
  kept as a documented fixed-contrast exception.
- eac3eca: Sidebar menus now expose exactly one labeled navigation landmark. Removed the
  invalid `role="navigation"` from `SidebarMenu` (a `<ul>`, where it stripped list
  semantics and emitted an unlabeled landmark per section) and wrapped
  `IGRPTemplateMenus` once in `<nav aria-label>` — overridable via the new
  `navAriaLabel` prop (default "Menu principal").
- Updated dependencies [3847b8b]
- Updated dependencies [a274c6e]
- Updated dependencies [c9cd44b]
- Updated dependencies [9e8e240]
- Updated dependencies [781f753]
- Updated dependencies [41d8a51]
- Updated dependencies [aca828e]
- Updated dependencies [3b808b8]
- Updated dependencies [1da77de]
- Updated dependencies [6467e14]
- Updated dependencies [d8daf50]
- Updated dependencies [8cb2fc5]
- Updated dependencies [6cb1cec]
- Updated dependencies [7d48f03]
  - @igrp/framework-next-auth@0.1.0-beta.144
  - @igrp/framework-next-types@0.1.0-beta.146
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.140

## 0.1.0-beta.157

### Patch Changes

- 7d72168: - Move the sidebar collapse/expand `SidebarTrigger` out of the sidebar header and into the app header (`IGRPTemplateHeader`), gated by `showIGRPSidebarTrigger`, following the shadcn dashboard layout. The header trigger is aligned with `-ml-1`. The sidebar keeps `collapsible="icon"`, so the trigger toggles between the expanded panel and the icon rail; `SidebarRail` still re-expands from the collapsed state.

## 0.1.0-beta.156

### Patch Changes

- Updated dependencies [0850757]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.139

## 0.1.0-beta.155

### Patch Changes

- faf18ec: `IGRPTemplateNavUser` now passes `user.picture` to `IGRPUserAvatar`, so profile photos render in the nav-user dropdown trigger (header and sidebar). Previously `image` was never supplied, so the avatar always fell back to initials. Users without a `picture` are unaffected — the avatar still falls back to initials.

## 0.1.0-beta.154

### Patch Changes

- 5b335b8: feat: honor showNotifications flag in nav-user — hide the Notifications dropdown item (header and sidebar) when notifications are disabled, and add showNotifications to IGRPSidebarDataArgs
- Updated dependencies [5b335b8]
- Updated dependencies [5b335b8]
  - @igrp/framework-next-types@0.1.0-beta.145
  - @igrp/framework-next-auth@0.1.0-beta.143

## 0.1.0-beta.153

### Patch Changes

- cb57954: - Reorder sidebar header: `SidebarTrigger` is now first in DOM; in collapsed mode it leads before the app switcher, in expanded mode it stays right-aligned via CSS flex order
  - Remove prebuilt Tailwind CSS bundle (`styles.css`, `./styles` export, `tailwind:build` script, `@tailwindcss/cli` dep) — Tailwind is compiled once in the consuming app
  - Build pipeline: replace `move` with `move-cli`, drop `tailwind:build` step, bump required Node to ≥22

## 0.1.0-beta.152

### Patch Changes

- fc2fe20: - `next-auth`: add `console.error` diagnostics when introspection marks the refresh token inactive or when `refreshOidcAccessToken` returns an error flag or throws — makes login-loop root causes visible in server logs
  - `next`: replace `unstable_cache` with `React.cache()` in `use-user` — prevents stale 401s caused by rotating access tokens being embedded in the `unstable_cache` key
- Updated dependencies [fc2fe20]
  - @igrp/framework-next-auth@0.1.0-beta.142
  - @igrp/framework-next-types@0.1.0-beta.144
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.138

## 0.1.0-beta.151

### Patch Changes

- af28e9a: feat(ds): add asChild prop to IGRPButton for Slot-based rendering
- Updated dependencies [af28e9a]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.137

## 0.1.0-beta.150

### Patch Changes

- a9b2297: `IGRPSessionWatcher` now schedules an adaptive silent refresh 45s before access-token expiry, derived from `session.expiresAt`, so token-refresh timing no longer depends on hand-tuning `IGRP_SESSION_REFETCH_INTERVAL` to the IdP access-token TTL. The fixed `SessionProvider` poll remains as a fallback.
- 331debd: feat: collapsible GROUP sections and inline menu search in sidebar
- e51050a: feat: add showMenuSearch flag to IGRPSidebarDataArgs to control sidebar menu search visibility
- Updated dependencies [a9b2297]
- Updated dependencies [e51050a]
  - @igrp/framework-next-auth@0.1.0-beta.141
  - @igrp/framework-next-types@0.1.0-beta.143

## 0.1.0-beta.149

### Patch Changes

- Updated dependencies [033e1d7]
- Updated dependencies [5ebe890]
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.136
  - @igrp/framework-next-auth@0.1.0-beta.140
  - @igrp/framework-next-types@0.1.0-beta.142

## 0.1.0-beta.148

### Patch Changes

- 5c14726: - Restore sidebar collapse/expand trigger: add `SidebarTrigger` (PanelLeft icon) to the sidebar header alongside the app switcher, following the shadcn recommended sidebar block pattern

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

  @igrp/framework-next-template (templates/demo-v1)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-v1/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

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

  @igrp/framework-next-template (templates/demo-v1)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-v1/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

- Updated dependencies
  - @igrp/framework-next-types@0.1.0-beta.114
  - @igrp/framework-next-auth@0.1.0-beta.114
  - @igrp/igrp-framework-react-design-system@0.1.0-beta.114
