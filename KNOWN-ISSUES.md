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

The root `typecheck` (`pnpm -r run typecheck`) now covers **all four**
framework packages — `next` gained a `typecheck` script on 2026-09-21 and runs
`typecheck` + `test` in `release`, matching `next-ui`. **No framework package
has ESLint**, which is the part of this entry that remains open.

A second, sharper instance of the same shape was found on 2026-09-21: the
`check:dist` gate that `next-types` added — which catches extensionless
relative specifiers in the emitted `.d.ts`, a defect that silently degrades
every exported type to `any` for `nodenext` consumers — existed in exactly one
of the three `"type": "module"` packages that needed it. `next-ui` and `next`
have it now. **When a gate is added to one framework package, check whether its
siblings have the same exposure**; three of these four packages share a build
shape, so most gates generalise.

> **2026-09-22 — that generalisation was itself too narrow, and it cost us.**
> The paragraph above scoped the sweep to the *framework* packages and stopped.
> `packages/design-system` is the fourth `"type": "module"` Babel-built package,
> it had no `check:dist`, and **all 169 relative specifiers in its
> `dist/index.d.ts` were extensionless** — its entire public type surface was
> `any` for every `node16`/`nodenext` consumer, demonstrated with a `tsc` run
> that accepted `IGRPButton({ totallyMadeUpProp: 12345 })` and exited 0.
>
> Fixed on 2026-09-22: 786 source specifiers now carry `.js`, `check:dist` runs
> in `build`, and `release` runs `lint` + `typecheck` + `test`. The design system
> was the **only** package in the repo with a test suite *and* an ESLint config
> that gated on neither, and it had no `typecheck` script, so `pnpm -r run
> typecheck` silently skipped it — the same `pnpm -r` skip this entry opens with.
> Root `typecheck` now covers **five** packages, not four.
>
> Two lessons, both already paid for twice:
>
> 1. **"All four framework packages" is the wrong unit.** The unit is "every
>    package that shares the build shape", and `design-system` is one of them.
>    Sweep by property, not by directory.
> 2. **A guard that can pass while checking nothing is not a guard.** The design
>    system already had an assertion for this exact defect —
>    `build-pipeline.test.ts` → "emits fully specified relative specifiers" — and
>    it had never once run: the pattern had lost its backslashes
>    (`/froms+"(.[^"]*)"/`), so it matched the literal text `froms`, found
>    nothing, and passed unconditionally. This is the third instance of the
>    silent-no-op guard in this repo, after the `'use client'` quote bug in
>    `scripts/react-compiler-babel-config.cjs` and the missing `check:dist`.
>    Every new guard should assert that it *did some work* — the repaired test
>    and `check-dist.mjs` both now fail when they inspect zero items.

> **2026-09-22 — a fourth instance, found reviewing `templates/demo-v1`.** Same
> family, new failure mode: not a guard that checked nothing, but a guard that
> checked **the wrong thing**.
>
> `warnOnRefetchIntervalMisconfiguration` (`next-auth/src/config.ts`) compared
> `IGRP_SESSION_REFETCH_INTERVAL` against the 60s proactive-refresh buffer. No
> code anywhere reads that variable — the client poll cadence is whatever the app
> passes as `sessionArgs.refetchInterval`, which in `demo-v1` is a hardcoded
> 600s. So the guard inspected the documented `45`, passed, and stayed silent
> while the effective value was `600`: ten times past the ceiling it existed to
> enforce. `.env.example` meanwhile instructed every consumer to set a variable
> with no effect, under a heading asserting a hard ceiling — advice that could
> only waste their time.
>
> Fixed 2026-09-22: the check now warns that the variable is set and inert,
> which is the one thing it can observe and be right about; `.env.example`
> records that the knob's absence is deliberate (migration 40); and the README,
> the `TOKEN_REFRESH_BUFFER_MS` comment and the claims-expired error in
> `framework-next` no longer point at it.
>
> The lesson to add to the two above: **a guard must read the same value the
> thing it protects reads.** Assert the subject, not a proxy for it. When the
> effective value lives somewhere the guard cannot see, that is a signal the
> check belongs at the other end — not that a nearby variable will do.

### Fix

Pick one of two directions; don't do both.

1. **Make the docs true** — add `eslint.config.js` + a `lint` script to each of
   the four packages. `packages/design-system/eslint.config.js` is the working
   reference. Expect a first-run backlog of findings; land the config with rules
   at `warn` if needed, then tighten.
2. **Make the docs match reality** — if ESLint is not wanted on the framework
   packages, say so in `.claude/shared/hard-rules.md` and give each package
   `typecheck` + `noUnusedLocals` instead, mirroring what `next-auth` has.

The `typecheck` half of this entry is **done** — all four packages define one
and the root `pnpm typecheck` covers them. Only the ESLint decision is left.

### References

- Root `package.json` — `lint`, `typecheck`
- `packages/framework/next-auth/tsconfig.json` — the `noUnusedLocals` mitigation
- `packages/framework/next-auth/package.json` — `release` with `typecheck` wired in
- `packages/framework/next-types/package.json` / `tsconfig.json` — the same mitigation, applied
- `.claude/shared/hard-rules.md` — the toolchain claim to correct or satisfy

---

## 2. ~~`layoutMockData` is production configuration wearing a preview-mode name~~

**Status: FIXED 2026-09-21** during the review of `@igrp/framework-next`.

`IGRPConfigArgs.layoutData` (type `IGRPLayoutDataSource`) is the honest name.
`layoutMockData` / `IGRPMockDataAsync` remain as a deprecated optional field and
a type alias for one release; `igrpResolveLayoutDataSource` reads either and
**rejects a config that sets both** — the two can disagree and there is no
principled winner. `templates/demo-v1` is switched, shipped as migration
`39-layout-data-source-rename`.

Remaining: delete `layoutMockData` / `IGRPMockDataAsync` when the deprecation
window closes.

---

## 3. `IGRPSidebarDataArgs.showPreviewMode` is written by one package and read by none

**Status:** writer removed 2026-09-21; the deprecated field itself is still
declared in `next-types`. **Decision taken 2026-09-21** during the `@igrp/framework-next-ui`
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

### Remaining work

1. ~~`next`: drop the `showPreviewMode` write in `sidebar-data-provider.tsx:54`.~~
   **Done 2026-09-21** — the write is gone, with a comment recording why it is
   not coming back.
2. `next-types`: remove the field when its deprecation window closes. *(open)*

### References

- `packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx:54`
- `packages/framework/next-types/src/types/sidebar.ts` — `showPreviewMode`
- `packages/framework/next-types/CLAUDE.md` — the removal schedule

---

## 4. ~~The shipped migrations are 9 dependency pins behind the workspace~~

**Status: FIXED 2026-09-22** by migration `40-review-hardening`
(`migrations/demo-v1/40.MIGRATIONS-22092026.md`), which pins all nine in a
single `deps.bump` — `@igrp/framework-next` `0.1.0-beta.172`,
`@igrp/framework-next-auth` `0.1.0-beta.146`, `@igrp/framework-next-types`
`0.1.0-beta.149` (the pin migration `38-config-client-annotation` depends on),
`@igrp/framework-next-ui` `0.1.0-beta.168`,
`@igrp/igrp-framework-react-design-system` `0.1.0-beta.146`,
`@igrp/platform-access-management-client-ts` `0.2.0-beta.16`, `zod` `4.6.5`,
`react-hook-form` `7.88.0`, `@types/react-dom` `19.2.7`. The same migration
carries a `deps.remove` for `cn`, which migration 37 had added and which the
template dropped when the design system gained its server-safe `/cn` entry.

Verified 2026-09-22: `check:drift` reports zero dependency drift across 13 pins,
and no file, orphan, or lock drift either — the gate is green, so
`pnpm --filter @igrp/template-migrator release` is no longer blocked by this.

---

## Per-package known issues

| Package                     | File                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `@igrp/framework-next`      | [packages/framework/next/KNOWN-ISSUES.md](packages/framework/next/KNOWN-ISSUES.md)           |
| `@igrp/framework-next-auth` | [packages/framework/next-auth/KNOWN-ISSUES.md](packages/framework/next-auth/KNOWN-ISSUES.md) |
