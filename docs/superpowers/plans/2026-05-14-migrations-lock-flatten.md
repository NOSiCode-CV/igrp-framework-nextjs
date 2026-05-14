# Migrations Lock Flatten Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `templates/demo-legacy/.igrpmigrations/` (folder with lock + authoring files) with a flat `.igrp-migrations-lock.json` at the template root, and move authoring artifacts (migration guides + payloads) into `packages/template-migrator/migrations/demo-legacy/`.

**Architecture:** Migration guides and payloads move from the consumer template into the CLI package where they are authored and built. The lock file becomes a single root-level JSON file (like `skills-lock.json`). A new `igrp-migrate convert` command handles the upgrade path for existing consumers. All commands hard-block on the legacy path and direct users to run `convert`.

**Tech Stack:** TypeScript, Node.js fs, tsup (CLI build), pnpm workspaces

---

## File Map

| Action | Path |
|---|---|
| **Move** | `templates/demo-legacy/.igrpmigrations/0*.MIGRATIONS-*.md` → `packages/template-migrator/migrations/demo-legacy/` |
| **Move** | `templates/demo-legacy/.igrpmigrations/payload/` → `packages/template-migrator/migrations/demo-legacy/payload/` |
| **Delete** | `templates/demo-legacy/.igrpmigrations/` (entire folder) |
| **Create** | `templates/demo-legacy/.igrp-migrations-lock.json` |
| **Modify** | `packages/template-migrator/scripts/pack.ts` line 10 |
| **Modify** | `packages/template-migrator/src/types.ts` — add `LegacyLockError` |
| **Rewrite** | `packages/template-migrator/src/lock.ts` |
| **Create** | `packages/template-migrator/src/commands/convert.ts` |
| **Modify** | `packages/template-migrator/src/cli.ts` — register command + catch `LegacyLockError` |

---

## Task 1: Move migration guides + payload into the CLI package

**Files:**
- Create dir: `packages/template-migrator/migrations/demo-legacy/`
- Move: all `0*.MIGRATIONS-*.md` files from `templates/demo-legacy/.igrpmigrations/`
- Move: `payload/` subtree from `templates/demo-legacy/.igrpmigrations/`

- [ ] **Step 1: Create the destination directory and move files with git**

Run from repo root (preserves git history):
```powershell
git mv templates/demo-legacy/.igrpmigrations/01.MIGRATIONS-10112025.md packages/template-migrator/migrations/demo-legacy/01.MIGRATIONS-10112025.md
git mv templates/demo-legacy/.igrpmigrations/02.MIGRATIONS-05122025.md packages/template-migrator/migrations/demo-legacy/02.MIGRATIONS-05122025.md
git mv templates/demo-legacy/.igrpmigrations/03.MIGRATIONS-04022026.md packages/template-migrator/migrations/demo-legacy/03.MIGRATIONS-04022026.md
git mv templates/demo-legacy/.igrpmigrations/04.MIGRATIONS-20042026.md packages/template-migrator/migrations/demo-legacy/04.MIGRATIONS-20042026.md
git mv templates/demo-legacy/.igrpmigrations/05.MIGRATIONS-23042026.md packages/template-migrator/migrations/demo-legacy/05.MIGRATIONS-23042026.md
git mv templates/demo-legacy/.igrpmigrations/06.MIGRATIONS-23042026.md packages/template-migrator/migrations/demo-legacy/06.MIGRATIONS-23042026.md
git mv templates/demo-legacy/.igrpmigrations/07.MIGRATIONS-06052026.md packages/template-migrator/migrations/demo-legacy/07.MIGRATIONS-06052026.md
```

- [ ] **Step 2: Move the payload folder**

```powershell
git mv templates/demo-legacy/.igrpmigrations/payload packages/template-migrator/migrations/demo-legacy/payload
```

- [ ] **Step 3: Verify the moves**

```powershell
ls packages/template-migrator/migrations/demo-legacy/
```

Expected: 7 `.md` files + `payload/` directory.

```powershell
ls templates/demo-legacy/.igrpmigrations/
```

Expected: only `lock.json` remains.

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "refactor(template-migrator): move migration guides + payload into CLI package"
```

---

## Task 2: Update `scripts/pack.ts` to read from the new location

**Files:**
- Modify: `packages/template-migrator/scripts/pack.ts` line 10

- [ ] **Step 1: Update the `MIGRATIONS_DIR` constant**

In `packages/template-migrator/scripts/pack.ts`, change line 10 from:
```ts
const MIGRATIONS_DIR = join(ROOT, "../../templates/demo-legacy/.igrpmigrations");
```
to:
```ts
const MIGRATIONS_DIR = join(ROOT, "migrations/demo-legacy");
```

- [ ] **Step 2: Build the CLI and verify the manifest**

```powershell
pnpm --filter @igrp/template-migrator build
```

Then check:
```powershell
cat packages/template-migrator/dist/manifest.json | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const m=JSON.parse(d); console.log('migrations:', m.migrations.length)"
```

On Windows PowerShell use:
```powershell
node -e "const m=require('./packages/template-migrator/dist/manifest.json'); console.log('migrations:', m.migrations.length)"
```

Expected output: `migrations: 7`

- [ ] **Step 3: Commit**

```powershell
git add packages/template-migrator/scripts/pack.ts
git commit -m "refactor(template-migrator): read migration guides from migrations/demo-legacy"
```

---

## Task 3: Add `LegacyLockError` to types and rewrite `lock.ts`

**Files:**
- Modify: `packages/template-migrator/src/types.ts` — add `LegacyLockError` class
- Rewrite: `packages/template-migrator/src/lock.ts`

- [ ] **Step 1: Add `LegacyLockError` to `src/types.ts`**

Append to the end of `packages/template-migrator/src/types.ts`:
```ts
export class LegacyLockError extends Error {
  constructor() {
    super(
      "Legacy lock file found at .igrpmigrations/lock.json.\nRun `igrp-migrate convert` to upgrade, then retry."
    );
    this.name = "LegacyLockError";
  }
}
```

- [ ] **Step 2: Rewrite `src/lock.ts`**

Replace the entire content of `packages/template-migrator/src/lock.ts` with:
```ts
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { LockFile } from "./types.js";
import { LegacyLockError } from "./types.js";

const LOCK_FILE = ".igrp-migrations-lock.json";
const LEGACY_LOCK_PATH = join(".igrpmigrations", "lock.json");

export function lockPath(appRoot: string): string {
  return join(appRoot, LOCK_FILE);
}

export function readLock(appRoot: string): LockFile {
  if (existsSync(join(appRoot, LEGACY_LOCK_PATH))) {
    throw new LegacyLockError();
  }
  const p = lockPath(appRoot);
  if (!existsSync(p)) {
    return { version: 1, template: "demo-legacy", applied: [] };
  }
  return JSON.parse(readFileSync(p, "utf8")) as LockFile;
}

export function writeLock(appRoot: string, lock: LockFile): void {
  writeFileSync(lockPath(appRoot), JSON.stringify(lock, null, 2) + "\n", "utf8");
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```powershell
pnpm --filter @igrp/template-migrator build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```powershell
git add packages/template-migrator/src/types.ts packages/template-migrator/src/lock.ts
git commit -m "feat(template-migrator): replace lock path with .igrp-migrations-lock.json, add LegacyLockError"
```

---

## Task 4: Create `src/commands/convert.ts`

**Files:**
- Create: `packages/template-migrator/src/commands/convert.ts`

- [ ] **Step 1: Create the file**

Create `packages/template-migrator/src/commands/convert.ts` with:
```ts
import { existsSync, readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

const LEGACY_DIR = ".igrpmigrations";
const LEGACY_LOCK = join(LEGACY_DIR, "lock.json");
const NEW_LOCK = ".igrp-migrations-lock.json";

export function convert(appRoot: string): void {
  const legacyPath = join(appRoot, LEGACY_LOCK);
  const newPath = join(appRoot, NEW_LOCK);

  if (!existsSync(legacyPath)) {
    console.error(`No legacy lock file found at ${LEGACY_LOCK}. Nothing to convert.`);
    process.exit(1);
  }

  if (existsSync(newPath)) {
    console.error(`Already converted. ${NEW_LOCK} exists.`);
    process.exit(1);
  }

  const content = readFileSync(legacyPath, "utf8");
  writeFileSync(newPath, content, "utf8");
  unlinkSync(legacyPath);

  const legacyDir = join(appRoot, LEGACY_DIR);
  try {
    if (readdirSync(legacyDir).length === 0) {
      rmdirSync(legacyDir);
    }
  } catch {
    // Directory already gone or not empty — both are fine
  }

  console.log(`Converted ${LEGACY_LOCK} → ${NEW_LOCK}`);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
pnpm --filter @igrp/template-migrator build
```

Expected: no TypeScript errors, `dist/cli.js` updated.

- [ ] **Step 3: Commit**

```powershell
git add packages/template-migrator/src/commands/convert.ts
git commit -m "feat(template-migrator): add igrp-migrate convert command"
```

---

## Task 5: Register `convert` in `cli.ts` and catch `LegacyLockError`

**Files:**
- Modify: `packages/template-migrator/src/cli.ts`

- [ ] **Step 1: Rewrite `src/cli.ts`**

Replace the entire content of `packages/template-migrator/src/cli.ts` with:
```ts
#!/usr/bin/env node
import { resolve } from "path";
import { status } from "./commands/status.js";
import { plan } from "./commands/plan.js";
import { apply } from "./commands/apply.js";
import { list } from "./commands/list.js";
import { rollback } from "./commands/rollback.js";
import { check } from "./commands/check.js";
import { convert } from "./commands/convert.js";
import { LegacyLockError } from "./types.js";

const args = process.argv.slice(2);
const cmd = args[0];
const appRoot = resolve(process.cwd());

async function main() {
  // convert and list don't read the lock file — run them unconditionally
  if (cmd === "convert") { convert(appRoot); return; }
  if (cmd === "list") { list(); return; }

  try {
    switch (cmd) {
      case "status": status(appRoot); break;
      case "plan": {
        const toIdx = args.indexOf("--to");
        const toId = toIdx !== -1 ? args[toIdx + 1] : undefined;
        plan(appRoot, toId);
        break;
      }
      case "apply": {
        const toIdx = args.indexOf("--to");
        const toId = toIdx !== -1 ? args[toIdx + 1] : undefined;
        const yes = args.includes("--yes") || args.includes("-y");
        await apply(appRoot, { toId, yes });
        break;
      }
      case "rollback": {
        const id = args[1];
        if (!id) { console.error("Usage: igrp-migrate rollback <id>"); process.exit(1); }
        await rollback(appRoot, id);
        break;
      }
      case "check": {
        const ok = check(appRoot);
        if (!ok) process.exit(1);
        break;
      }
      default:
        console.log(`
igrp-migrate — IGRP template migration CLI

Usage:
  igrp-migrate status           Show applied/pending migrations
  igrp-migrate list             List all migrations in this CLI version
  igrp-migrate plan [--to <id>] Preview steps without writing
  igrp-migrate apply [--to <id>] [--yes]  Apply pending migrations
  igrp-migrate rollback <id>    Revert a single applied migration
  igrp-migrate check            CI mode: exit 1 if pending migrations exist
  igrp-migrate convert          Upgrade legacy .igrpmigrations/lock.json → .igrp-migrations-lock.json
`);
    }
  } catch (err) {
    if (err instanceof LegacyLockError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Build and smoke-test the help output**

```powershell
pnpm --filter @igrp/template-migrator build
node packages/template-migrator/dist/cli.js
```

Expected: help text includes `igrp-migrate convert`.

- [ ] **Step 3: Commit**

```powershell
git add packages/template-migrator/src/cli.ts
git commit -m "feat(template-migrator): register convert command and catch LegacyLockError in all commands"
```

---

## Task 6: Apply changes to `templates/demo-legacy`

**Files:**
- Create: `templates/demo-legacy/.igrp-migrations-lock.json`
- Delete: `templates/demo-legacy/.igrpmigrations/` (the `lock.json` that remains after Task 1)

- [ ] **Step 1: Create `.igrp-migrations-lock.json` with current lock content**

Create `templates/demo-legacy/.igrp-migrations-lock.json` with:
```json
{
  "version": 1,
  "template": "demo-legacy",
  "applied": [
    {
      "id": "01-preview-mode-not-found",
      "appliedAt": "2025-11-10T00:00:00.000Z",
      "cliVersion": "0.1.1-beta.115",
      "manifestHash": "299eb00d42c2cb9d",
      "undo": [],
      "fileHashes": {}
    },
    {
      "id": "02-access-sync-config-refactor",
      "appliedAt": "2025-12-05T00:00:00.000Z",
      "cliVersion": "0.1.1-beta.115",
      "manifestHash": "a147f1ef0124d7f2",
      "undo": [],
      "fileHashes": {}
    },
    {
      "id": "03-tailwind-v4-tokens",
      "appliedAt": "2026-02-04T00:00:00.000Z",
      "cliVersion": "0.1.1-beta.115",
      "manifestHash": "115de6d98aae9182",
      "undo": [],
      "fileHashes": {}
    },
    {
      "id": "04-multi-auth-provider",
      "appliedAt": "2026-04-20T00:00:00.000Z",
      "cliVersion": "0.1.1-beta.115",
      "manifestHash": "d506198404a1a56e",
      "undo": [],
      "fileHashes": {}
    },
    {
      "id": "05-edge-safe-auth-bypass",
      "appliedAt": "2026-04-23T00:00:00.000Z",
      "cliVersion": "0.1.1-beta.115",
      "manifestHash": "5465b3ba2384f17e",
      "undo": [],
      "fileHashes": {}
    },
    {
      "id": "06-error-handling-overhaul",
      "appliedAt": "2026-04-23T00:00:00.000Z",
      "cliVersion": "0.1.1-beta.115",
      "manifestHash": "1b251a4000bd7131",
      "undo": [],
      "fileHashes": {}
    }
  ]
}
```

- [ ] **Step 2: Delete the now-empty `.igrpmigrations/` folder**

```powershell
git rm templates/demo-legacy/.igrpmigrations/lock.json
```

If the directory is now empty git will stop tracking it. Verify:
```powershell
ls templates/demo-legacy/.igrpmigrations/ 2>$null
```

Expected: directory gone or empty.

- [ ] **Step 3: Commit**

```powershell
git add templates/demo-legacy/.igrp-migrations-lock.json
git commit -m "chore(demo-legacy): replace .igrpmigrations/ folder with .igrp-migrations-lock.json"
```

---

## Task 7: Final build verification

- [ ] **Step 1: Full CLI build**

```powershell
pnpm --filter @igrp/template-migrator build
```

Expected: completes with `Manifest written: 7 migrations`, no errors.

- [ ] **Step 2: Verify manifest has all 7 migrations**

```powershell
node -e "const m=require('./packages/template-migrator/dist/manifest.json'); m.migrations.forEach(mg => console.log(mg.id))"
```

Expected output:
```
01-preview-mode-not-found
02-access-sync-config-refactor
03-tailwind-v4-tokens
04-multi-auth-provider
05-edge-safe-auth-bypass
06-error-handling-overhaul
07-data-access-layer
```

- [ ] **Step 3: Smoke-test legacy detection**

Run from repo root:
```powershell
$repoRoot = (Get-Location).Path
$testDir = "$env:TEMP\test-consumer"
New-Item -ItemType Directory -Force -Path "$testDir\.igrpmigrations"
'{"version":1,"template":"demo-legacy","applied":[]}' | Out-File -Encoding utf8 "$testDir\.igrpmigrations\lock.json"
Push-Location $testDir
node "$repoRoot\packages\template-migrator\dist\cli.js" status
Pop-Location
```

Expected: error message containing `Legacy lock file found at .igrpmigrations/lock.json` and instruction to run `igrp-migrate convert`.

- [ ] **Step 4: Smoke-test convert command**

```powershell
$repoRoot = (Get-Location).Path
Push-Location "$env:TEMP\test-consumer"
node "$repoRoot\packages\template-migrator\dist\cli.js" convert
Pop-Location
```

Expected output: `Converted .igrpmigrations/lock.json → .igrp-migrations-lock.json`

Verify:
```powershell
ls "$env:TEMP\test-consumer"
```

Expected: `.igrp-migrations-lock.json` exists, `.igrpmigrations/` folder is gone.

- [ ] **Step 5: Smoke-test status on converted consumer**

```powershell
$repoRoot = (Get-Location).Path
Push-Location "$env:TEMP\test-consumer"
node "$repoRoot\packages\template-migrator\dist\cli.js" status
Pop-Location
```

Expected: shows all 7 migrations as pending (since the temp lock has empty `applied` array).

- [ ] **Step 6: Verify `templates/demo-legacy` itself**

```powershell
Push-Location templates/demo-legacy
node "..\..\packages\template-migrator\dist\cli.js" status
Pop-Location
```

Expected: shows migrations 01–06 as applied, migration 07 as pending.
