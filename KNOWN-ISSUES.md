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

`next-auth` now sets `noUnusedLocals` / `noUnusedParameters` in its
`tsconfig.json` and runs `typecheck` as part of `release`, which closes the
unused-symbol class of defect **for that package only**. The root now also has a
`typecheck` script (`pnpm -r run typecheck`) — but the same skip-if-absent rule
applies, and only `next-auth` defines `typecheck` today.

### Fix

Pick one of two directions; don't do both.

1. **Make the docs true** — add `eslint.config.js` + a `lint` script to each of
   the four packages. `packages/design-system/eslint.config.js` is the working
   reference. Expect a first-run backlog of findings; land the config with rules
   at `warn` if needed, then tighten.
2. **Make the docs match reality** — if ESLint is not wanted on the framework
   packages, say so in `.claude/shared/hard-rules.md` and give each package
   `typecheck` + `noUnusedLocals` instead, mirroring what `next-auth` has.

Either way, also add `typecheck` scripts to `next`, `next-types` and `next-ui`
so the new root `pnpm typecheck` covers more than one package.

### References

- Root `package.json` — `lint`, `typecheck`
- `packages/framework/next-auth/tsconfig.json` — the `noUnusedLocals` mitigation
- `packages/framework/next-auth/package.json` — `release` with `typecheck` wired in
- `.claude/shared/hard-rules.md` — the toolchain claim to correct or satisfy

---

## Per-package known issues

| Package                     | File                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `@igrp/framework-next`      | [packages/framework/next/KNOWN-ISSUES.md](packages/framework/next/KNOWN-ISSUES.md)           |
| `@igrp/framework-next-auth` | [packages/framework/next-auth/KNOWN-ISSUES.md](packages/framework/next-auth/KNOWN-ISSUES.md) |
