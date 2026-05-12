# /release-framework

Automated end-to-end release command for IGRP framework packages. No arguments needed.

Execute the following steps in order. **Stop immediately and report the raw error output if any step fails. Do NOT attempt rollback.**

---

## Step 1 — Detect changed packages

Run `git diff HEAD` and `git status --short` to find modified files. Map files to packages by path prefix:

| Path prefix | NPM package | Build script | Release script |
|---|---|---|---|
| `packages/framework/next-auth/` | `@igrp/framework-next-auth` | `pnpm build:auth` | `pnpm --filter @igrp/framework-next-auth release` |
| `packages/framework/next-types/` | `@igrp/framework-next-types` | `pnpm build:next-types` | `pnpm --filter @igrp/framework-next-types release` |
| `packages/design-system/` | `@igrp/igrp-framework-react-design-system` | `pnpm build:ds` | `pnpm --filter @igrp/igrp-framework-react-design-system release` |
| `packages/framework/next-ui/` | `@igrp/framework-next-ui` | `pnpm build:next-ui` | `pnpm --filter @igrp/framework-next-ui release` |
| `packages/framework/next/` | `@igrp/framework-next` | `pnpm build:next` | `pnpm --filter @igrp/framework-next release` |

Files outside these prefixes (templates, apps, scripts, docs, `.claude/`) are ignored.

**If no framework package files are detected:** stop and report "No framework package changes detected — nothing to release."

---

## Step 2 — Query registry for current (pre-release) versions

For each detected package, run:

```powershell
pnpm view <pkg> version --registry=https://sonatype.nosi.cv/repository/igrp/
```

Record each result as the **old version** for the final summary table.

---

## Step 3 — Idempotency check

Check whether a `.changeset/*.md` file already exists covering the detected packages AND `pnpm version:changesets` has already been run (i.e., the `package.json` version fields have already been bumped past the old versions).

- If **both** are true: skip Steps 4–7 and go directly to Step 8 (build).
- Otherwise: continue with Step 4.

---

## Step 4 — Generate changeset summary

Read the full `git diff HEAD` output for the detected packages. Write a concise summary of **at most 3 plain-English bullet points** describing the user-visible changes. Focus on what changed, not file names or internal details.

---

## Step 5 — Write the changeset file

Create `.changeset/<slug>.md` where `<slug>` is a two-word kebab-case identifier (e.g. `golden-wolf`, `happy-trees`).

Use exactly this format:

```
---
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
---

- <bullet from Step 4>
- <bullet from Step 4 if applicable>
- <bullet from Step 4 if applicable>
```

**HARD RULE: type is always `patch`. Never write `minor` or `major`.**

---

## Step 6 — Commit the changeset

```powershell
git add .changeset/<slug>.md
git commit -m "chore: add changeset for <comma-separated short names>"
```

Short names: `next-auth`, `next-types`, `ds`, `next-ui`, `next`.

---

## Step 7 — Version packages

```powershell
pnpm version:changesets
```

This consumes the changeset file, bumps `package.json` versions, and regenerates `CHANGELOG.md` files. Then commit:

```powershell
git add .
git commit -m "chore: version packages"
```

---

## Step 8 — Build affected packages (dependency order)

Run only the build scripts for affected packages, **in this exact order** (skip any not affected):

1. `pnpm build:auth` — if `@igrp/framework-next-auth` is affected
2. `pnpm build:next-types` — if `@igrp/framework-next-types` is affected
3. `pnpm build:ds` — if `@igrp/igrp-framework-react-design-system` is affected
4. `pnpm build:next-ui` — if `@igrp/framework-next-ui` is affected
5. `pnpm build:next` — if `@igrp/framework-next` is affected

---

## Step 9 — Release affected packages (dependency order)

Run only the release scripts for affected packages, **in the same dependency order** (skip any not affected):

1. `pnpm --filter @igrp/framework-next-auth release`
2. `pnpm --filter @igrp/framework-next-types release`
3. `pnpm --filter @igrp/igrp-framework-react-design-system release`
4. `pnpm --filter @igrp/framework-next-ui release`
5. `pnpm --filter @igrp/framework-next release`

**HARD RULE: never use `changeset publish`, `release:all`, or `release:publish`. Always use the per-package `release` script above.**

---

## Step 10 — Verify and report

For each released package, query the registry to confirm the new version is live:

```powershell
pnpm view <pkg> version --registry=https://sonatype.nosi.cv/repository/igrp/
```

Print a summary table:

| Package | Old Version | New Version | Status |
|---|---|---|---|
| `@igrp/framework-next-ui` | `0.1.0-beta.X` | `0.1.0-beta.Y` | ✓ |

Mark ✓ if the registry returns the new version, ✗ with the raw error if it does not.
