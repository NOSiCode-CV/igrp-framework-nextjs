# Framework Health Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the critical batch (Phases 1–4) of `specs/2026-06-10-framework-health-improvements.md`: TM-1 (honest rollback), TM-2 (migrator test suite), FN-1 (app-code case bug), NA-1 (introspection timeout), FN-2 (config Zod schema).

**Architecture:** Three packages are touched, independently: `packages/template-migrator` gets a vitest suite plus a two-phase rollback fix (refuse-on-placeholder, then real undo payloads stored in the lock); `packages/framework/next` gets app-code case normalization in `sync-plan.ts` and a Zod schema replacing the presence-only `validateConfig` in `lib/build.ts`; `packages/framework/next-auth` gets the existing `fetchWithTimeout` applied to the RFC 7662 introspection call. No template files change, so **no template-migrator migration is required** for any task in this plan.

**Tech Stack:** TypeScript 5.9, vitest 4.1.8, tsup (migrator/auth), SWC+Babel (framework-next), Zod 4.4.3, pnpm workspaces.

---

## Repo ground rules (read before starting)

- **pnpm only.** All commands below run from the repo root `D:\nosi-projects\igrp3\igrp-framework-frontend\igrp-framework-nextjs` unless stated otherwise. Use `pnpm --filter <pkg>` to target a package.
- **Never edit `dist/`.** All changes go in `src/`.
- **Changesets:** one `.md` file per package changed, **always `patch`** (the repo is in changeset pre-release mode; `minor`/`major` would break the `0.1.0-beta.*` pattern). The interactive `pnpm changeset` prompt doesn't work in this harness — write the changeset files directly (Tasks 7, 10, 13, 17 show the exact content).
- **Do NOT run** `pnpm version:changesets`, `changeset publish`, or any `release` script. Versioning/publishing requires explicit user authorization and is out of scope for this plan.
- Framework packages use **Prettier** (run `pnpm --filter <pkg> format` before committing if the package has a format script). Do not use Biome on framework packages.
- Dependency order: `next-auth → next-types → design-system → next-ui → next`. Task 18 runs `pnpm build:framework` to verify the whole chain.

---

## Task 1: Vitest infrastructure for template-migrator + `executeStep` testability refactor

The migrator has zero tests and no test runner. Also, `executeStep` resolves payload files from a module-level `PAYLOAD_DIR` (`dist/payload/` when bundled, `src/payload/` under vitest — which doesn't exist), so tests can't exercise `file.create`/`file.write` without a parameter to inject a temp payload dir.

**Files:**
- Modify: `packages/template-migrator/package.json`
- Create: `packages/template-migrator/vitest.config.ts`
- Modify: `packages/template-migrator/src/apply.ts`
- Test: `packages/template-migrator/src/__tests__/hash.test.ts`

- [ ] **Step 1: Add vitest devDependency and test script**

In `packages/template-migrator/package.json`, change the `scripts` and `devDependencies` blocks:

```json
  "scripts": {
    "prebuild": "tsx scripts/pack.ts",
    "build:js": "tsup",
    "build:types": "tsc -p tsconfig.build.json --emitDeclarationOnly",
    "build": "pnpm prebuild && pnpm build:js && pnpm build:types",
    "check:drift": "tsx scripts/check-drift.ts",
    "test": "vitest run",
    "release": "pnpm check:drift && pnpm build && pnpm publish --registry=https://sonatype.nosi.cv/repository/igrp/ --tag latest --no-git-checks",
    "clean": "rm -rf dist"
  },
```

```json
  "devDependencies": {
    "tsx": "4.22.4",
    "tsup": "^8.5.0",
    "typescript": "^5.9.3",
    "vitest": "4.1.8",
    "@types/node": "^25.9.1"
  },
```

- [ ] **Step 2: Install**

Run: `pnpm install --filter @igrp/template-migrator`
Expected: lockfile updated, `vitest` present in `packages/template-migrator/node_modules/.bin/`. (If registry auth fails, use `pnpm install:deps` from the root instead — it injects `.env` credentials via dotenv-cli.)

- [ ] **Step 3: Create vitest config**

Create `packages/template-migrator/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Write a smoke test for `hash.ts`**

Create `packages/template-migrator/src/__tests__/hash.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hashContent, hashFile } from "../hash";

describe("hashContent", () => {
  it("returns a 16-char hex digest", () => {
    expect(hashContent("hello")).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is deterministic for the same input", () => {
    expect(hashContent("same")).toBe(hashContent("same"));
  });

  it("differs for different input", () => {
    expect(hashContent("a")).not.toBe(hashContent("b"));
  });
});

describe("hashFile", () => {
  it("returns null for a missing file", () => {
    expect(hashFile("Z:/definitely/not/a/real/file.txt")).toBeNull();
  });
});
```

- [ ] **Step 5: Run the smoke test**

Run: `pnpm --filter @igrp/template-migrator test`
Expected: PASS, 4 tests.

- [ ] **Step 6: Refactor `executeStep` to accept an injectable payload dir**

In `packages/template-migrator/src/apply.ts`, change the function signature (line 15) and the one place `PAYLOAD_DIR` is used (line 23):

```ts
export function executeStep(
  step: MigrationStep,
  appRoot: string,
  payloadDir: string = PAYLOAD_DIR
): MigrationStep {
```

and inside the `file.create`/`file.write` case:

```ts
      const src = join(payloadDir, fromRel);
```

Existing callers (`src/commands/apply.ts:46`, `src/commands/rollback.ts:22`) pass two args and keep working via the default.

- [ ] **Step 7: Verify it still compiles and tests pass**

Run: `pnpm --filter @igrp/template-migrator test && pnpm --filter @igrp/template-migrator build`
Expected: tests PASS, build succeeds (pack → tsup → tsc).

- [ ] **Step 8: Commit**

```bash
git add packages/template-migrator/package.json packages/template-migrator/vitest.config.ts packages/template-migrator/src/apply.ts packages/template-migrator/src/__tests__/hash.test.ts pnpm-lock.yaml
git commit -m "test(template-migrator): add vitest infra, make executeStep payload dir injectable"
```

---

## Task 2: Test suite for `executeStep` (all step types)

**Files:**
- Test: `packages/template-migrator/src/__tests__/apply.test.ts`

- [ ] **Step 1: Write the tests**

Create `packages/template-migrator/src/__tests__/apply.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { executeStep } from "../apply";
import type { MigrationStep } from "../types";

let appRoot: string;
let payloadDir: string;

function writePayload(rel: string, content: string) {
  const p = join(payloadDir, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
}

function writeAppFile(rel: string, content: string) {
  const p = join(appRoot, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
}

function readAppFile(rel: string): string {
  return readFileSync(join(appRoot, rel), "utf8");
}

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-app-"));
  payloadDir = mkdtempSync(join(tmpdir(), "tm-payload-"));
});

afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
  rmSync(payloadDir, { recursive: true, force: true });
});

describe("executeStep: file.create / file.write", () => {
  it("copies the payload file to the app and returns file.delete undo when target did not exist", () => {
    writePayload("01/src/lib/new.ts", "export const x = 1;\n");
    const step: MigrationStep = { type: "file.create", path: "src/lib/new.ts", from: "01/src/lib/new.ts" };

    const undo = executeStep(step, appRoot, payloadDir);

    expect(readAppFile("src/lib/new.ts")).toBe("export const x = 1;\n");
    expect(undo).toEqual({ type: "file.delete", path: "src/lib/new.ts" });
  });

  it("overwrites an existing target and returns a placeholder file.write undo", () => {
    writeAppFile("src/lib/old.ts", "OLD CONTENT\n");
    writePayload("02/src/lib/old.ts", "NEW CONTENT\n");
    const step: MigrationStep = { type: "file.write", mode: "replace", path: "src/lib/old.ts", from: "02/src/lib/old.ts" };

    const undo = executeStep(step, appRoot, payloadDir);

    expect(readAppFile("src/lib/old.ts")).toBe("NEW CONTENT\n");
    expect(undo).toEqual({ type: "file.write", mode: "replace", path: "src/lib/old.ts", from: "__undo__" });
  });

  it("strips a leading payload/ prefix from the from field", () => {
    writePayload("03/a.txt", "via-prefix\n");
    const step: MigrationStep = { type: "file.create", path: "a.txt", from: "payload/03/a.txt" };

    executeStep(step, appRoot, payloadDir);

    expect(readAppFile("a.txt")).toBe("via-prefix\n");
  });
});

describe("executeStep: file.delete", () => {
  it("deletes an existing file and returns a placeholder file.create undo", () => {
    writeAppFile("src/dead.ts", "bye\n");
    const step: MigrationStep = { type: "file.delete", path: "src/dead.ts" };

    const undo = executeStep(step, appRoot, payloadDir);

    expect(existsSync(join(appRoot, "src/dead.ts"))).toBe(false);
    expect(undo).toEqual({ type: "file.create", path: "src/dead.ts", from: "__undo__" });
  });

  it("does not throw when the target is already absent", () => {
    const step: MigrationStep = { type: "file.delete", path: "src/never-existed.ts" };
    expect(() => executeStep(step, appRoot, payloadDir)).not.toThrow();
  });
});

describe("executeStep: env.add", () => {
  it("appends missing keys with doc comments", () => {
    writeAppFile(".env", "EXISTING=1\n");
    const step: MigrationStep = {
      type: "env.add",
      file: ".env",
      keys: {
        NEW_KEY: { doc: "A new key", default: "abc" },
        OTHER_KEY: { doc: "Another", required_if: "FEATURE=on" },
      },
    };

    executeStep(step, appRoot, payloadDir);

    const env = readAppFile(".env");
    expect(env).toContain("EXISTING=1");
    expect(env).toContain("# A new key");
    expect(env).toContain("NEW_KEY=abc");
    expect(env).toContain("# Required if: FEATURE=on");
    expect(env).toContain("OTHER_KEY=");
  });

  it("skips keys that already exist (idempotent)", () => {
    writeAppFile(".env", "NEW_KEY=keep-me\n");
    const step: MigrationStep = {
      type: "env.add",
      file: ".env",
      keys: { NEW_KEY: { doc: "should not duplicate", default: "clobber" } },
    };

    executeStep(step, appRoot, payloadDir);

    const env = readAppFile(".env");
    expect(env.match(/NEW_KEY=/g)).toHaveLength(1);
    expect(env).toContain("NEW_KEY=keep-me");
  });
});

describe("executeStep: deps.bump", () => {
  it("updates dependencies and devDependencies and returns previous ranges as undo", () => {
    writeAppFile(
      "package.json",
      JSON.stringify(
        {
          name: "consumer",
          dependencies: { "@igrp/framework-next": "0.1.0-beta.140" },
          devDependencies: { typescript: "^5.8.0" },
        },
        null,
        2
      ) + "\n"
    );
    const step: MigrationStep = {
      type: "deps.bump",
      manifest: "package.json",
      ranges: {
        "@igrp/framework-next": "0.1.0-beta.149",
        typescript: "^5.9.3",
        "not-installed-pkg": "1.0.0",
      },
    };

    const undo = executeStep(step, appRoot, payloadDir);

    const pkg = JSON.parse(readAppFile("package.json"));
    expect(pkg.dependencies["@igrp/framework-next"]).toBe("0.1.0-beta.149");
    expect(pkg.devDependencies.typescript).toBe("^5.9.3");
    expect(pkg.dependencies["not-installed-pkg"]).toBeUndefined();
    expect(undo).toEqual({
      type: "deps.bump",
      manifest: "package.json",
      ranges: { "@igrp/framework-next": "0.1.0-beta.140", typescript: "^5.8.0" },
    });
  });
});

describe("executeStep: unknown type", () => {
  it("throws on an unknown step type", () => {
    const bogus = { type: "file.rename", path: "a" } as unknown as MigrationStep;
    expect(() => executeStep(bogus, appRoot, payloadDir)).toThrow(/Unknown step type/);
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `pnpm --filter @igrp/template-migrator test`
Expected: PASS (all of Task 1's tests + these). These tests document **current** behavior; they must pass without source changes. If one fails, the source diverges from this plan's reading — stop and reconcile before continuing.

- [ ] **Step 3: Commit**

```bash
git add packages/template-migrator/src/__tests__/apply.test.ts
git commit -m "test(template-migrator): cover executeStep for all step types"
```

---

## Task 3: Test suite for `lock.ts` and `convert`

**Files:**
- Test: `packages/template-migrator/src/__tests__/lock.test.ts`
- Test: `packages/template-migrator/src/__tests__/convert.test.ts`

- [ ] **Step 1: Write the lock tests**

Create `packages/template-migrator/src/__tests__/lock.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { readLock, writeLock } from "../lock";
import { LegacyLockError, type LockFile } from "../types";

let appRoot: string;

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-lock-"));
});

afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
});

describe("readLock", () => {
  it("returns an empty lock when no lock file exists", () => {
    expect(readLock(appRoot)).toEqual({ version: 1, template: "demo-legacy", applied: [] });
  });

  it("round-trips through writeLock", () => {
    const lock: LockFile = {
      version: 1,
      template: "demo-legacy",
      applied: [
        {
          id: "01-test",
          appliedAt: "2026-01-01T00:00:00.000Z",
          cliVersion: "0.1.0-beta.125",
          manifestHash: "abc123",
          undo: [{ type: "file.delete", path: "src/x.ts" }],
          fileHashes: { "src/x.ts": "deadbeefdeadbeef" },
        },
      ],
    };
    writeLock(appRoot, lock);
    expect(readLock(appRoot)).toEqual(lock);
  });

  it("throws LegacyLockError when the legacy lock exists", () => {
    mkdirSync(join(appRoot, ".igrpmigrations"), { recursive: true });
    writeFileSync(join(appRoot, ".igrpmigrations", "lock.json"), "{}", "utf8");
    expect(() => readLock(appRoot)).toThrow(LegacyLockError);
  });
});
```

- [ ] **Step 2: Write the convert tests**

Create `packages/template-migrator/src/__tests__/convert.test.ts`. Note `convert` calls `process.exit(1)` on its error paths, so those are tested via a spy that throws:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { convert } from "../commands/convert";

let appRoot: string;
const LEGACY = ".igrpmigrations";
const NEW_LOCK = ".igrp-migrations-lock.json";

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-convert-"));
});

afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("convert", () => {
  it("moves the legacy lock to the new path and removes the empty legacy dir", () => {
    mkdirSync(join(appRoot, LEGACY), { recursive: true });
    const content = JSON.stringify({ version: 1, template: "demo-legacy", applied: [] });
    writeFileSync(join(appRoot, LEGACY, "lock.json"), content, "utf8");

    convert(appRoot);

    expect(readFileSync(join(appRoot, NEW_LOCK), "utf8")).toBe(content);
    expect(existsSync(join(appRoot, LEGACY, "lock.json"))).toBe(false);
    expect(existsSync(join(appRoot, LEGACY))).toBe(false);
  });

  it("heals an interrupted convert when both lock files exist", () => {
    mkdirSync(join(appRoot, LEGACY), { recursive: true });
    writeFileSync(join(appRoot, LEGACY, "lock.json"), "{\"stale\":true}", "utf8");
    const newContent = "{\"version\":1}";
    writeFileSync(join(appRoot, NEW_LOCK), newContent, "utf8");

    convert(appRoot);

    expect(existsSync(join(appRoot, LEGACY, "lock.json"))).toBe(false);
    expect(readFileSync(join(appRoot, NEW_LOCK), "utf8")).toBe(newContent);
  });

  it("exits 1 when there is no legacy lock to convert", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    expect(() => convert(appRoot)).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits 1 when already converted (new lock exists, legacy also exists is the heal path — here only new exists is checked via legacy-missing first)", () => {
    // legacy missing + new lock present → "no legacy lock" branch fires first
    writeFileSync(join(appRoot, NEW_LOCK), "{}", "utf8");
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    expect(() => convert(appRoot)).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `pnpm --filter @igrp/template-migrator test`
Expected: PASS. Same rule as Task 2: these document current behavior and must pass unchanged.

- [ ] **Step 4: Commit**

```bash
git add packages/template-migrator/src/__tests__/lock.test.ts packages/template-migrator/src/__tests__/convert.test.ts
git commit -m "test(template-migrator): cover lock round-trip, legacy detection, and convert"
```

---

## Task 4: TM-1 phase 1 — rollback refuses on unrestorable placeholders (`--force` escape)

Today `rollback` warns and **skips** `__undo__` placeholder steps, then removes the lock entry — a half-revert reported as success. New behavior: if any undo step is a placeholder with no stored payload, refuse (return `false`, CLI exits 1) unless `--force`.

**Files:**
- Modify: `packages/template-migrator/src/types.ts`
- Modify: `packages/template-migrator/src/commands/rollback.ts`
- Modify: `packages/template-migrator/src/cli.ts`
- Test: `packages/template-migrator/src/__tests__/rollback.test.ts`

- [ ] **Step 1: Add `undoPayloads` to `LockEntry`** (used by this task's "no stored payload" check and filled in by Task 5)

In `packages/template-migrator/src/types.ts`, extend `LockEntry`:

```ts
export interface LockEntry {
  id: string;
  appliedAt: string;
  cliVersion: string;
  manifestHash: string;
  undo: MigrationStep[];
  fileHashes: Record<string, string>;
  /**
   * Pre-migration file contents keyed by app-relative path, captured at apply
   * time for steps whose undo would otherwise be an unrestorable `__undo__`
   * placeholder (file.write over an existing file, file.delete). Absent on
   * lock entries written by older CLI versions.
   */
  undoPayloads?: Record<string, string>;
}
```

- [ ] **Step 2: Write the failing tests**

Create `packages/template-migrator/src/__tests__/rollback.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { writeLock, readLock } from "../lock";
import type { LockFile, LockEntry } from "../types";

vi.mock("../manifest", () => ({
  getManifest: () => ({
    version: 1,
    cliVersion: "test",
    template: "demo-legacy",
    migrations: [],
  }),
}));

import { rollback } from "../commands/rollback";

let appRoot: string;

function writeAppFile(rel: string, content: string) {
  const p = join(appRoot, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
}

function lockWith(entry: Partial<LockEntry>): LockFile {
  return {
    version: 1,
    template: "demo-legacy",
    applied: [
      {
        id: "07-test-migration",
        appliedAt: "2026-06-01T00:00:00.000Z",
        cliVersion: "test",
        manifestHash: "cafebabecafebabe",
        undo: [],
        fileHashes: {},
        ...entry,
      },
    ],
  };
}

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-rollback-"));
});

afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
});

describe("rollback refusal (TM-1 phase 1)", () => {
  it("refuses when an undo step is a placeholder with no stored payload", async () => {
    writeAppFile("src/touched.ts", "migrated content\n");
    writeLock(
      appRoot,
      lockWith({
        undo: [{ type: "file.write", mode: "replace", path: "src/touched.ts", from: "__undo__" }],
      })
    );

    const ok = await rollback(appRoot, "07-test-migration");

    expect(ok).toBe(false);
    // nothing was changed: file untouched, lock entry still present
    expect(readFileSync(join(appRoot, "src/touched.ts"), "utf8")).toBe("migrated content\n");
    expect(readLock(appRoot).applied).toHaveLength(1);
  });

  it("proceeds with --force, skipping the unrestorable step but executing the rest", async () => {
    writeAppFile("src/touched.ts", "migrated content\n");
    writeAppFile("src/created-by-migration.ts", "new file\n");
    writeLock(
      appRoot,
      lockWith({
        undo: [
          { type: "file.write", mode: "replace", path: "src/touched.ts", from: "__undo__" },
          { type: "file.delete", path: "src/created-by-migration.ts" },
        ],
      })
    );

    const ok = await rollback(appRoot, "07-test-migration", { force: true });

    expect(ok).toBe(true);
    // unrestorable step skipped → file keeps migrated content
    expect(readFileSync(join(appRoot, "src/touched.ts"), "utf8")).toBe("migrated content\n");
    // restorable step executed → created file deleted
    expect(existsSync(join(appRoot, "src/created-by-migration.ts"))).toBe(false);
    expect(readLock(appRoot).applied).toHaveLength(0);
  });

  it("rolls back normally when no undo step is a placeholder", async () => {
    writeAppFile("src/created-by-migration.ts", "new file\n");
    writeLock(
      appRoot,
      lockWith({ undo: [{ type: "file.delete", path: "src/created-by-migration.ts" }] })
    );

    const ok = await rollback(appRoot, "07-test-migration");

    expect(ok).toBe(true);
    expect(existsSync(join(appRoot, "src/created-by-migration.ts"))).toBe(false);
    expect(readLock(appRoot).applied).toHaveLength(0);
  });

  it("returns false for a migration that is not applied", async () => {
    writeLock(appRoot, { version: 1, template: "demo-legacy", applied: [] });
    const ok = await rollback(appRoot, "99-nope");
    expect(ok).toBe(false);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm --filter @igrp/template-migrator test -- rollback`
Expected: FAIL — current `rollback` returns `undefined` (so `ok === false` assertions on the happy path fail / refusal test fails because the entry gets spliced).

- [ ] **Step 4: Implement the new rollback**

Replace `packages/template-migrator/src/commands/rollback.ts` entirely with:

```ts
import { getManifest } from "../manifest.js";
import { readLock, writeLock } from "../lock.js";
import { executeStep } from "../apply.js";
import type { MigrationStep } from "../types.js";

function isPlaceholder(step: MigrationStep): boolean {
  const s = step as Record<string, unknown>;
  return s.from === "__undo__" || s.patch === "__undo__";
}

function stepPath(step: MigrationStep): string | undefined {
  const s = step as Record<string, unknown>;
  return typeof s.path === "string" ? s.path : undefined;
}

export async function rollback(
  appRoot: string,
  id: string,
  opts: { force?: boolean } = {}
): Promise<boolean> {
  // getManifest is called to validate CLI is set up correctly
  getManifest();
  const lock = readLock(appRoot);
  const idx = lock.applied.findIndex((a) => a.id === id);
  if (idx === -1) {
    console.log(`Migration ${id} is not applied.`);
    return false;
  }
  const entry = lock.applied[idx];

  // A placeholder undo step is only restorable if apply stored the prior
  // content in undoPayloads (newer CLI versions do — see commands/apply.ts).
  const unrestorable = entry.undo.filter((step) => {
    if (!isPlaceholder(step)) return false;
    const p = stepPath(step);
    return p === undefined || entry.undoPayloads?.[p] === undefined;
  });

  if (unrestorable.length > 0 && !opts.force) {
    console.error(`\nCannot fully roll back ${id} — no stored undo content for:`);
    for (const step of unrestorable) {
      console.error(`  - ${step.type}  ${stepPath(step) ?? "(unknown path)"}`);
    }
    console.error(
      "\nThese files were overwritten or deleted by the migration and their prior" +
        "\ncontent was not captured (lock entry written by an older CLI version)." +
        "\nRestore them manually (e.g. from git), or re-run with --force to roll back" +
        "\nthe remaining steps anyway — the files listed above will NOT be restored.\n"
    );
    return false;
  }

  console.log(`\nRolling back ${id} (${entry.undo.length} undo step(s))\n`);
  for (const step of entry.undo) {
    const pathKey =
      stepPath(step) ??
      (step as Record<string, unknown>).file ??
      (step as Record<string, unknown>).manifest;
    console.log(`  undo ${step.type}  ${pathKey}`);
    if (isPlaceholder(step)) {
      // Restored from stored payloads in Task 6 (phase 2). Until then —
      // and for steps with no stored payload under --force — skip.
      console.log("    (undo payload not stored — manual restoration required)");
      continue;
    }
    executeStep(step, appRoot);
  }
  lock.applied.splice(idx, 1);
  writeLock(appRoot, lock);
  console.log(`\n✓ ${id} rolled back\n`);
  return true;
}
```

- [ ] **Step 5: Wire `--force` and the exit code in the CLI**

In `packages/template-migrator/src/cli.ts`, replace the `rollback` case (lines 37–42):

```ts
      case "rollback": {
        const id = args[1];
        if (!id) { console.error("Usage: igrp-migrate rollback <id> [--force]"); process.exit(1); }
        const ok = await rollback(appRoot, id, { force: args.includes("--force") });
        if (!ok) process.exit(1);
        break;
      }
```

and update the help text line:

```ts
  igrp-migrate rollback <id> [--force]  Revert a single applied migration
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm --filter @igrp/template-migrator test`
Expected: PASS (all suites).

- [ ] **Step 7: Commit**

```bash
git add packages/template-migrator/src/types.ts packages/template-migrator/src/commands/rollback.ts packages/template-migrator/src/cli.ts packages/template-migrator/src/__tests__/rollback.test.ts
git commit -m "fix(template-migrator): rollback refuses on unrestorable placeholder undo steps (--force to override)"
```

---

## Task 5: TM-1 phase 2a — `apply` captures prior file content into `undoPayloads`

**Files:**
- Modify: `packages/template-migrator/src/commands/apply.ts`
- Test: `packages/template-migrator/src/__tests__/apply-command.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/template-migrator/src/__tests__/apply-command.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { readLock } from "../lock";
import type { Manifest } from "../types";

const manifestRef: { current: Manifest } = {
  current: { version: 1, cliVersion: "test", template: "demo-legacy", migrations: [] },
};

vi.mock("../manifest", () => ({
  getManifest: () => manifestRef.current,
}));

import { apply } from "../commands/apply";

let appRoot: string;
let payloadDir: string;

function writeFileAt(base: string, rel: string, content: string) {
  const p = join(base, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
}

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-applycmd-"));
  payloadDir = mkdtempSync(join(tmpdir(), "tm-applycmd-payload-"));
});

afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
  rmSync(payloadDir, { recursive: true, force: true });
});

describe("apply captures undo payloads (TM-1 phase 2a)", () => {
  it("stores prior content for overwritten and deleted files in the lock entry", async () => {
    writeFileAt(appRoot, "src/overwritten.ts", "ORIGINAL A\n");
    writeFileAt(appRoot, "src/deleted.ts", "ORIGINAL B\n");
    writeFileAt(payloadDir, "10/src/overwritten.ts", "MIGRATED A\n");
    writeFileAt(payloadDir, "10/src/brand-new.ts", "NEW FILE\n");

    manifestRef.current = {
      version: 1,
      cliVersion: "test",
      template: "demo-legacy",
      migrations: [
        {
          id: "10-capture-test",
          date: "2026-06-10",
          requires: [],
          targetFrameworkVersion: null,
          guideHref: "10.MIGRATIONS-10062026.md",
          contentHash: "feedfacefeedface",
          steps: [
            { type: "file.write", mode: "replace", path: "src/overwritten.ts", from: "10/src/overwritten.ts" },
            { type: "file.delete", path: "src/deleted.ts" },
            { type: "file.create", path: "src/brand-new.ts", from: "10/src/brand-new.ts" },
          ],
        },
      ],
    };

    await apply(appRoot, { yes: true, payloadDir });

    // migration applied
    expect(readFileSync(join(appRoot, "src/overwritten.ts"), "utf8")).toBe("MIGRATED A\n");
    expect(readFileSync(join(appRoot, "src/brand-new.ts"), "utf8")).toBe("NEW FILE\n");

    const lock = readLock(appRoot);
    expect(lock.applied).toHaveLength(1);
    const entry = lock.applied[0];
    // prior content captured for the two files that existed before
    expect(entry.undoPayloads).toEqual({
      "src/overwritten.ts": "ORIGINAL A\n",
      "src/deleted.ts": "ORIGINAL B\n",
    });
    // brand-new file needs no payload — its undo is a clean file.delete
    expect(entry.undoPayloads!["src/brand-new.ts"]).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @igrp/template-migrator test -- apply-command`
Expected: FAIL — `apply` doesn't accept `payloadDir` yet and `undoPayloads` is `undefined`.

- [ ] **Step 3: Implement capture in the apply command**

In `packages/template-migrator/src/commands/apply.ts`:

1. Extend the imports (line 1–7 region):

```ts
import { createInterface } from "readline";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getManifest } from "../manifest.js";
import { readLock, writeLock } from "../lock.js";
import { executeStep } from "../apply.js";
import { hashFile } from "../hash.js";
import type { LockEntry, MigrationStep } from "../types.js";
```

2. Change the signature (line 16):

```ts
export async function apply(
  appRoot: string,
  opts: { toId?: string; yes?: boolean; payloadDir?: string }
) {
```

3. Replace the per-migration step loop (lines 37–54) with:

```ts
    const fileHashes: Record<string, string> = {};
    const undoPayloads: Record<string, string> = {};
    const undoSteps: MigrationStep[] = [];
    try {
      for (const step of migration.steps) {
        const pathKey = (step as Record<string, unknown>).path ?? (step as Record<string, unknown>).file ?? (step as Record<string, unknown>).manifest;
        if (pathKey && typeof pathKey === "string") {
          const hash = hashFile(join(appRoot, pathKey));
          if (hash) fileHashes[pathKey] = hash;
        }
        // Capture prior content for steps whose undo would otherwise be an
        // unrestorable __undo__ placeholder: an overwrite of an existing file,
        // or a delete. (A file.create over nothing undoes cleanly via delete.)
        if (
          (step.type === "file.write" || step.type === "file.delete" || step.type === "file.create") &&
          typeof (step as { path?: unknown }).path === "string"
        ) {
          const target = join(appRoot, (step as { path: string }).path);
          if (existsSync(target)) {
            undoPayloads[(step as { path: string }).path] = readFileSync(target, "utf8");
          }
        }
        const undo = executeStep(step, appRoot, opts.payloadDir);
        undoSteps.push(undo);
        console.log(`  ✓ ${step.type}  ${pathKey}`);
      }
    } catch (err) {
      console.error(`  ✗ Error: ${(err as Error).message}`);
      console.error("  Migration aborted. Run again to resume.");
      return;
    }
```

Note: `executeStep(step, appRoot, opts.payloadDir)` — when `opts.payloadDir` is `undefined` the default `PAYLOAD_DIR` applies, so the real CLI path is unchanged. **TypeScript caveat:** the default-parameter signature from Task 1 is `payloadDir: string = PAYLOAD_DIR`; passing an explicit `undefined` still triggers the default (ES2015 semantics), but the declared type must allow it — change the Task 1 signature to `payloadDir: string | undefined = PAYLOAD_DIR` if `tsc` complains.

4. Extend the `LockEntry` construction (lines 56–63):

```ts
    const entry: LockEntry = {
      id: migration.id,
      appliedAt: new Date().toISOString(),
      cliVersion: manifest.cliVersion,
      manifestHash: migration.contentHash,
      undo: undoSteps,
      fileHashes,
      ...(Object.keys(undoPayloads).length > 0 ? { undoPayloads } : {}),
    };
```

Note: a `file.create` over an existing file also gets its prior content captured — `executeStep` returns the `__undo__` write step in that case, so the payload is needed.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @igrp/template-migrator test`
Expected: PASS (all suites).

- [ ] **Step 5: Commit**

```bash
git add packages/template-migrator/src/commands/apply.ts packages/template-migrator/src/__tests__/apply-command.test.ts
git commit -m "feat(template-migrator): capture prior file content as undo payloads at apply time"
```

---

## Task 6: TM-1 phase 2b — rollback restores from stored `undoPayloads`

**Files:**
- Modify: `packages/template-migrator/src/commands/rollback.ts`
- Test: `packages/template-migrator/src/__tests__/rollback.test.ts` (extend)

- [ ] **Step 1: Write the failing round-trip test**

Append to `packages/template-migrator/src/__tests__/rollback.test.ts` (inside the file, after the existing describe — it reuses the same imports/helpers):

```ts
describe("rollback restores stored undo payloads (TM-1 phase 2b)", () => {
  it("restores overwritten and deleted files from undoPayloads", async () => {
    writeAppFile("src/touched.ts", "migrated content\n");
    // deleted file is absent post-migration
    writeLock(
      appRoot,
      lockWith({
        undo: [
          { type: "file.write", mode: "replace", path: "src/touched.ts", from: "__undo__" },
          { type: "file.create", path: "src/deleted.ts", from: "__undo__" },
        ],
        undoPayloads: {
          "src/touched.ts": "ORIGINAL A\n",
          "src/deleted.ts": "ORIGINAL B\n",
        },
      })
    );

    const ok = await rollback(appRoot, "07-test-migration");

    expect(ok).toBe(true);
    expect(readFileSync(join(appRoot, "src/touched.ts"), "utf8")).toBe("ORIGINAL A\n");
    expect(readFileSync(join(appRoot, "src/deleted.ts"), "utf8")).toBe("ORIGINAL B\n");
    expect(readLock(appRoot).applied).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @igrp/template-migrator test -- rollback`
Expected: FAIL — placeholder steps are skipped, files not restored (and `src/deleted.ts` never recreated).

- [ ] **Step 3: Implement restoration**

In `packages/template-migrator/src/commands/rollback.ts`:

1. Add fs imports at the top:

```ts
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
```

2. Replace the placeholder branch inside the undo loop:

```ts
    if (isPlaceholder(step)) {
      const p = stepPath(step);
      const content = p !== undefined ? entry.undoPayloads?.[p] : undefined;
      if (p !== undefined && content !== undefined) {
        const dest = join(appRoot, p);
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, content, "utf8");
        console.log("    restored from stored undo payload");
      } else {
        // Only reachable under --force (the refusal gate catches this otherwise)
        console.log("    (undo payload not stored — manual restoration required)");
      }
      continue;
    }
```

- [ ] **Step 4: Run all migrator tests**

Run: `pnpm --filter @igrp/template-migrator test`
Expected: PASS — including the Task 4 refusal tests (entries **without** `undoPayloads` still refuse) and the Task 5 capture test.

- [ ] **Step 5: Build the package to confirm `tsc` is clean**

Run: `pnpm --filter @igrp/template-migrator build`
Expected: pack + tsup + tsc succeed.

- [ ] **Step 6: Commit**

```bash
git add packages/template-migrator/src/commands/rollback.ts packages/template-migrator/src/__tests__/rollback.test.ts
git commit -m "feat(template-migrator): rollback restores files from stored undo payloads"
```

---

## Task 7: Changeset for template-migrator

**Files:**
- Create: `.changeset/template-migrator-honest-rollback.md`

- [ ] **Step 1: Write the changeset**

Create `.changeset/template-migrator-honest-rollback.md`:

```md
---
"@igrp/template-migrator": patch
---

Honest rollback: `apply` now captures the prior content of overwritten/deleted files into the lock entry (`undoPayloads`), and `rollback` restores them. For lock entries written by older CLI versions (no stored payloads), `rollback` now refuses with a clear file list instead of silently half-reverting; `--force` keeps the old skip behavior explicitly. Adds the package's first test suite (executeStep, lock, convert, apply, rollback).
```

- [ ] **Step 2: Commit**

```bash
git add .changeset/template-migrator-honest-rollback.md
git commit -m "chore: add changeset for template-migrator honest rollback"
```

---

## Task 8: FN-1 — app-code case normalization in `sync-plan.ts`

`APP_CODE_PATTERN` is uppercase-only (`/^[A-Z0-9][A-Z0-9_]{0,62}[A-Z0-9]$/`) while the doc comment at `packages/framework/next/src/lib/sync-plan.ts:46` promises case-insensitive matching at the framework boundary. Fix: normalize `appCode` to uppercase before validation (spec option (a)), so lowercase configs are accepted and the AM server receives the canonical uppercase form.

**Files:**
- Modify: `packages/framework/next/src/lib/sync-plan.ts`
- Test: `packages/framework/next/src/lib/__tests__/sync-plan.test.ts` (extend)

- [ ] **Step 1: Write the failing tests**

Append inside the existing `describe('planAccessManagementSync', …)` block in `packages/framework/next/src/lib/__tests__/sync-plan.test.ts` (the file already mocks `server-only` and `../sync-client`, and provides `makeArgs`):

```ts
  it('accepts a lowercase app code and normalizes it to uppercase (FN-1)', () => {
    const plan = planAccessManagementSync(makeArgs({ appCode: 'app_test_1' }));

    expect(plan).not.toBeNull();
    expect(plan!.appCode).toBe('APP_TEST_1');
  });

  it('accepts a mixed-case app code and normalizes it to uppercase (FN-1)', () => {
    const plan = planAccessManagementSync(makeArgs({ appCode: 'App_Test_1' }));

    expect(plan).not.toBeNull();
    expect(plan!.appCode).toBe('APP_TEST_1');
  });

  it('still rejects app codes with invalid characters after normalization (FN-1)', () => {
    expect(() => planAccessManagementSync(makeArgs({ appCode: 'app code!' }))).toThrow(
      IgrpConfigError,
    );
  });

  it('still rejects app codes with dashes (underscores only) (FN-1)', () => {
    expect(() => planAccessManagementSync(makeArgs({ appCode: 'app-test' }))).toThrow(
      IgrpConfigError,
    );
  });
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `pnpm --filter @igrp/framework-next test -- sync-plan`
Expected: the two "normalizes to uppercase" tests FAIL (lowercase currently throws `IgrpConfigError`); the two rejection tests PASS.

- [ ] **Step 3: Implement normalization**

In `packages/framework/next/src/lib/sync-plan.ts`:

1. Update the doc comment above the patterns (lines 40–49) to state the actual contract:

```ts
/**
 * Conservative identifier pattern for the AM service-id and app-code values.
 * These end up as resource `name` fields on the Access Management server,
 * and as the `X-Machine-Service-ID` header. Allow lowercase alphanumeric +
 * dashes/underscores, must start and end alphanumeric, max length 64.
 *
 * Service-id matching is case-insensitive. App codes are accepted in any
 * case and NORMALIZED TO UPPERCASE here before validation and before any
 * network call — uppercase is the canonical form on the AM server. We reject
 * obvious garbage (whitespace, special characters, oversize) early.
 */
```

2. Change line 105 from `const appCode = args.appCode.trim();` to:

```ts
  const appCode = args.appCode.trim().toUpperCase();
```

3. Improve the rejection message (lines 129–135) so it explains the normalization:

```ts
  if (!APP_CODE_PATTERN.test(appCode)) {
    throw new IgrpConfigError(
      'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING',
      `IGRP_APP_CODE must contain only letters, digits and underscores, start and ` +
        `end alphanumeric, max 64 chars (got: "${args.appCode}", normalized to "${appCode}").`,
      { field: 'appCode', value: args.appCode },
    );
  }
```

(`APP_CODE_PATTERN` itself stays uppercase-only — input is uppercased before the test.)

- [ ] **Step 4: Run the full package test suite**

Run: `pnpm --filter @igrp/framework-next test`
Expected: PASS — including pre-existing sync-plan tests (they all use uppercase `APP_TEST_1`, unaffected by normalization).

- [ ] **Step 5: Format and commit**

```bash
pnpm --filter @igrp/framework-next format
git add packages/framework/next/src/lib/sync-plan.ts packages/framework/next/src/lib/__tests__/sync-plan.test.ts
git commit -m "fix(framework-next): accept any-case app codes, normalize to uppercase before AM sync"
```

---

## Task 9: NA-1 — timeout on the OIDC introspection fetch

`introspectOidcToken` (`packages/framework/next-auth/src/oidc.ts:471`) uses bare `fetch` while revocation and discovery use `fetchWithTimeout(…, IDP_FETCH_TIMEOUT_MS)` (4s). A hanging introspection endpoint stalls every token refresh. Fail-open semantics are preserved: an abort rejects, the surrounding `try/catch` returns `true`.

**Files:**
- Modify: `packages/framework/next-auth/src/oidc.ts`
- Test: `packages/framework/next-auth/src/__tests__/oidc.test.ts` (extend)

- [ ] **Step 1: Write the failing tests**

Append to the existing `describe('introspectOidcToken', …)` block in `packages/framework/next-auth/src/__tests__/oidc.test.ts`. Reuse the file's existing fixtures: `MOCK_DISCOVERY` (has `introspection_endpoint: 'http://localhost:9090/oauth2/introspect'`), `makeToken()`, `VALID_ENV`, and the dynamic `await import('../oidc')` pattern (module is re-imported per test so the discovery cache is fresh). If the existing tests use a shared fetch-stub helper, you may use it for the discovery response; the code below is self-contained either way:

```ts
  it('passes an abort signal (timeout) to the introspection request (NA-1)', async () => {
    const fetchSpy = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('.well-known')) {
        return { ok: true, json: async () => MOCK_DISCOVERY } as Response;
      }
      return { ok: true, json: async () => ({ active: true }) } as Response;
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { introspectOidcToken } = await import('../oidc');
    await introspectOidcToken(makeToken(), VALID_ENV);

    expect(fetchSpy).toHaveBeenCalledWith(
      MOCK_DISCOVERY.introspection_endpoint,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('fails open when the introspection request exceeds the timeout (NA-1)', async () => {
    vi.useFakeTimers();
    try {
      const fetchSpy = vi.fn((url: string | URL, init?: RequestInit) => {
        const u = String(url);
        if (u.includes('.well-known')) {
          return Promise.resolve({ ok: true, json: async () => MOCK_DISCOVERY } as Response);
        }
        // Hang forever; only reject when the timeout aborts us — mirrors a
        // stalled IdP. Without a signal this promise never settles and the
        // test times out, which is exactly the bug being fixed.
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('The operation was aborted.', 'AbortError')),
          );
        });
      });
      vi.stubGlobal('fetch', fetchSpy);

      const { introspectOidcToken } = await import('../oidc');
      const resultPromise = introspectOidcToken(makeToken(), VALID_ENV);
      await vi.advanceTimersByTimeAsync(5000); // > IDP_FETCH_TIMEOUT_MS (4000)
      await expect(resultPromise).resolves.toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @igrp/framework-next-auth test -- oidc`
Expected: FAIL — the signal assertion fails (no `signal` in the init object), and the timeout test hangs/times out (vitest test timeout) because nothing ever aborts the fetch.

- [ ] **Step 3: Implement the timeout**

In `packages/framework/next-auth/src/oidc.ts`, replace the introspection fetch (lines 471–481):

```ts
    const response = await fetchWithTimeout(
      openIdConfiguration.introspection_endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          token: token.refreshToken,
          token_type_hint: 'refresh_token',
        }),
      },
      IDP_FETCH_TIMEOUT_MS,
    );
```

(`fetchWithTimeout` and `IDP_FETCH_TIMEOUT_MS` are already defined in this file at lines 45 and 28 — no new imports.)

- [ ] **Step 4: Run the full package test suite**

Run: `pnpm --filter @igrp/framework-next-auth test`
Expected: PASS — all ~112 existing cases plus the 2 new ones. The pre-existing introspection tests stub `fetch` with resolving responses, so adding the signal is invisible to them.

- [ ] **Step 5: Commit**

```bash
git add packages/framework/next-auth/src/oidc.ts packages/framework/next-auth/src/__tests__/oidc.test.ts
git commit -m "fix(next-auth): apply 4s timeout to OIDC introspection fetch (fail-open preserved)"
```

---

## Task 10: Changesets for FN-1 and NA-1

**Files:**
- Create: `.changeset/framework-next-appcode-case.md`
- Create: `.changeset/next-auth-introspection-timeout.md`

- [ ] **Step 1: Write both changesets**

Create `.changeset/framework-next-appcode-case.md`:

```md
---
"@igrp/framework-next": patch
---

Access Management sync now accepts `IGRP_APP_CODE` in any case and normalizes it to uppercase (the AM canonical form) before validation, matching the documented case-insensitive contract. Previously, lowercase app codes were rejected with `IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING`.
```

Create `.changeset/next-auth-introspection-timeout.md`:

```md
---
"@igrp/framework-next-auth": patch
---

The RFC 7662 token-introspection request now uses the same 4s timeout as discovery and revocation. A slow or hanging introspection endpoint no longer stalls token refreshes; on timeout the check fails open (token assumed live), as before.
```

- [ ] **Step 2: Commit**

```bash
git add .changeset/framework-next-appcode-case.md .changeset/next-auth-introspection-timeout.md
git commit -m "chore: add changesets for app-code normalization and introspection timeout"
```

---

## Task 11: FN-2 — add the `IGRP_CONFIG_INVALID` error code

FN-2 lands in three tasks: new error code (this task), Zod dependency (Task 12), schema + tests (Task 13).

**Files:**
- Modify: `packages/framework/next/src/errors.ts:31-37`

- [ ] **Step 1: Extend the code union**

In `packages/framework/next/src/errors.ts`, add one member to `IgrpErrorCode`:

```ts
export type IgrpErrorCode =
  | 'IGRP_CONFIG_NOT_INITIALIZED'
  | 'IGRP_CONFIG_INVALID'
  | 'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING'
  | 'IGRP_APP_CODE_MISSING'
  | 'IGRP_APP_HOME_SLUG_INVALID'
  | 'IGRP_AUTH_CONFIG_INVALID'
  | 'IGRP_LAYOUT_DATA_FAILED';
```

This is additive — existing consumers that switch on `error.code` are unaffected.

- [ ] **Step 2: Verify it compiles**

Run: `pnpm --filter @igrp/framework-next test`
Expected: PASS (types-only change; vitest type-checks via esbuild transform, and `build:types` will confirm in Task 18).

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/src/errors.ts
git commit -m "feat(framework-next): add IGRP_CONFIG_INVALID error code"
```

---

## Task 12: FN-2 — add Zod to framework-next

**Files:**
- Modify: `packages/framework/next/package.json`

- [ ] **Step 1: Add the dependency**

In `packages/framework/next/package.json`, add to `dependencies` (alongside the existing `@igrp/*` workspace deps):

```json
    "zod": "4.4.3"
```

Pinned exact, matching the version already used by `next-ui` and the template.

- [ ] **Step 2: Install**

Run: `pnpm install --filter @igrp/framework-next`
Expected: lockfile updated; `zod` resolvable from the package. (Fallback: `pnpm install:deps` from root if registry auth is needed.)

- [ ] **Step 3: Commit**

```bash
git add packages/framework/next/package.json pnpm-lock.yaml
git commit -m "chore(framework-next): add zod dependency for config validation"
```

---

## Task 13: FN-2 — Zod schema in `igrpBuildConfig` (closes the `lib/build.ts` TODO)

Replace the presence-only `validateConfig` with a Zod schema that (a) preserves the two existing checks byte-for-byte in behavior, and (b) adds the documented-but-unenforced invariants. **Critical constraint:** preview mode must keep booting with minimal config (no `apiManagementConfig`, possibly no `appCode`), and sync-off non-preview configs without m2m credentials must keep working — the schema only *adds* failures for configs that would already fail later (at `planAccessManagementSync`) or are structurally broken (missing `layoutMockData` functions, missing booleans).

**Files:**
- Modify: `packages/framework/next/src/lib/build.ts`
- Test: `packages/framework/next/src/lib/__tests__/build.test.ts` (new)

- [ ] **Step 1: Write the failing tests**

Create `packages/framework/next/src/lib/__tests__/build.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

import { igrpBuildConfig } from '../build';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

// Loose builder — runtime configs are looser than the declared type
// (env vars can be undefined), which is exactly what the schema guards.
const baseConfig = (overrides: Record<string, unknown> = {}): IGRPConfigArgs =>
  ({
    appCode: 'APP_TEST',
    previewMode: true,
    syncAccess: false,
    appInformation: { name: 'test', version: '0.0.0' },
    layoutMockData: {
      getHeaderData: async () => ({}),
      getSidebarData: async () => ({}),
    },
    layout: { session: null },
    toasterConfig: { showToaster: false },
    ...overrides,
  }) as unknown as IGRPConfigArgs;

describe('igrpBuildConfig validation (FN-2)', () => {
  it('throws IGRP_CONFIG_NOT_INITIALIZED for null/undefined config', async () => {
    await expect(igrpBuildConfig(null as unknown as IGRPConfigArgs)).rejects.toMatchObject({
      code: 'IGRP_CONFIG_NOT_INITIALIZED',
    });
  });

  it('accepts a minimal preview-mode config and returns it unchanged', async () => {
    const cfg = baseConfig();
    await expect(igrpBuildConfig(cfg)).resolves.toBe(cfg);
  });

  it('accepts a non-preview, sync-off config with only a baseUrl (no m2m credentials)', async () => {
    const cfg = baseConfig({
      previewMode: false,
      syncAccess: false,
      apiManagementConfig: { baseUrl: 'https://am.example.com' },
    });
    await expect(igrpBuildConfig(cfg)).resolves.toBe(cfg);
  });

  it('throws IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING when preview is off and baseUrl is absent', async () => {
    const cfg = baseConfig({ previewMode: false });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({
      code: 'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING',
    });
  });

  it('throws IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING when sync is on but m2m credentials are missing', async () => {
    const cfg = baseConfig({
      previewMode: false,
      syncAccess: true,
      apiManagementConfig: { baseUrl: 'https://am.example.com', serviceId: 'svc' },
      // m2mClientId / m2mClientSecret intentionally absent
    });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({
      code: 'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING',
      context: expect.objectContaining({ field: expect.stringContaining('m2mClientId') }),
    });
  });

  it('throws IGRP_APP_CODE_MISSING when sync is on but appCode is blank', async () => {
    const cfg = baseConfig({
      appCode: '   ',
      previewMode: false,
      syncAccess: true,
      apiManagementConfig: {
        baseUrl: 'https://am.example.com',
        serviceId: 'svc',
        m2mClientId: 'cid',
        m2mClientSecret: 'cs',
      },
    });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({ code: 'IGRP_APP_CODE_MISSING' });
  });

  it('throws IGRP_CONFIG_INVALID when layoutMockData getters are not functions', async () => {
    const cfg = baseConfig({ layoutMockData: { getHeaderData: 'nope', getSidebarData: async () => ({}) } });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({ code: 'IGRP_CONFIG_INVALID' });
  });

  it('throws IGRP_CONFIG_INVALID when previewMode is not a boolean', async () => {
    const cfg = baseConfig({ previewMode: undefined });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({ code: 'IGRP_CONFIG_INVALID' });
  });

  it('sync-on preview mode does NOT require m2m credentials (preview wins)', async () => {
    const cfg = baseConfig({ previewMode: true, syncAccess: true });
    await expect(igrpBuildConfig(cfg)).resolves.toBe(cfg);
  });
});
```

- [ ] **Step 2: Run the tests to verify the new invariants fail**

Run: `pnpm --filter @igrp/framework-next test -- build`
Expected: tests 1, 2, 3, 4 PASS (existing behavior); tests 5, 6, 7, 8 FAIL (invariants not enforced yet). Test 9 PASSES already.

- [ ] **Step 3: Implement the schema**

Replace `packages/framework/next/src/lib/build.ts` entirely with:

```ts
import type { IGRPConfigArgs } from '@igrp/framework-next-types';
import { z } from 'zod';

import { IgrpConfigError, type IgrpErrorCode } from '../errors';

const isFunction = (v: unknown): boolean => typeof v === 'function';
const isBlank = (v: unknown): boolean => typeof v !== 'string' || v.trim() === '';

/**
 * Runtime schema for {@link IGRPConfigArgs}. Deliberately LOOSER than the
 * declared type at the field level (env-sourced values can be undefined at
 * runtime) — the conditional invariants live in `superRefine`, mirroring the
 * gates in `planAccessManagementSync` so a config that boots also syncs:
 *
 *   • `previewMode` / `syncAccess` must be real booleans.
 *   • `layoutMockData.getHeaderData/getSidebarData` must be functions.
 *   • `!previewMode` ⇒ `apiManagementConfig.baseUrl` is required.
 *   • `syncAccess && !previewMode` ⇒ `serviceId`, `m2mClientId`,
 *     `m2mClientSecret` and `appCode` must be non-blank.
 *
 * Unknown keys pass through untouched — the schema validates, it never
 * replaces the config object.
 */
const igrpConfigSchema = z
  .object({
    appCode: z.string().optional(),
    previewMode: z.boolean(),
    syncAccess: z.boolean(),
    layoutMockData: z.object({
      getHeaderData: z.custom<() => Promise<unknown>>(isFunction, {
        message: 'layoutMockData.getHeaderData deve ser uma função assíncrona.',
      }),
      getSidebarData: z.custom<() => Promise<unknown>>(isFunction, {
        message: 'layoutMockData.getSidebarData deve ser uma função assíncrona.',
      }),
    }),
    toasterConfig: z
      .object({ showToaster: z.boolean() })
      .catchall(z.unknown()),
    apiManagementConfig: z
      .object({
        baseUrl: z.string().optional(),
        serviceId: z.string().optional(),
        m2mClientId: z.string().optional(),
        m2mClientSecret: z.string().optional(),
      })
      .catchall(z.unknown())
      .optional(),
  })
  .catchall(z.unknown())
  .superRefine((cfg, ctx) => {
    if (!cfg.previewMode && isBlank(cfg.apiManagementConfig?.baseUrl)) {
      ctx.addIssue({
        code: 'custom',
        path: ['apiManagementConfig', 'baseUrl'],
        message:
          'Modo de pré-visualização desativado. É necessária a configuração da gestão de acesso (baseUrl).',
      });
    }
    if (cfg.syncAccess && !cfg.previewMode) {
      for (const field of ['serviceId', 'm2mClientId', 'm2mClientSecret'] as const) {
        if (isBlank(cfg.apiManagementConfig?.[field])) {
          ctx.addIssue({
            code: 'custom',
            path: ['apiManagementConfig', field],
            message: `IGRP_SYNC_ACCESS=true requer apiManagementConfig.${field} não-vazio.`,
          });
        }
      }
      if (isBlank(cfg.appCode)) {
        ctx.addIssue({
          code: 'custom',
          path: ['appCode'],
          message: 'IGRP_SYNC_ACCESS=true requer um appCode não-vazio (IGRP_APP_CODE).',
        });
      }
    }
  });

/** Maps a Zod issue path to the stable IgrpError code consumers switch on. */
function codeForIssuePath(path: ReadonlyArray<PropertyKey>): IgrpErrorCode {
  if (path[0] === 'appCode') return 'IGRP_APP_CODE_MISSING';
  if (path[0] === 'apiManagementConfig') return 'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING';
  return 'IGRP_CONFIG_INVALID';
}

/**
 * Validates an assembled IGRP config. Invoked from {@link igrpBuildConfig}.
 *
 * Runs at the template's **root segment** (the template calls `createConfig`
 * from its root `app/layout.tsx` / `src/igrp.template.config.ts`), so any
 * `IgrpConfigError` thrown here bubbles to `app/global-error.tsx` — the only
 * boundary that can render when the root layout itself fails. See the
 * framework CLAUDE.md for the full error-handling contract.
 *
 * Throws `IgrpConfigError` with a stable `code`:
 *   • `IGRP_CONFIG_NOT_INITIALIZED` — `config` is null / undefined.
 *   • `IGRP_CONFIG_INVALID` — structural problem (wrong types, missing
 *     mock-data functions, non-boolean flags).
 *   • `IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING` — preview mode is off / sync is
 *     on and the access-management configuration is incomplete.
 *   • `IGRP_APP_CODE_MISSING` — sync is on but `appCode` is blank.
 */
function validateConfig(
  config: IGRPConfigArgs | null | undefined,
): asserts config is IGRPConfigArgs {
  if (!config) {
    throw new IgrpConfigError(
      'IGRP_CONFIG_NOT_INITIALIZED',
      '[igrp-template-config]: A configuração do IGRP não foi inicializada.',
    );
  }

  const result = igrpConfigSchema.safeParse(config);
  if (!result.success) {
    const first = result.error.issues[0]!;
    const field = first.path.join('.');
    throw new IgrpConfigError(
      codeForIssuePath(first.path),
      `[igrp-template-config]: Configuração inválida em "${field}": ${first.message}`,
      { field, issueCount: result.error.issues.length },
    );
  }
}

export async function igrpBuildConfig(config: IGRPConfigArgs): Promise<IGRPConfigArgs> {
  validateConfig(config);
  return config;
}
```

Notes for the implementer:
- The previous `// TODO: create Sanitizer for config` comment is gone — this schema IS the sanitizer.
- We `safeParse` and **discard the parse output**, returning the original `config` — Zod's key-stripping never touches the object consumers receive (functions, sessions, and unknown keys survive untouched).
- Zod v4 API: `ctx.addIssue({ code: 'custom', … })` and `z.custom(predicate, { message })` — if the installed Zod 4.4.3 typing rejects `{ message }` as the second arg of `z.custom`, use the string overload: `z.custom<…>(isFunction, 'layoutMockData.getHeaderData deve ser uma função assíncrona.')`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @igrp/framework-next test`
Expected: PASS — all `build.test.ts` cases plus every pre-existing suite (`api-config`, `sync-plan`, `sync-menus`, `api-client`).

- [ ] **Step 5: Verify both preview branches in the template still type-check/build**

Run: `pnpm build:next` (from repo root) — builds `@igrp/framework-next` through SWC + Babel + types.
Expected: build succeeds. (Full-chain verification happens in Task 18.)

- [ ] **Step 6: Format and commit**

```bash
pnpm --filter @igrp/framework-next format
git add packages/framework/next/src/lib/build.ts packages/framework/next/src/lib/__tests__/build.test.ts
git commit -m "feat(framework-next): validate IGRPConfigArgs with a Zod schema in igrpBuildConfig"
```

---

## Task 14: Changeset for FN-2

**Files:**
- Create: `.changeset/framework-next-config-schema.md`

- [ ] **Step 1: Write the changeset**

Create `.changeset/framework-next-config-schema.md`:

```md
---
"@igrp/framework-next": patch
---

`igrpBuildConfig` now validates the full config shape with a Zod schema, enforcing the previously documentation-only invariants: `previewMode`/`syncAccess` must be booleans, `layoutMockData` getters must be functions, `apiManagementConfig.baseUrl` is required when preview is off, and `serviceId`/`m2mClientId`/`m2mClientSecret`/`appCode` are required when sync is on outside preview. Failures throw `IgrpConfigError` with field-level context and a stable code (new code: `IGRP_CONFIG_INVALID`). Valid configs — including minimal preview-mode configs — are unaffected.
```

- [ ] **Step 2: Commit**

```bash
git add .changeset/framework-next-config-schema.md
git commit -m "chore: add changeset for config schema validation"
```

---

## Task 15 (final): Full verification

- [ ] **Step 1: Run every touched package's tests**

```powershell
pnpm --filter @igrp/template-migrator test
pnpm --filter @igrp/framework-next-auth test
pnpm --filter @igrp/framework-next test
```

Expected: all PASS.

- [ ] **Step 2: Build the framework chain in dependency order**

Run: `pnpm build:framework`
Expected: `next-auth → next-types → design-system → next-ui → next` all build clean. This is mandatory — `next-auth` changed and it is the root of the chain.

- [ ] **Step 3: Build the migrator**

Run: `pnpm --filter @igrp/template-migrator build`
Expected: pack + tsup + tsc clean. Then run `pnpm --filter @igrp/template-migrator check:drift` — expected clean (no template files changed in this plan).

- [ ] **Step 4: Verify the template still compiles against the rebuilt framework**

Run: `pnpm build:demo`
Expected: Next.js build succeeds (this validates `igrpBuildConfig`'s schema against the template's real `createConfig`, covering the preview-on and preview-off shapes at type level and the active branch at build time).

- [ ] **Step 5: Confirm nothing is left uncommitted, then stop**

Run: `git status`
Expected: clean tree, 12 commits on the branch.

**Do NOT run** `pnpm version:changesets` or any publish/release step — versioning and publishing require explicit user authorization (separate task, use `/release-framework`).

---

## Self-review record

- **Spec coverage:** TM-1 → Tasks 4–6; TM-2 → Tasks 1–6 (tests); FN-1 → Task 8; NA-1 → Task 9; FN-2 → Tasks 11–13; changesets → Tasks 7, 10, 14. TM-3/TM-4/TM-5/TM-6 and all Phase 5+ items are intentionally deferred to follow-up plans per the spec's execution order.
- **Known judgment calls:** `undoPayloads` stores UTF-8 text only (template payloads are source files; binary payloads are out of scope and would need a base64 flag later). `APP_CODE_PATTERN` stays uppercase-only with input normalization rather than an `i` flag, so the plan's canonical-uppercase contract is explicit in code.
- **Type consistency check:** `rollback` returns `Promise<boolean>` (Task 4) and `cli.ts` consumes it (Task 4 Step 5); `apply` opts gains `payloadDir` (Task 5) matching `executeStep`'s third param (Task 1); `LockEntry.undoPayloads` (Task 4 Step 1) is read in Task 4's filter and Task 6's restore and written in Task 5.
