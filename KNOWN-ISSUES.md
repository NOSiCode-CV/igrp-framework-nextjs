# Known issues — repo-wide

Understood, reproducible defects that are **not yet fixed**, and that span more
than one package. Single-package items live in that package's own
`KNOWN-ISSUES.md` (see the index at the bottom).

Each entry is a handover note: enough to act on without re-deriving the
diagnosis. When you review or work in an affected package, fix the entry that
names it and delete it from here.

---

## 1. The framework packages have no ESLint gate

**Status:** open · pre-existing · found 2026-09-21 during a review of
`@igrp/framework-next-auth`

**Affects:** `packages/framework/next`, `next-auth`, `next-types`, `next-ui`,
`next-i18n`

**Severity:** low individually, medium cumulatively — it is a missing gate, not a
bug. It already let a defect ship (an unused `isOidcManagedProviderId` import in
`next-auth/src/config.ts`, the fingerprint of a guard that was never wired up).

### Symptom

`pnpm lint` at the repo root reports success while linting none of the framework
packages.

### Root cause

Root `lint` is `pnpm -r run lint`, and **`pnpm -r run` silently skips any package
that does not define the script**. None of the five framework packages defines
`lint`, and none has an `eslint.config.*`. Only `packages/design-system` and
`design-system-storybook` have ESLint. So the claim in
`.claude/shared/hard-rules.md` — "Framework packages: **ESLint + Prettier**" —
is true for Prettier and false for ESLint.

### Already in place

The `typecheck` half is done: every framework package defines `typecheck`, so
root `pnpm typecheck` covers them, and `next-auth` / `next-types` / `next-ui` set
`noUnusedLocals` / `noUnusedParameters`, which closes the unused-symbol class.
`check:dist` runs in `next-types`, `next-ui`, `next` and `design-system`.

### Lessons from the gates already added

1. **Sweep by property, not by directory.** When a gate lands in one package,
   add it to every package with the same build shape (`design-system` shares the
   framework packages' Babel/`"type": "module"` shape and was missed once).
2. **A guard that can pass while checking nothing is not a guard.** New guards
   must fail when they inspect zero items.
3. **A guard must read the same value the thing it protects reads** — assert the
   subject, not a proxy for it.

### Fix

Pick one of two directions; don't do both.

1. **Make the docs true (recommended)** — copy
   `packages/design-system/eslint.config.js` into each of the five packages, add
   `"lint": "eslint ."` (plus `eslint` and the plugins it uses as
   devDependencies), run it once, and land with noisy rules at `warn` if the
   first-run backlog is large. Then add `lint` to each package's `release`
   script, as `design-system` does, so it gates publishing.
2. **Make the docs match reality** — if ESLint is not wanted on the framework
   packages, change the toolchain line in `.claude/shared/hard-rules.md` (and
   the `pnpm lint` line in the root `README.md`) to say framework packages use
   Prettier + `typecheck`, and add `noUnusedLocals` / `noUnusedParameters` to the
   `tsconfig` of `next` and `next-i18n`, mirroring `next-auth` and `next-ui`.

### References

- Root `package.json` — `lint`, `typecheck`
- `packages/design-system/eslint.config.js` / `package.json` — the reference config and `release`
- `packages/framework/next-auth/tsconfig.json` — the `noUnusedLocals` mitigation
- `.claude/shared/hard-rules.md` — the toolchain claim to correct or satisfy

---

## 2. Deprecated layout-data and sidebar fields are still declared

**Status:** open · consumers already migrated · deletion due

**Affects:** `packages/framework/next-types` (declarations),
`packages/framework/next` (the `layoutMockData` fallback)

**Severity:** low — dead surface that advertises things that no longer apply.

### What is left

- **`IGRPConfigArgs.layoutMockData` / `IGRPMockDataAsync`** — superseded by
  `layoutData` / `IGRPLayoutDataSource` on 2026-09-21. `demo-v1` was switched by
  migration `39-layout-data-source-rename`; `igrpBuildConfig` still accepts the
  old name and rejects a config that sets both.
- **`IGRPSidebarDataArgs.showPreviewMode`** — written by nothing (the `next`
  write was removed and a test asserts it stays gone) and read by nothing. The
  decision is **delete, not implement**: a preview-mode indicator, if wanted,
  should be an explicit prop on `IGRPTemplateSidebar`, not this field.

Both were scheduled to come out one release after they landed
(`packages/framework/next-types/CLAUDE.md`); that window has passed — the line
has since moved from `0.1.0-beta.*` to `0.2.0-beta.*`.

### Fix

1. `next-types`: delete `layoutMockData` (`src/types/igrp.ts`),
   `IGRPMockDataAsync` (`src/types/globals.ts`, and its export in
   `src/index.ts`), and `showPreviewMode` (`src/types/sidebar.ts`, plus the
   table row in `globals.ts`). Do the other fields in the same scheduled list
   at the same time.
2. `next`: drop the `layoutMockData` branches in `src/lib/build.ts` (schema,
   the "both set" check, the error copy), in `igrpResolveLayoutDataSource`
   (`src/lib/layout-data-source.ts`), and
   in the `Pick<…>` of `header-data-provider.tsx` / `sidebar-data-provider.tsx`.
3. Run `pnpm build:framework`, `pnpm typecheck` and the `next` / `next-types`
   tests (`check:contract` will flag anything still referencing the removed
   names). `demo-v1` only mentions `layoutMockData` in a comment
   (`src/lib/header-search.ts`), so no template migration is needed.
4. Patch changesets for `next-types` and `next`, then update the "Open items" in
   `packages/framework/next-types/CLAUDE.md` and delete this entry.

---

## Per-package known issues

| Package                     | File                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `@igrp/framework-next`      | [packages/framework/next/KNOWN-ISSUES.md](packages/framework/next/KNOWN-ISSUES.md)           |
| `@igrp/framework-next-auth` | [packages/framework/next-auth/KNOWN-ISSUES.md](packages/framework/next-auth/KNOWN-ISSUES.md) |
