# `/release-framework` Command Design

**Date:** 2026-05-12
**Status:** Approved

## Goal

A single Claude Code slash command that automates the full changeset → version → build → publish cycle for framework packages, with zero manual steps and all project hard rules enforced automatically.

## Invocation

```
/release-framework
```

No arguments. The command infers everything from the current git state.

## File

`.claude/commands/release-framework.md`

---

## Workflow (10 steps, sequential, stop on failure)

1. **Detect changed packages** — run `git diff HEAD` and `git status` to find modified files; map to framework packages by path prefix (see mapping table below). Files outside framework paths are ignored.
2. **Early exit** — if no framework package files are detected, stop and report: "No framework package changes detected — nothing to release."
3. **Generate summary** — read the diff content for detected packages; write a concise changelog summary (max 3 plain-English bullets).
4. **Write changeset file** — create `.changeset/<slug>.md` with `patch` type for each affected package and the generated summary.
5. **Commit changeset** — `git add .changeset/<slug>.md` → commit with message `chore: add changeset for <package-list>`.
6. **Version packages** — `pnpm version:changesets` → bumps `package.json` versions and regenerates `CHANGELOG.md` files → commit with message `chore: version packages`.
7. **Build affected packages** — run each package's build script in dependency order (next-auth → next-types → ds → next-ui → next), skipping packages not in the affected set.
8. **Release affected packages** — run each package's `release` script in the same dependency order.
9. **Verify** — for each released package, run `pnpm view <pkg> version --registry=https://sonatype.nosi.cv/repository/igrp/` and confirm the new version is live.
10. **Report** — print a summary table: package | old version | new version | status (✓ / ✗).

---

## Package Mapping

| Path prefix | NPM package | Build script | Release script |
|---|---|---|---|
| `packages/framework/next-auth/` | `@igrp/framework-next-auth` | `pnpm build:auth` | `pnpm --filter @igrp/framework-next-auth release` |
| `packages/framework/next-types/` | `@igrp/framework-next-types` | `pnpm build:next-types` | `pnpm --filter @igrp/framework-next-types release` |
| `packages/design-system/` | `@igrp/igrp-framework-react-design-system` | `pnpm build:ds` | `pnpm --filter @igrp/igrp-framework-react-design-system release` |
| `packages/framework/next-ui/` | `@igrp/framework-next-ui` | `pnpm build:next-ui` | `pnpm --filter @igrp/framework-next-ui release` |
| `packages/framework/next/` | `@igrp/framework-next` | `pnpm build:next` | `pnpm --filter @igrp/framework-next release` |

**Dependency order (always respected for build and release):**
```
next-auth → next-types → ds → next-ui → next
```

---

## Changeset File Format

```markdown
---
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
---

- Fix sidebar overflow on mobile viewports
- Add formatLabel prop to IGRPTemplateBreadcrumbs for dynamic segment labels
```

- Type is always `patch` — never `minor` or `major` (pre-release mode constraint).
- Summary is auto-generated from the git diff (max 3 bullets).

---

## Commit Messages

| Step | Message |
|---|---|
| After writing changeset | `chore: add changeset for <package-list>` |
| After `version:changesets` | `chore: version packages` |

---

## Hard Constraints (non-negotiable)

- Changeset type: always `patch`.
- Registry: always `https://sonatype.nosi.cv/repository/igrp/`.
- Release: always per-package `release` script — never `changeset publish`, never `release:all`, never `release:publish`.
- Build and release order: always follows the dependency chain.
- Registry query: before (capture old version) and after (verify publish) — never infer publish status from config.

---

## Error Handling

- Stop immediately on any non-zero exit. Do not attempt rollback.
- Show the raw error output verbatim.
- Rationale: partial release state (e.g. versioned but not published) requires human review, not automated undo.

---

## Idempotency

If packages are already versioned (changeset already consumed) and the registry shows the bumped version is not yet published, the command skips to the build + publish steps rather than creating a duplicate changeset.

---

## Out of Scope

- Template package (`templates/demo-legacy`) — not released via this command.
- `@igrp/igrp-framework-react-design-system-storybook` — ignored (listed in changeset ignored packages).
- Interactive mode — no prompts, no confirmations mid-run.
