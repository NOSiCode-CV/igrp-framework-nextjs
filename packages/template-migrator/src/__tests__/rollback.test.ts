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
    template: "demo-v1",
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
    template: "demo-v1",
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

describe("rollback of a scaffold baseline entry", () => {
  // The template's shipped lock records every migration with undo:[] — a
  // scaffolded app already contains the result, so nothing was executed here.
  // Removing such an entry would report success, change no files, and leave the
  // app claiming the migration is unapplied.
  it("refuses an entry with no undo steps and no stored payloads", async () => {
    writeAppFile("src/untouched.ts", "SCAFFOLD CONTENT\n");
    writeLock(appRoot, lockWith({ undo: [], fileHashes: {} }));

    const ok = await rollback(appRoot, "07-test-migration");

    expect(ok).toBe(false);
    expect(readLock(appRoot).applied).toHaveLength(1);
    expect(readFileSync(join(appRoot, "src/untouched.ts"), "utf8")).toBe("SCAFFOLD CONTENT\n");
  });

  it("drops the entry under --force, leaving files as they are", async () => {
    writeAppFile("src/untouched.ts", "SCAFFOLD CONTENT\n");
    writeLock(appRoot, lockWith({ undo: [], fileHashes: {} }));

    const ok = await rollback(appRoot, "07-test-migration", { force: true });

    expect(ok).toBe(true);
    expect(readLock(appRoot).applied).toHaveLength(0);
    expect(readFileSync(join(appRoot, "src/untouched.ts"), "utf8")).toBe("SCAFFOLD CONTENT\n");
  });

  it("still rolls back normally when the entry has real undo steps", async () => {
    writeAppFile("src/created.ts", "CREATED BY MIGRATION\n");
    writeLock(appRoot, lockWith({ undo: [{ type: "file.delete", path: "src/created.ts" }] }));

    const ok = await rollback(appRoot, "07-test-migration");

    expect(ok).toBe(true);
    expect(existsSync(join(appRoot, "src/created.ts"))).toBe(false);
  });

  it("does not treat an entry carrying stored payloads as a baseline", async () => {
    writeAppFile("src/edited.ts", "MIGRATED\n");
    writeLock(
      appRoot,
      lockWith({
        undo: [{ type: "file.write", mode: "replace", path: "src/edited.ts", from: "__undo__" }],
        undoPayloads: { "src/edited.ts": "ORIGINAL\n" },
      }),
    );

    const ok = await rollback(appRoot, "07-test-migration");

    expect(ok).toBe(true);
    expect(readFileSync(join(appRoot, "src/edited.ts"), "utf8")).toBe("ORIGINAL\n");
  });
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
    writeLock(appRoot, { version: 1, template: "demo-v1", applied: [] });
    const ok = await rollback(appRoot, "99-nope");
    expect(ok).toBe(false);
  });
});

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

describe("rollback executes undo steps in reverse order", () => {
  it("delete-then-recreate of one path ends with the original restored, not deleted", async () => {
    // Migration did: file.delete src/x.ts (original captured), then file.create src/x.ts (new content).
    // Undo steps in FORWARD order: [file.create __undo__ (from the delete), file.delete (from the create)].
    // Correct rollback runs them in REVERSE: delete the recreated file, then restore the original.
    writeAppFile("src/x.ts", "RECREATED BY MIGRATION\n");
    writeLock(
      appRoot,
      lockWith({
        undo: [
          { type: "file.create", path: "src/x.ts", from: "__undo__" },
          { type: "file.delete", path: "src/x.ts" },
        ],
        undoPayloads: { "src/x.ts": "TRUE ORIGINAL\n" },
      })
    );

    const ok = await rollback(appRoot, "07-test-migration");

    expect(ok).toBe(true);
    expect(readFileSync(join(appRoot, "src/x.ts"), "utf8")).toBe("TRUE ORIGINAL\n");
  });
});

describe("rollback self-heals the template identifier", () => {
  it("upgrades a stale demo-legacy lock to the current manifest template", async () => {
    writeAppFile("src/created-by-migration.ts", "new file\n");
    // Write a lock under the former identifier directly (bypasses typed writeLock).
    writeFileSync(
      join(appRoot, ".igrp-migrations-lock.json"),
      JSON.stringify({
        version: 1,
        template: "demo-legacy",
        applied: [
          {
            id: "07-test-migration",
            appliedAt: "2026-06-01T00:00:00.000Z",
            cliVersion: "test",
            manifestHash: "cafebabecafebabe",
            undo: [{ type: "file.delete", path: "src/created-by-migration.ts" }],
            fileHashes: {},
          },
        ],
      }),
      "utf8"
    );

    const ok = await rollback(appRoot, "07-test-migration");

    expect(ok).toBe(true);
    expect(readLock(appRoot).template).toBe("demo-v1");
  });
});
