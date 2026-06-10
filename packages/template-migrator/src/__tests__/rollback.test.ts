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
