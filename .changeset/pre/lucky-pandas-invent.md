---
'@igrp/framework-next-types': patch
'@igrp/framework-next': patch
'@igrp/framework-next-ui': patch
'@igrp/template-migrator': patch
---

Fix the published type declarations being unusable under `node16`/`nodenext`,
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
