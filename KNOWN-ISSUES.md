# Known issues — repo-wide

Understood, reproducible defects that are **not yet fixed**, and that span more
than one package. Single-package items live in that package's own
`KNOWN-ISSUES.md` (see the index at the bottom).

Each entry is a handover note: enough to act on without re-deriving the
diagnosis. When you review or work in an affected package, fix the entry that
names it and delete it from here.

---

## 1. The framework packages have no lint gate at all

**Status:** open · pre-existing · found 2026-09-21 during a review of
`@igrp/framework-next-auth`

**Affects:** `packages/framework/next`, `next-auth`, `next-types`, `next-ui`

**Severity:** low individually, medium cumulatively — it is a missing gate, not a
bug. It already let a defect ship (below).

### Symptom

`pnpm lint` at the repo root reports success while linting none of the framework
packages.

### Root cause

Root `lint` is `pnpm -r run lint`, and **`pnpm -r run` silently skips any package
that does not define the script**. None of the four framework packages defines
`lint`, and none has an `eslint.config.*`:

```
lint script in next:       STILL NONE
lint script in next-auth:  STILL NONE
lint script in next-types: STILL NONE
lint script in next-ui:    STILL NONE
```

Only `packages/design-system` (and `design-system-storybook`) actually have
ESLint configured. So the repo-wide claim in `CLAUDE.md` —

> Lint/format toolchain is **package-specific**. Framework packages: **ESLint +
> Prettier**. `templates/demo-v1`: **Biome**.

— is true for Prettier and false for ESLint.

### Why it matters (it has already bitten)

An unused import (`isOidcManagedProviderId` in
`packages/framework/next-auth/src/config.ts`) shipped and survived review,
because nothing flagged it. It was the visible fingerprint of a half-finished
change — the symbol was imported for a guard that was never wired up, and the
sessions that guard was meant to protect kept expiring. A lint gate would have
pointed at it immediately.

### Partial mitigation already in place

`next-auth` sets `noUnusedLocals` / `noUnusedParameters` in its
`tsconfig.json` and runs `typecheck` as part of `release`. `next-types` now
does the same (2026-09-21): `typecheck` runs `tsc -p tsconfig.contract.json`,
which covers `src/` and `contract/` with no emit, and its `build` already
type-checks, so `release` is not doubled up. Both packages therefore close the
unused-symbol class of defect.

The root `typecheck` (`pnpm -r run typecheck`) consequently covers **3 of the
4** framework packages. `next-ui` now defines `typecheck` (and runs it, plus
`test`, in `release`); **`next`** is the only one still skipped silently. No
framework package has ESLint.

A second, sharper instance of the same shape was found on 2026-09-21: the
`check:dist` gate that `next-types` added — which catches extensionless
relative specifiers in the emitted `.d.ts`, a defect that silently degrades
every exported type to `any` for `nodenext` consumers — existed in exactly one
of the three `"type": "module"` packages that needed it. `next-ui` and `next`
have it now. **When a gate is added to one framework package, check whether its
siblings have the same exposure**; three of these four packages share a build
shape, so most gates generalise.

### Fix

Pick one of two directions; don't do both.

1. **Make the docs true** — add `eslint.config.js` + a `lint` script to each of
   the four packages. `packages/design-system/eslint.config.js` is the working
   reference. Expect a first-run backlog of findings; land the config with rules
   at `warn` if needed, then tighten.
2. **Make the docs match reality** — if ESLint is not wanted on the framework
   packages, say so in `.claude/shared/hard-rules.md` and give each package
   `typecheck` + `noUnusedLocals` instead, mirroring what `next-auth` has.

Either way, also add a `typecheck` script to the package still missing one —
**`next`** — so the root `pnpm typecheck` covers all four. `next-auth`,
`next-types` and `next-ui` are done.

### References

- Root `package.json` — `lint`, `typecheck`
- `packages/framework/next-auth/tsconfig.json` — the `noUnusedLocals` mitigation
- `packages/framework/next-auth/package.json` — `release` with `typecheck` wired in
- `packages/framework/next-types/package.json` / `tsconfig.json` — the same mitigation, applied
- `.claude/shared/hard-rules.md` — the toolchain claim to correct or satisfy

---

## 2. `layoutMockData` is production configuration wearing a preview-mode name

**Status:** open · pre-existing · found 2026-09-21 during a review of
`@igrp/framework-next-types`

**Affects:** `packages/framework/next` (providers), `packages/framework/next-types`
(the type + field name), `templates/demo-v1` (migration)

**Severity:** medium — no current misbehaviour, but the name invites a change
that breaks production silently.

### Symptom

`IGRPConfigArgs.layoutMockData` and its type `IGRPMockDataAsync` read as
preview-only scaffolding. They are the framework's primary header/sidebar
configuration source whenever auth is real.

### Root cause

Both providers call it unconditionally, outside the `previewMode` branch:

- `packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx:27`
  calls `layoutMockData.getSidebarData()` **before** the `previewMode` check on
  line 29.
- `packages/framework/next/src/layouts/providers/header-data-provider.tsx:47`
  and `:63` call `getHeaderData()` in *each* branch.

Production overrides only what Access Management can supply:

| Source             | Overridden in production                                  | Live in production                                                                                         |
| ------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `getHeaderData()`  | `user`, `showIGRPSidebarTrigger`                           | every other `show*` flag, `settingsUrl`, `settingsIcon`, `notificationsUrl`, `userProfileUrl`, `headerLogo` |
| `getSidebarData()` | `user`, `menuItems`, `apps`, `appCode`, `showPreviewMode`  | `defaultOpen`, `showAppSwitcher`, `appCenterUrl`, `showMenuSearch`, `showNotifications`                    |

### Why it matters

An app author who reads the name and returns a stub in production — or gates the
whole factory behind `previewMode` — loses the entire header and sidebar
configuration. There is no error and no type complaint; the chrome just renders
nothing.

### Already mitigated

`@igrp/framework-next-types` now documents the real semantics on
`IGRPMockDataAsync` and on the `layoutMockData` field, including the override
table above. That removes the trap for anyone who reads the type.

### Fix when reviewing `@igrp/framework-next`

Rename the concept to something honest — `layoutData` / `IGRPLayoutDataSource` —
keeping `layoutMockData` / `IGRPMockDataAsync` as deprecated aliases for one
release, per the additive-only rule in
`packages/framework/next-types/CLAUDE.md`. Needs, in order:

1. `next-types`: add the new names, deprecate the old, keep both assignable.
2. `next`: read the new field with a fallback to the old one in `igrpBuildConfig`
   and both providers.
3. `templates/demo-v1`: switch `igrp.template.config.ts`, shipped as a
   template-migrator migration.

### References

- `packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx:27`
- `packages/framework/next/src/layouts/providers/header-data-provider.tsx:47,63`
- `packages/framework/next-types/src/types/globals.ts` — `IGRPMockDataAsync`

---

## 3. `IGRPSidebarDataArgs.showPreviewMode` is written by one package and read by none

**Status:** open · **decision taken 2026-09-21** during the `@igrp/framework-next-ui`
review: **delete both ends**, on the schedule the deprecation already sets.

**Affects:** `packages/framework/next` (writes it), `packages/framework/next-types`
(the deprecated field)

**Severity:** low — a dead wire, but it advertises a feature that does not exist.

### Symptom

`SidebarDataProvider` sets `showPreviewMode: previewMode`
(`sidebar-data-provider.tsx:54`). Nothing consumes it:

```
grep -rni "previewmode" packages/framework/next-ui/src packages/design-system/src
→ no matches
```

So no preview-mode badge is ever rendered, though the plumbing implies one.

### Why "delete", not "implement"

The `next-ui` review considered rendering the badge and rejected it. The field
is already `@deprecated`, and `packages/framework/next-types/CLAUDE.md` lists it
among the fields scheduled to come out **one release after they landed**.
Implementing a reader would resurrect a field the team has already decided to
remove, and would have to un-deprecate it in `next-types` to do so. `next-ui`
therefore adds no consumer.

A preview-mode indicator is still a reasonable feature — it just should not ride
on this field. If it is wanted, add it as an explicit prop on
`IGRPTemplateSidebar` alongside `menuLabels` / `navUserLabels`.

### Remaining work (not in `next-ui`)

1. `next`: drop the `showPreviewMode` write in `sidebar-data-provider.tsx:54`.
2. `next-types`: remove the field when its deprecation window closes.

### References

- `packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx:54`
- `packages/framework/next-types/src/types/sidebar.ts` — `showPreviewMode`
- `packages/framework/next-types/CLAUDE.md` — the removal schedule

---

## 4. The shipped migrations are 9 dependency pins behind the workspace

**Status:** open · pre-existing · found 2026-09-21

**Affects:** `packages/framework/template-migrator`, `templates/demo-v1`

**Severity:** medium — it blocks `pnpm --filter @igrp/template-migrator release`,
whose `check:drift` gate fails.

### Symptom

```
✗ 9 dependency(ies) bumped in the workspace but NOT captured in a migration:
    @igrp/framework-next: template resolves to 0.1.0-beta.172, latest migration pins 0.1.0-beta.170
    @igrp/framework-next-auth, @igrp/framework-next-types, @igrp/framework-next-ui,
    @igrp/igrp-framework-react-design-system, @igrp/platform-access-management-client-ts,
    zod, react-hook-form, @types/react-dom
```

File drift is zero; this is dependency drift only.

### Why it is not fixed yet

A resync migration has to pin exact versions, and the ones for the current wave
do not exist until `pnpm version:changesets` runs. Writing it earlier means
guessing version numbers.

### Fix at release time

Author the resync migration **after** versioning, as migrations 30 and 31 were.
It must also carry the `@igrp/framework-next-types` pin that migration
`38-config-client-annotation` depends on — that migration's payload does not
compile against an older `IGRPConfigClient`.

### References

- `packages/framework/template-migrator/scripts/check-drift.ts`
- `packages/framework/template-migrator/migrations/demo-v1/31.MIGRATIONS-31082026.md` — the pattern
- `packages/framework/template-migrator/migrations/demo-v1/38.MIGRATIONS-21092026.md` — the dependent migration

---

## Per-package known issues

| Package                     | File                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `@igrp/framework-next`      | [packages/framework/next/KNOWN-ISSUES.md](packages/framework/next/KNOWN-ISSUES.md)           |
| `@igrp/framework-next-auth` | [packages/framework/next-auth/KNOWN-ISSUES.md](packages/framework/next-auth/KNOWN-ISSUES.md) |
