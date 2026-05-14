# Design: Flatten Migration Lock File + Move Authoring to CLI Package

**Date:** 2026-05-14  
**Status:** Approved

## Problem

The `.igrpmigrations/` folder in `templates/demo-legacy` serves two unrelated purposes:
1. **Authoring** — migration guide `.md` files and `payload/` folders that get packed into the CLI at build time
2. **State tracking** — `lock.json` tracking which migrations have been applied to a consumer's template

This co-location is confusing: authoring artifacts (framework-internal) live inside the consumer template, and the lock file is buried inside a folder instead of being a visible root-level file like `skills-lock.json`.

## Goal

- Move authoring artifacts (guides + payloads) into the CLI package where they belong
- Replace `.igrpmigrations/lock.json` with `.igrp-migrations-lock.json` at the template/consumer root
- Add an explicit `igrp-migrate convert` command to upgrade existing consumers
- Remove all previous backward-compat lock path layers

---

## File Structure Changes

### Before

```
packages/template-migrator/
  scripts/pack.ts          ← reads templates/demo-legacy/.igrpmigrations/
  src/lock.ts              ← reads/writes .igrpmigrations/lock.json

templates/demo-legacy/
  .igrpmigrations/
    lock.json
    01.MIGRATIONS-*.md … 07.MIGRATIONS-*.md
    payload/
      01/ … 07/
```

### After

```
packages/template-migrator/
  migrations/
    demo-legacy/
      01.MIGRATIONS-*.md … 07.MIGRATIONS-*.md
      payload/
        01/ … 07/
  scripts/pack.ts          ← reads migrations/demo-legacy/
  src/lock.ts              ← reads/writes .igrp-migrations-lock.json
  src/commands/convert.ts  ← new command

templates/demo-legacy/
  .igrp-migrations-lock.json   ← replaces entire .igrpmigrations/ folder
```

`migrations/demo-legacy/` inside `template-migrator` is the new authoring home. New migrations (08, 09, …) are authored there. `templates/demo-legacy` becomes a pure consumer — only the lock file lives there.

---

## `igrp-migrate convert` Command

Converts a consumer project from the legacy lock path to the new one.

**Usage:** `igrp-migrate convert` (run from project root)

**Behavior:**

| Condition | Result |
|---|---|
| `.igrpmigrations/lock.json` not found | Error: `No legacy lock file found at .igrpmigrations/lock.json. Nothing to convert.` |
| `.igrp-migrations-lock.json` already exists | Error: `Already converted. .igrp-migrations-lock.json exists.` |
| Legacy file found, no new file | Reads legacy content → writes `.igrp-migrations-lock.json` → deletes `.igrpmigrations/lock.json` → deletes `.igrpmigrations/` folder if now empty → prints summary |

**Output on success:**
```
Converted .igrpmigrations/lock.json → .igrp-migrations-lock.json
```

---

## Legacy Detection in All Other Commands

`status`, `plan`, `apply`, `check`, `rollback` — all detect the legacy path via a `LegacyLockError` thrown from `readLock()` and block with:

```
Legacy lock file found at .igrpmigrations/lock.json.
Run `igrp-migrate convert` to upgrade, then retry.
```

No silent fallback reads from the old path. Hard block forces an explicit upgrade.

---

## Code Changes in `packages/template-migrator`

### `src/lock.ts`
- Lock path constant: `.igrpmigrations/lock.json` → `.igrp-migrations-lock.json`
- Remove existing `.igrpmigrations.lock.json` → `.igrpmigrations/lock.json` backward-compat migration (dead code)
- `readLock()` checks for `.igrpmigrations/lock.json` and throws `LegacyLockError` if found

### `src/commands/convert.ts` *(new)*
- Implements the convert flow above
- Deletes the folder if empty after removing `lock.json`

### `src/cli.ts`
- Registers the new `convert` command
- Wraps all existing commands to catch `LegacyLockError` and print the upgrade prompt

### `scripts/pack.ts`
- Source path: `../../templates/demo-legacy/.igrpmigrations/` → `../migrations/demo-legacy/`

---

## `templates/demo-legacy` Changes

- Move all `.igrpmigrations/NN.MIGRATIONS-*.md` files to `packages/template-migrator/migrations/demo-legacy/`
- Move `.igrpmigrations/payload/` to `packages/template-migrator/migrations/demo-legacy/payload/`
- Delete `.igrpmigrations/` folder
- Create `.igrp-migrations-lock.json` with current `lock.json` content

---

## Backward Compatibility

| Old path | New path | How handled |
|---|---|---|
| `.igrpmigrations.lock.json` | (removed) | Existing compat layer deleted — it already ran for all consumers |
| `.igrpmigrations/lock.json` | `.igrp-migrations-lock.json` | Detected by `readLock()` → throws `LegacyLockError` → all commands block and direct to `igrp-migrate convert` |

---

## Out of Scope

- Renaming the authoring folder to anything other than `migrations/demo-legacy/` inside the CLI package
- Multi-template support (architecture already supports it; this change doesn't regress it)
- Changes to migration guide format or YAML frontmatter
