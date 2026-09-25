# @igrp/template-migrator

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
- 8a6ecbe: Add migration 35, and repair the drift gate's own file paths.
  
  **Migration 35 — `35-framework-owned-redirect-and-refetch-ceiling`**
  
  - Replaces `src/lib/auth.ts` to drop the template's local `callbacks.redirect` override. The framework default in `@igrp/framework-next-auth` now resolves post-auth destinations against the app base URL (and never against `NEXTAUTH_URL_INTERNAL`), which is exactly what the override existed to work around. `deriveAppBaseUrl()` and `AUTH_UI_PATH` go with it.
  - Replaces `.env.example` and retunes `IGRP_SESSION_REFETCH_INTERVAL` from `120` to `45` in `.env`. The framework's proactive-refresh buffer is 60s, so any poll interval at or above it can never land inside the refresh window — the only refreshes that run happen in read-only RSC context and cannot persist the rotated cookie, which surfaces as a random bounce to `/login`. `withIGRPAuth` now warns about this in development.
  - The retune is `env.remove` + `env.add`, because `env.add` deliberately never overwrites a key an app already has.
  
  **Drift gate paths**
  
  `scripts/check-drift.ts` and `scripts/sync-template-lock.ts` resolved the repo root as `<pkg>/../..`, which stopped being correct when the package moved under `packages/framework/`. `check:drift` exited 1 with "Template directory not found" on every run — so the gate that is supposed to block a release with an uncaptured template change was itself passing nothing, and `sync:template-lock` wrote to a path outside the repo. Both now use `../../..`, along with `PACKAGES_DIR` (which made the dependency-pin check silently compare against an empty workspace map).
- 39eb67c: Add migration 36 — `36-framework-owned-origin-resolution`.
  
  Replaces `src/middleware.ts` so its three redirects resolve through
  `auth.resolveAppUrl` / `auth.getLoginRedirectUrl` instead of
  `new URL(path, request.url)`. Behind a TLS-terminating proxy `request.url`
  carries the internal origin, so a `Location` built from it points the browser
  somewhere it cannot follow. Single-host and local development are unaffected —
  `NEXTAUTH_URL` and the request origin are identical there.
- b632dee: Add migration 37 — `37-cn-package-and-utils-removal`.
  
  Catch-up for three template changes that were made without a migration, so the
  drift gate had been failing on them and upgraded apps were diverging from
  scaffolded ones.
  
  The template stopped defining its own `cn` helper and took the `cn` package (a
  compiled clsx + tailwind-merge replacement) instead. `src/app/(auth)/login/page.tsx`
  and `src/lib/fonts.ts` now import it from there, and `src/lib/utils.ts` — whose
  last export `cn` was, the rest having moved to `src/lib/utilities.ts` in
  migration 26 — is deleted.
  
  The `cn` dependency is bumped first, because the rewritten imports do not
  resolve without it. Note that `deps.bump` only updates a dependency the app
  already declares: an app without `cn` gets the "not declared by this app, so NOT
  bumped" warning and must install it manually. The migration doc says so
  prominently.
  
  After this, the only remaining drift is the 9 dependency pins, which cannot be
  captured until `version:changesets` has decided the versions.
- 23343a3: Add migration 40 — `40-review-hardening`, plus the dependency resync the drift
  gate was failing on (9 pins had moved in the workspace with no migration
  capturing them).
  
  From a full review of `templates/demo-v1`. Nine files change; the only runtime
  behaviour that moves is the `X-XSS-Protection` value and the number of times the
  config is built per request.
  
  - **`.env.example`** — `IGRP_SESSION_REFETCH_INTERVAL` removed. Migration 19
    already removed it; migration 35 brought it back with a doc block asserting a
    hard 60s ceiling. **Nothing reads it.** `get-session-args.ts` returns a
    hardcoded 600s backstop, and the only reader anywhere is a warn-only check in
    `@igrp/framework-next-auth`. So the guard inspected the documented `45`,
    passed, and stayed silent while the value that actually reached
    `SessionProvider` was `600` — ten times past the ceiling it existed to
    enforce. A replacement note records that the absence of the knob is
    deliberate. The 600s backstop itself is correct: `IGRPSessionWatcher` drives
    the real refresh from `session.expiresAt`.
  - **`src/lib/config/get-routes.ts`** — the silent-empty path is now loud. A
    failed read or a failed regex parse of `.next/types/routes.d.ts` used to yield
    `appRoutes: []`, which meant Access Management's resource/route sync silently
    registered nothing. Read failure and parse failure now report separately and
    name the consequence; a match that extracts zero routes is treated as a
    failure rather than as "no routes"; and the miss is cached, so a broken parse
    logs once instead of re-reading the file on every render.
  - **`src/igrp.template.config.ts`** — `createConfig` is wrapped in `cache()`.
    Both the root layout and the `(igrp)` layout call it, so `igrpBuildConfig`,
    `getRoutes()` (a synchronous file read), `getPermissions()` and
    `getSessionArgs()` all ran twice per request and produced two distinct config
    objects for one render.
  - **`src/middleware.ts`** — `X-XSS-Protection: 0` (the legacy auditor is gone
    from current browsers and has itself been an XSS vector; explicit disable is
    current guidance). The dotted-path branch in `isPublicPath` gains a comment
    noting it is dead under the stock matcher and is **not** the auth boundary for
    dotted page routes — `(igrp)/layout.tsx`'s `verifySession()` is.
  - **`tsconfig.json`** — `noEmit: true`, `composite` dropped. The old pair meant a
    bare `tsc -p .` scattered compiled `.js` through `src/`.
  - **`src/app/(igrp)/page.tsx`** — states its permission decision, as
    `.agents/rules/permissions.md` requires. (The other pages that gained the same
    comment are demo scaffolding outside migration management and reach consumers
    through the zip only.)
  - **`src/app/(auth)/login/page.tsx`** — drops a duplicated `hidden` and a
    redundant `lg:block`; rendering is unchanged.
  - **`src/lib/header-search.ts`** — reformatted to Biome's width. It and
    `igrp.template.config.ts` were the template's only two CRLF files, so
    `biome check --write` (part of `pnpm build`) rewrote them on every build. A
    repo-root `.gitattributes` now pins the tree to LF.
  - **`cn` now comes from the design system** — the template's own `cn`
    dependency (at `^0.3.0`, the only caret range in the manifest) is removed.
    `src/lib/fonts.ts` drops `cn` entirely: it joins four `next/font` CSS-variable
    class names, opaque generated identifiers with no Tailwind utility among them,
    so there is nothing for tailwind-merge to resolve. `login/page.tsx` genuinely
    needs merging and takes the design system's new server-safe
    `…/cn` subpath. Both call sites are server-side, and importing `cn` from the DS
    **root** there fails the build — the root is a `"use client"` boundary. The
    failure is invisible to `tsc` and to Biome; only a real `next build` shows it,
    during page-data collection, blamed on an unrelated route.
  
  ## New step types: `deps.remove` and `deps.restore`
  
  Dropping the `cn` dependency exposed a gap: the migrator could add and update
  dependency ranges but **never remove one**. A removal therefore reached
  scaffolded apps through the zip and never reached upgraded ones — the two
  channels diverging, which is precisely what `check:drift` exists to catch, and it
  did.
  
  - `deps.remove` takes `manifest` + `deps`, and captures each dependency's field
    (`dependencies` vs `devDependencies`) alongside its range.
  - `deps.restore` is the generated inverse. `deps.bump` could not serve as one: it
    only updates a dependency that is already declared and will not re-add a
    removed one. Carrying the original field matters — restoring a devDependency
    into `dependencies` would change what a production install pulls down.
  - A dep that is already absent warns rather than throwing, so a catch-up
    migration re-applied over an already-current tree does not abort.
  - `check:drift` now treats a later `deps.remove` as retiring an earlier
    `deps.bump`, the same collapse-to-final-state rule its file checks already use.
  
  Verified end to end against a scratch copy reverted to the pre-40 state: all 9
  writes plus `deps.bump` and `deps.remove` reproduce the live template exactly and
  drop `cn` while leaving its neighbours intact; `rollback` then restores
  `cn: ^0.3.0` to `dependencies`, the field and range it came from.
- 6fc5bad: Ship migration `45-dev-basepath-url`: adds `scripts/dev.mjs`, a `next dev` wrapper that prints the app URL including `NEXT_PUBLIC_BASE_PATH` under Next's `Local:` line. Point the app's `dev` script at it by hand (`"dev": "node scripts/dev.mjs"`); `package.json` isn't migration-managed.
- ee3f7f2: Add migration 47 (`47-lucide-dynamic-icons-alias`): Turbopack `resolveAlias` for `lucide-react/dynamicIconImports` in `next.config.ts`, `app-search.tsx` resync, and `@igrp/platform-access-management-client-ts` bump to `0.2.0-beta.17`.
- 686a2db: Deep-review fixes across the migrator: crash recovery, rollback safety, and the release gates.
  
  **Correctness**
  
  - `apply` no longer unwinds a migration the lock already records. A crash in the window between `writeLock` and `clearJournal` left a journal for a migration that had fully succeeded; replaying its undo reverted the files while the lock kept claiming the migration was applied, so `apply` reported "nothing to apply", `check` passed, and the app silently lacked the migration forever.
  - `apply` refuses to overwrite a managed file the consumer has edited since the migration that last wrote it, naming the paths and aborting before any step runs. `--force` overwrites. The baseline is the shipped payload of the last applied migration that wrote each path — nothing is recorded in the lock, which is what makes the check work for a freshly scaffolded app whose lock holds only baseline entries. The comparison ignores line endings, so a CRLF checkout is not mistaken for an edit.
  - `check` and `status` now compare each applied entry's `manifestHash` against the migration's current `contentHash`, so a migration corrected in place after release no longer leaves apps holding the old result with nothing to say so.
  - `rollback <id>` refuses (without `--force`) when a still-applied migration declares `<id>` in its `requires` — the state `apply` already refuses to create, reached from the other side.
  - `env.remove` takes the contiguous comment block above each key with it, and recovers `doc` / `required_if` from those comments. An `env.add` undo used to leave orphaned `# …` lines behind on every apply/rollback cycle and restore a bare `# ` on re-add. Both env steps now preserve the file's existing line endings, and `env.add` no longer opens an empty file with blank lines.
  - Undo payload restoration in `unwind` and `rollback` runs the same `assertInsideAppRoot` guard `executeStep` applies — those two branches wrote directly and could escape the app root via a hand-edited or badly merged lock.
  - `readLock` reports the offending file and likely cause instead of leaking a raw `SyntaxError`, and rejects valid JSON that is not a lock file. `writeLock` is now atomic (temp file + rename).
  - `convert` returns a boolean instead of calling `process.exit`; it is exported from the package root, where exiting takes the host process down.
  - `--to` with no value now errors instead of silently applying every pending migration.
  
  **Gates**
  
  - Pack-time step validation (`src/validate-steps.ts`): a typo'd `type`, a missing `from`, a path containing `..`, or `mode: "patch"` (never implemented, throws at apply time) now fails the build instead of shipping and failing part way through a consumer's migration.
  - The drift gate treats "a migration deletes a path the template still ships" as a hard failure rather than a warning — it is the exact mirror of a case that already failed.
  - `release` now runs `typecheck` and `test` before `check:drift`; a new `typecheck` script covers `scripts/` as well as `src/` (its tsconfig existed but nothing invoked it). Corrupt-baseline reads report cleanly instead of throwing a parse stack trace.
  - The workspace-version scan no longer recurses through `node_modules`.
  
  **Packaging**
  
  - No JS sourcemaps or `.d.ts.map` files are emitted: `files` publishes only `dist/`, so both pointed at `src/` paths absent from the tarball.
- abef632: Slim the shipped template lock, and ship migration `41-query-client-comment-trim`.
  
  **Lock shape.** `LockEntry.undo` and `LockEntry.fileHashes` are now optional, and the template's shipped `.igrp-migrations-lock.json` omits them. Every one of its entries is a *baseline* entry — the template ships its own lock so a scaffolded app opens with every migration already applied, but nothing was executed against a file tree there, so there is no undo to record. Forty-one copies of `undo: []` and `fileHashes: {}` stated nothing the absence of the fields does not. Each entry is now:
  
  ```json
  { "id": "...", "appliedAt": "...", "cliVersion": "...", "manifestHash": "..." }
  ```
  
  Readers treat missing as empty (`entry.undo ?? []`). An entry that carries real undo content keeps it — that can only come from a lock a consumer actually ran against.
  
  `scripts/sync-template-lock.ts` now compares the serialised bytes, not just the semantics. It previously reported "already up to date" whenever the ids and hashes matched, which meant a lock left in an outdated shape was something it could not repair despite owning the file.
  
  **Migration 41** re-captures `src/providers/query-client.server.ts` after a comment-only trim in the template, so apps upgraded through the CLI and apps scaffolded from the zip agree byte-for-byte. No runtime change.

## 0.2.0-beta.0

### Minor Changes

- Start the `0.2.0-beta` pre-release line (from `0.1.0-beta.*`). No code changes relative to the last `0.1.0-beta` build on this branch.
- Migration `47-framework-0-2-0-beta`: bumps the template's `@igrp/*` framework pins to `0.2.0-beta.0` and `@igrp/platform-access-management-client-ts` to `0.2.0-beta.17`.

## 0.1.0-beta.141

### Patch Changes

- - Framework packages no longer declare their internal `@igrp/*` siblings as exact-version peer dependencies. They are regular dependencies again, so installing or upgrading a single framework package no longer emits unmet-peer warnings across the whole set.
  - `@igrp/framework-next` widens its `zod` peer range from the exact `4.5.0` to `^4.5.0`, so an app on any `4.5.x` (the template ships `4.5.4`) satisfies it.
  - `@igrp/template-migrator` ships migration `30-resync-beta166-deps`, which carries a CLI-upgraded app's dependency set forward to the beta.166 framework release — including `zod`, `react-hook-form`, `@tanstack/react-query` and `@types/react-dom`, which no earlier migration had ever pinned.
- Fix three cases where the CLI reported success while leaving an app in a wrong state.
  
  **An interrupted `apply` no longer corrupts the recorded undo.** The lock entry is written only after a whole migration succeeds, so a signal (Ctrl-C, CI timeout, crash) between the last step and that write left files mutated with nothing recorded. The retry then captured its undo baseline from the *already-migrated* files, so the lock claimed migrated content was the pre-migration original and a later `rollback` silently restored the wrong state. The in-process transactional unwind never covered this — it only runs inside `catch`.
  
  `apply` now keeps a crash-durable journal (`.igrp-migration-journal.json`) in the app root, written before the first step and cleared once the lock entry is safe. On startup a surviving journal is replayed to revert the interrupted migration before anything else, then the migration re-applies from a clean baseline; if a path cannot be restored, `apply` aborts rather than proceeding on an unknown baseline. The unwind logic is now shared (`src/unwind.ts`) between the error path and crash recovery so both leave the tree in the same state.
  
  **`rollback` refuses scaffold-baseline entries.** Entries with no undo steps and no stored payloads come from the template's shipped lock — a scaffolded app already contained the result, so nothing was executed and nothing was captured. Rolling one back previously printed `✓ rolled back`, changed no files, and removed the entry, leaving the app claiming the migration was unapplied so the next `apply` re-ran it. It now refuses and explains why; `--force` still drops the entry.
  
  **`status` lists lock entries it doesn't ship** instead of only counting them. An app migrated by a newer CLI previously showed `30 applied` above a list of 29 rows, with nothing explaining the gap. Unknown entries are now printed with the CLI version that applied them, and the summary says how many came from a newer CLI.
  
  **The template zip now normalises line endings to LF too.** The previous release fixed this for the CLI channel (payloads are normalised into `dist/` at pack time), but the zip is built from the working tree — so on a Windows checkout with `core.autocrlf=true`, `pnpm release:demo` still produced a CRLF zip while the migrator shipped LF. `create-zip-template.ps1` now normalises the tree before `Compress-Archive`, using the same NUL-byte binary guard, so both channels agree regardless of who built the artifact.
  
  Verified by diffing a scaffolded app against a CLI-upgraded one: **0 differences across all 50 migration-managed paths** (previously 37 diverged).
  
  Also: the transient journal is exempt from the drift gate's new-file check, and the consumer guide documents crash recovery and the rollback refusal.
- fd98d4c: - `cn()` is now backed by the official `cn` package instead of `clsx` + `tailwind-merge`; the exported API is unchanged for consumers.
  - Resizable primitives updated to the react-resizable-panels v4 API (`Group`/`Separator`, `aria-orientation` variants); the drag handle grip icon is replaced by a slimmer bar.
  - Build configuration fixes for `next-auth` (TypeScript deprecation flag) and `template-migrator` (explicit `node` types).
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
- - Added migration `27-csp-hsts-headers`: captures `src/middleware.ts`'s new `Strict-Transport-Security` and `Content-Security-Policy-Report-Only` security headers.
  - Added migration `28-resync-beta165-query-provider-split`: resyncs 17 files that drifted since migrations 25/26, captures the `query-client.tsx` → `query-client.ts`/`query-client.server.ts`/`query-provider.tsx` split, and bumps `@igrp/framework-next`/`@igrp/framework-next-ui` dependency pins to `0.1.0-beta.165`/`0.1.0-beta.161`.
- Add a template-lock axis to the drift gate, and fix the stale lock it caught.
  
  The template ships `.igrp-migrations-lock.json` inside the zip so a scaffolded app opens with every migration already applied. That lock had fallen 9 migrations behind (it recorded through `20-sidebar-trigger-in-header` while the CLI ships 29), so a brand-new app reported migrations it already contained as pending: `igrp-migrate check` failed on day one and `apply` re-ran finished work, recording `undo` entries for a state the app was never in.
  
  - `check:drift` now reconciles the shipped lock as a fourth axis — alongside file payloads, dependency pins, and new files — failing on unrecorded migrations, entries for migrations that no longer exist, stale `manifestHash` values, and out-of-order entries. Nothing else covered this file: the orphan check exempts it by path and no migration manages its content.
  - New `sync:template-lock` script regenerates the lock (`--check` for a dry run). Regeneration is append-and-refresh: existing entries keep their recorded `appliedAt` and `cliVersion`.
  - `pack.ts` and the new lock logic now share `hashSteps()`, so a lock entry's `manifestHash` and the manifest's `contentHash` cannot be computed differently.
  - Docs: corrected the `file.create` step-type reference (it overwrites an existing destination rather than failing), documented the previously-undocumented `env.remove` step type, and documented the lock axis and sync workflow.
  
  Also fixes three consumer-visible defects found by running a full 29-migration upgrade and diffing the result against the template (which moved it from 64 to 101 of 102 files byte-identical):
  
  - **Text payloads are now normalised to LF when packed into `dist/`.** Payloads are captured on Windows and carried CRLF while the live template is LF, so an upgraded app diverged from a scaffolded one in 37 of 44 managed files — the template's own Biome run would rewrite every one of them, and `git diff` after an `apply` showed whole-file churn instead of the change that landed. Binary payloads (NUL-byte detection) are still copied verbatim.
  - **`deps.bump` now warns about dependencies the app doesn't declare** instead of skipping them silently. It still won't add them (that could contradict a deliberate removal), but a silent skip turned a load-bearing bump — e.g. the AM client that `29-permissions-catalog-sync` needs for `syncPermissions` — into a runtime failure long after `apply` reported success.
  - **`apply` now says when `.env.example` gained keys.** Migrations never touch a consumer's real `.env`, so new settings previously landed only in the example file with nothing prompting anyone to copy them across — including credentials with no defaults that the app needs to boot.
  - A corrupt template lock is now reported as a normal gate failure rather than crashing `check:drift` with a raw `JSON.parse` stack trace.
- Library packaging hygiene across all published packages:
  
  - `@igrp/framework-next`: `next`, `react`, `react-dom` moved from `dependencies` to `peerDependencies` (range-based) — prevents duplicate React copies in consumer apps.
  - All packages: exact-pinned `peerDependencies` relaxed to caret ranges (`react ^19.2.0`, `next ^15.5.0`, `next-auth ^4.24.0`, `zod ^4.4.0`, etc.) so consumers on newer patch/minor versions no longer get unmet-peer errors.
  - `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next-ui`: `tailwindcss` moved to `devDependencies` (Tailwind compiles in the consuming app); unused `zod` dependency removed from `next-ui`; duplicated `publishConfig.exports` removed.
  - `@igrp/framework-next-types`: added an `exports` map (blocks deep imports into `dist/`, consistent with the other packages).
  - `@igrp/framework-next`, `@igrp/template-migrator`: `types` condition now listed first in `exports`.
  - `@igrp/template-migrator`: added `license`, `author`, top-level `types`, `publishConfig.tag`/`access`; `clean` now uses cross-platform `rimraf`.
  - All packages: added `repository`/`homepage`/`bugs` metadata, normalized `engines.node` to `>=22`, added `./package.json` export.
- Ship migration 32 (`32-turbopack-root-probe-and-beta169-deps`) for `demo-v1`:
  
  - Re-captures `next.config.ts` so `turbopackRoot` probes for `pnpm-workspace.yaml` and falls back to the app directory — standalone apps no longer root Turbopack two directories above themselves.
  - Re-pins `@igrp/framework-next-ui` to `0.1.0-beta.165` and `@igrp/framework-next` to `0.1.0-beta.169` (layout retry fix + runtime image-host crash fix).
- Ship migration 33 (`33-force-dynamic-root-layout`) for `demo-v1`:
  
  - Re-captures `src/app/layout.tsx` with `export const dynamic = "force-dynamic"`. The root layout resolves the session, so without it Next tries to statically prerender the whole tree at `next build` time and the build fails with `NEXTAUTH_SECRET must be set in production` / `Missing required authentication environment variables`. Container and CI builds no longer need runtime secrets; runtime behaviour is unchanged.

## 0.1.0-beta.140

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

## 0.1.0-beta.139

### Patch Changes

- 23ac101: Ship migration 33 (`33-force-dynamic-root-layout`) for `demo-v1`:

  - Re-captures `src/app/layout.tsx` with `export const dynamic = "force-dynamic"`. The root layout resolves the session, so without it Next tries to statically prerender the whole tree at `next build` time and the build fails with `NEXTAUTH_SECRET must be set in production` / `Missing required authentication environment variables`. Container and CI builds no longer need runtime secrets; runtime behaviour is unchanged.

## 0.1.0-beta.138

### Patch Changes

- 3dab276: Ship migration 32 (`32-turbopack-root-probe-and-beta169-deps`) for `demo-v1`:

  - Re-captures `next.config.ts` so `turbopackRoot` probes for `pnpm-workspace.yaml` and falls back to the app directory — standalone apps no longer root Turbopack two directories above themselves.
  - Re-pins `@igrp/framework-next-ui` to `0.1.0-beta.165` and `@igrp/framework-next` to `0.1.0-beta.169` (layout retry fix + runtime image-host crash fix).

## 0.1.0-beta.137

### Patch Changes

- 5a4ec99: - The design system now requires `zod` `^4.5.0` instead of `^4.4.0`, matching the range `@igrp/framework-next` already declares. Apps on zod `4.4.x` must upgrade to `4.5.x`.
  - `@igrp/framework-next-ui` pins `react`, `react-dom` and `next-auth` as devDependencies so it builds and typechecks against the same versions every other framework package uses, instead of whatever the workspace happened to hoist.
  - `@igrp/template-migrator` gains a typecheck config for its `scripts/` folder; no change to the published CLI or migration set.

## 0.1.0-beta.136

### Patch Changes

- 658e6b8: - Framework packages no longer declare their internal `@igrp/*` siblings as exact-version peer dependencies. They are regular dependencies again, so installing or upgrading a single framework package no longer emits unmet-peer warnings across the whole set.
  - `@igrp/framework-next` widens its `zod` peer range from the exact `4.5.0` to `^4.5.0`, so an app on any `4.5.x` (the template ships `4.5.4`) satisfies it.
  - `@igrp/template-migrator` ships migration `30-resync-beta166-deps`, which carries a CLI-upgraded app's dependency set forward to the beta.166 framework release — including `zod`, `react-hook-form`, `@tanstack/react-query` and `@types/react-dom`, which no earlier migration had ever pinned.

## 0.1.0-beta.135

### Patch Changes

- ac117fe: Fix three cases where the CLI reported success while leaving an app in a wrong state.

  **An interrupted `apply` no longer corrupts the recorded undo.** The lock entry is written only after a whole migration succeeds, so a signal (Ctrl-C, CI timeout, crash) between the last step and that write left files mutated with nothing recorded. The retry then captured its undo baseline from the _already-migrated_ files, so the lock claimed migrated content was the pre-migration original and a later `rollback` silently restored the wrong state. The in-process transactional unwind never covered this — it only runs inside `catch`.

  `apply` now keeps a crash-durable journal (`.igrp-migration-journal.json`) in the app root, written before the first step and cleared once the lock entry is safe. On startup a surviving journal is replayed to revert the interrupted migration before anything else, then the migration re-applies from a clean baseline; if a path cannot be restored, `apply` aborts rather than proceeding on an unknown baseline. The unwind logic is now shared (`src/unwind.ts`) between the error path and crash recovery so both leave the tree in the same state.

  **`rollback` refuses scaffold-baseline entries.** Entries with no undo steps and no stored payloads come from the template's shipped lock — a scaffolded app already contained the result, so nothing was executed and nothing was captured. Rolling one back previously printed `✓ rolled back`, changed no files, and removed the entry, leaving the app claiming the migration was unapplied so the next `apply` re-ran it. It now refuses and explains why; `--force` still drops the entry.

  **`status` lists lock entries it doesn't ship** instead of only counting them. An app migrated by a newer CLI previously showed `30 applied` above a list of 29 rows, with nothing explaining the gap. Unknown entries are now printed with the CLI version that applied them, and the summary says how many came from a newer CLI.

  **The template zip now normalises line endings to LF too.** The previous release fixed this for the CLI channel (payloads are normalised into `dist/` at pack time), but the zip is built from the working tree — so on a Windows checkout with `core.autocrlf=true`, `pnpm release:demo` still produced a CRLF zip while the migrator shipped LF. `create-zip-template.ps1` now normalises the tree before `Compress-Archive`, using the same NUL-byte binary guard, so both channels agree regardless of who built the artifact.

  Verified by diffing a scaffolded app against a CLI-upgraded one: **0 differences across all 50 migration-managed paths** (previously 37 diverged).

  Also: the transient journal is exempt from the drift gate's new-file check, and the consumer guide documents crash recovery and the rollback refusal.

- db1cbeb: Add a template-lock axis to the drift gate, and fix the stale lock it caught.

  The template ships `.igrp-migrations-lock.json` inside the zip so a scaffolded app opens with every migration already applied. That lock had fallen 9 migrations behind (it recorded through `20-sidebar-trigger-in-header` while the CLI ships 29), so a brand-new app reported migrations it already contained as pending: `igrp-migrate check` failed on day one and `apply` re-ran finished work, recording `undo` entries for a state the app was never in.

  - `check:drift` now reconciles the shipped lock as a fourth axis — alongside file payloads, dependency pins, and new files — failing on unrecorded migrations, entries for migrations that no longer exist, stale `manifestHash` values, and out-of-order entries. Nothing else covered this file: the orphan check exempts it by path and no migration manages its content.
  - New `sync:template-lock` script regenerates the lock (`--check` for a dry run). Regeneration is append-and-refresh: existing entries keep their recorded `appliedAt` and `cliVersion`.
  - `pack.ts` and the new lock logic now share `hashSteps()`, so a lock entry's `manifestHash` and the manifest's `contentHash` cannot be computed differently.
  - Docs: corrected the `file.create` step-type reference (it overwrites an existing destination rather than failing), documented the previously-undocumented `env.remove` step type, and documented the lock axis and sync workflow.

  Also fixes three consumer-visible defects found by running a full 29-migration upgrade and diffing the result against the template (which moved it from 64 to 101 of 102 files byte-identical):

  - **Text payloads are now normalised to LF when packed into `dist/`.** Payloads are captured on Windows and carried CRLF while the live template is LF, so an upgraded app diverged from a scaffolded one in 37 of 44 managed files — the template's own Biome run would rewrite every one of them, and `git diff` after an `apply` showed whole-file churn instead of the change that landed. Binary payloads (NUL-byte detection) are still copied verbatim.
  - **`deps.bump` now warns about dependencies the app doesn't declare** instead of skipping them silently. It still won't add them (that could contradict a deliberate removal), but a silent skip turned a load-bearing bump — e.g. the AM client that `29-permissions-catalog-sync` needs for `syncPermissions` — into a runtime failure long after `apply` reported success.
  - **`apply` now says when `.env.example` gained keys.** Migrations never touch a consumer's real `.env`, so new settings previously landed only in the example file with nothing prompting anyone to copy them across — including credentials with no defaults that the app needs to boot.
  - A corrupt template lock is now reported as a normal gate failure rather than crashing `check:drift` with a raw `JSON.parse` stack trace.

- f3e0c00: Library packaging hygiene across all published packages:

  - `@igrp/framework-next`: `next`, `react`, `react-dom` moved from `dependencies` to `peerDependencies` (range-based) — prevents duplicate React copies in consumer apps.
  - All packages: exact-pinned `peerDependencies` relaxed to caret ranges (`react ^19.2.0`, `next ^15.5.0`, `next-auth ^4.24.0`, `zod ^4.4.0`, etc.) so consumers on newer patch/minor versions no longer get unmet-peer errors.
  - `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next-ui`: `tailwindcss` moved to `devDependencies` (Tailwind compiles in the consuming app); unused `zod` dependency removed from `next-ui`; duplicated `publishConfig.exports` removed.
  - `@igrp/framework-next-types`: added an `exports` map (blocks deep imports into `dist/`, consistent with the other packages).
  - `@igrp/framework-next`, `@igrp/template-migrator`: `types` condition now listed first in `exports`.
  - `@igrp/template-migrator`: added `license`, `author`, top-level `types`, `publishConfig.tag`/`access`; `clean` now uses cross-platform `rimraf`.
  - All packages: added `repository`/`homepage`/`bugs` metadata, normalized `engines.node` to `>=22`, added `./package.json` export.

## 0.1.0-beta.134

### Patch Changes

- - Added migration `27-csp-hsts-headers`: captures `src/middleware.ts`'s new `Strict-Transport-Security` and `Content-Security-Policy-Report-Only` security headers.
  - Added migration `28-resync-beta165-query-provider-split`: resyncs 17 files that drifted since migrations 25/26, captures the `query-client.tsx` → `query-client.ts`/`query-client.server.ts`/`query-provider.tsx` split, and bumps `@igrp/framework-next`/`@igrp/framework-next-ui` dependency pins to `0.1.0-beta.165`/`0.1.0-beta.161`.

## 0.1.0-beta.133

### Patch Changes

- a0a9e05: - Add migration 26: bring 9 previously untracked files under migration coverage (`utilities.ts`, `query-client.tsx`, config/login, config/site, fonts, forbidden, loading, health route, generated layout); update 18 drifted tracked files to current template state; add `file.delete` steps for 4 stale paths removed from the template (`auth-helpers.ts`, `auth-options.ts`, `[...not-found]/page.tsx`, `types/next-auth.d.ts`)

## 0.1.0-beta.132

### Patch Changes

- 2d9bdef: - Add `IGRPRepetitiveComponent` — generic render-prop component for mapping a list of items with a key extractor, exported from the design system root
  - Fix `IGRPModalDialog` sticky header/footer layout: use `-mx-6 px-6` for true edge-to-edge spanning, correct z-index to `z-10`, and add `max-h-[95vh]` on the full-size variant; simplify `IGRPModalDialogDescription` to accept standard `children` instead of a `name` shorthand prop
  - Add template-migrator migration 24: resync `demo-v1` `(igrp)/layout.tsx` (hoists `IGRPQueryProvider`) and `.env.example` to beta.159, bumping all `@igrp/*` framework deps

## 0.1.0-beta.131

### Patch Changes

- b11b094: Make `apply` transactional: on a mid-migration step failure, unwind the
  steps that already ran (restoring overwritten/deleted files from the
  captured undo payloads) before aborting, instead of leaving files mutated
  with no lock entry. Prevents a re-run from re-capturing a corrupted undo
  baseline.
- da6f8a6: Add migration 21 (template-resync-catchup): re-capture 9 demo-v1 files and the
  next/react/react-dom dep pins that had drifted from the shipped migrations, so
  `check:drift` passes again. No template behavior change — a drift-parity snapshot.
- f80bda3: Add migration `22-session-args-auth-bypass`: rewrites the demo-v1
  `get-session-args.ts` to gate session-refetch on `isAuthBypass()` instead of
  `isPreviewMode()`, so `AUTH_PROVIDER=none` disables refetch per the bypass
  contract.
- 68956e9: `executeStep` now throws a clear error for `file.write` `mode: "patch"`
  (unimplemented) and for a missing `from`, instead of a cryptic
  `Cannot read properties of undefined` TypeError that aborted the whole apply.
- a520fe9: Hardening: numeric migration-file ordering (9 < 10 < 100); line-anchored
  `env.add` idempotency + a real `env.remove` undo (rollback now strips added
  keys); path-containment guard in `executeStep`; and `apply` enforces each
  migration's `requires` before running it.
- d5233b0: Add migration `23-per-request-layout-and-routes-cache`: demo-v1 layouts use the
  existing `getLayoutConfig` cache (one session decode per request) and
  `getRoutes()` memoizes its routes-file read.
- a7219e4: Validate migration `requires` at pack time. `pack.ts` now rejects duplicate
  migration ids and any `requires` entry that doesn't resolve to a strictly earlier
  migration (forward reference, typo, or unknown id). `apply` checks `requires`
  against applied ids but executes in file order, so a bad `requires` would
  otherwise ship in the manifest and permanently deadlock `apply` on consumer apps.
- 2e8785b: Rename the template identifier from `demo-v1` to `demo-v1`, tracking the template folder rename (`templates/demo-v1` → `templates/demo-v1`). The migrations source tree moves to `migrations/demo-v1/`, and the manifest and lock-file `template` field is now `demo-v1` (it is cosmetic — only printed by `status`). Existing consumer lock files self-heal: the next `apply`/`rollback` stamps the current identifier. No migration `id`s, step content hashes, or applied-migration state change, so already-migrated apps are unaffected.

## 0.1.0-beta.130

### Patch Changes

- 0eaa118: - Add migration `20-sidebar-trigger-in-header`: flips the demo-v1 template's `showIGRPSidebarTrigger` to `true` and resyncs all `@igrp/*` deps to the beta.158 framework set (next-ui beta.157, next beta.158), matching what the create-template zip resolves for fresh scaffolds.

## 0.1.0-beta.129

### Patch Changes

- e7ad711: - Add migration 19 (`19-adaptive-session-refresh`): removes `IGRP_SESSION_REFETCH_INTERVAL` from `.env.example` and updates `get-session-args.ts` to use a 600s backstop interval now that `IGRPSessionWatcher` handles adaptive refresh from `session.expiresAt`

## 0.1.0-beta.128

### Patch Changes

- 467bb32: - Add migration 18 (`18-email-scope-enable`): updates `.env.example` to set `IGRP_AUTH_SCOPES=openid email` now that the IdP advertises the `email` scope; bumps all framework deps to beta.142–153

## 0.1.0-beta.127

### Patch Changes

- 4b31dc1: feat: migration 17 — showMenuSearch config flag + dep bumps to beta.151

## 0.1.0-beta.126

### Patch Changes

- 309f489: Honest rollback: `apply` now captures the prior content of overwritten/deleted files into the lock entry (`undoPayloads`), and `rollback` restores them. For lock entries written by older CLI versions (no stored payloads), `rollback` now refuses with a clear file list instead of silently half-reverting; `--force` keeps the old skip behavior explicitly. Adds the package's first test suite (executeStep, lock, convert, apply, rollback).

## 0.1.0-beta.125

### Patch Changes

- 034ab4d: - Add migration 14 (deferred logout flow, console cleanup, layout hardening) and migration 15 (resync deps to next-ui@0.1.0-beta.148 / next@0.1.0-beta.149 for sidebar trigger restore)

## 0.1.0-beta.124

### Patch Changes

- Add migration `13-resync-beta145`: re-capture `src/lib/dal.ts` (import-order realignment after the Biome sort) and bump the `@igrp/*` dependency pins to the `framework@0.1.0-beta.145` set (`framework-next@0.1.0-beta.145`, `framework-next-ui@0.1.0-beta.144`, `igrp-framework-react-design-system@0.1.0-beta.135`). Clears the `check:drift` gate.

## 0.1.0-beta.123

### Patch Changes

- 0d15a61: Add migration `12-template-resync` and a `check:drift` release gate.
  - **New migration `12-template-resync`** re-captures 13 `templates/demo-v1` files that had been edited directly without an accompanying migration (so the changes had shipped only to apps scaffolded from the zip, never to apps upgraded via `igrp-migrate`): the layout server action, the `lib/config/*` helpers, `lib/auth.ts`, `lib/dal.ts`, `lib/report-error.ts`, the NextAuth route handler, the three `error.tsx` boundaries, the logout page, and `.env.example`. It also deletes the stale `src/app/[...not-found]/page.tsx` catch-all route, bumps the `@igrp/*` deps to the `framework-next@0.1.0-beta.144` set, and aligns the React/Next runtime (`next ^15.5.18`, `react`/`react-dom 19.2.6`) which had advanced in the template since migration 04 without an intervening migration.
  - **New `check:drift` script** (`scripts/check-drift.ts`) reconciles both the payload tree and the dependency pins against the live template, and fails if a managed file changed without a migration, a migration ships a file the template removed, a payload is missing, or a bumped dependency drifted from the template's current (workspace-resolved) version. It runs automatically at the start of the `release` script, preventing this drift from recurring.

## 0.1.0-beta.122

### Patch Changes

- 667e3af: Add migration `11-callbackurl-hardening-and-error-copy` for `demo-v1`, back-filling template changes that were never captured by a migration:
  - **callbackUrl hardening** (open-redirect + login-loop prevention) across `middleware.ts`, `lib/auth.ts`, `lib/dal.ts`, and `app/(auth)/login/page.tsx` — basePath-aware sanitized `callbackUrl` and the `x-current-path` header contract (relies on `sanitizeCallbackUrl`, shipped in migration 10).
  - **AppError error-copy surfacing** — new `lib/errors.ts`, plus `config/error-messages.ts` and `app/global-error.tsx` wiring `parsePublicDigest`/`resolveCopy` so server-thrown errors show their public message.
  - Adds the `slug` field to `lib/config/get-pkj.ts`.

## 0.1.0-beta.121

### Patch Changes

- 8687eb9: Fix incomplete migration `10-session-refetch-and-menu-role-sync`: also ship `src/actions/igrp/auth.ts` and `src/lib/utils.ts`. The new logout page imports `getLogoutUrl` from `actions/igrp/auth.ts`, but the last migration to ship that file (04) predated the function — sequential consumers would apply a logout page calling an undefined export. `lib/utils.ts` is refreshed alongside, as `get-session-args.ts` (also new in 10) consumes its `isPreviewMode`/auth-bypass helpers.

## 0.1.0-beta.120

### Patch Changes

- 195508a: Add migration `10-session-refetch-and-menu-role-sync` for `demo-v1`, capturing the template changes since migration 09:
  - `IGRP_SESSION_REFETCH_INTERVAL` — configurable client session-refetch cadence (default 180s), replacing the hard-coded 5-minute poll in `src/lib/config/get-session-args.ts`
  - `IGRP_SYNC_ON_CODE_MENU_ROLES` — forwards `syncRoles` to the on-code menu push so menu↔role assignments can be reconciled (or left untouched)
  - Removes the dead `IGRP_M2M_SCOPE` env var and documents `NEXT_PUBLIC_IGRP_SETTINGS_URL`
  - Logout-hang fix, sidebar-visibility correction (`showSidebar` default), and design-system token/theme alignment
  - `deps.bump` to `framework-next@0.1.0-beta.142`, `framework-next-types@0.1.0-beta.136`, `framework-next-ui@0.1.0-beta.141`, `platform-access-management-client-ts@0.2.0-beta.10`

## 0.1.0-beta.119

### Patch Changes

- b5f301f: docs(template-migrator): remove stale IGRP_M2M_SCOPE references from payloads

  Drop the `IGRP_M2M_SCOPE` documentation and bare env line from the migration 08 and 09 payload `.env.example` files. The variable was deprecated and removed from the framework runtime; leaving it in the payloads would re-inject a no-op env var into consumer apps that apply these migrations.

## 0.1.0-beta.118

### Patch Changes

- feat(template-migrator): bundle migration 08 — M2M OAuth2 `client_credentials`

  Adds `migrations/demo-v1/08.MIGRATIONS-21052026.md` and `payload/08/{.env.example,igrp.template.config.ts}` to the CLI bundle so consumers can apply the OAuth2 `client_credentials` AM-sync migration via `pnpm dlx @igrp/template-migrator@latest apply`.

  Pins `targetFrameworkVersion: 0.1.0-beta.137` and bumps `@igrp/framework-next` / `@igrp/framework-next-types` to the published beta versions that ship the new OAuth2 flow.

  Also includes a minor wording fix in `06.MIGRATIONS-23042026.md`.

## 0.1.0-beta.117

### Patch Changes

- 761e9c3: - Move migration guides and payloads from `templates/demo-v1/.igrpmigrations/` into the CLI package at `migrations/demo-v1/`
  - Replace `.igrpmigrations/lock.json` with a flat `.igrp-migrations-lock.json` at the project root (same pattern as `skills-lock.json`)
  - Add `igrp-migrate convert` command to upgrade existing consumers from the legacy lock path; all other commands block with a clear message if the legacy path is detected

## 0.1.2-beta.116

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
