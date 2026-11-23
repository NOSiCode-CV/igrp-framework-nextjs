import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { readLock } from "../lock";
import { journalPath, readJournal, writeJournal } from "../journal";
import type { Manifest } from "../types";

const manifestRef: { current: Manifest } = {
  current: { version: 1, cliVersion: "test", template: "demo-v1", migrations: [] },
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

/** One migration that overwrites a file and creates another. */
function setManifest() {
  manifestRef.current = {
    version: 1,
    cliVersion: "test",
    template: "demo-v1",
    migrations: [
      {
        id: "40-crash-test",
        date: "2026-08-01",
        requires: [],
        targetFrameworkVersion: null,
        guideHref: "40.MIGRATIONS-01082026.md",
        contentHash: "abcdabcdabcdabcd",
        steps: [
          { type: "file.write", mode: "replace", path: "src/edited.ts", from: "40/src/edited.ts" },
          { type: "file.create", path: "src/added.ts", from: "40/src/added.ts" },
        ],
      },
    ],
  };
}

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-crash-"));
  payloadDir = mkdtempSync(join(tmpdir(), "tm-crash-payload-"));
  writeFileAt(payloadDir, "40/src/edited.ts", "MIGRATED\n");
  writeFileAt(payloadDir, "40/src/added.ts", "ADDED\n");
  setManifest();
});

afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
  rmSync(payloadDir, { recursive: true, force: true });
});

describe("journal lifecycle", () => {
  it("leaves no journal behind after a successful apply", async () => {
    writeFileAt(appRoot, "src/edited.ts", "ORIGINAL\n");
    await apply(appRoot, { yes: true, payloadDir });

    expect(existsSync(journalPath(appRoot))).toBe(false);
    expect(readLock(appRoot).applied).toHaveLength(1);
  });

  it("leaves no journal behind when a migration fails mid-way", async () => {
    writeFileAt(appRoot, "src/edited.ts", "ORIGINAL\n");
    // Second step's payload is missing -> the step throws, unwind runs.
    rmSync(join(payloadDir, "40/src/added.ts"));

    await apply(appRoot, { yes: true, payloadDir });

    expect(existsSync(journalPath(appRoot))).toBe(false);
    expect(readLock(appRoot).applied).toHaveLength(0);
    // The unwind restored the file it had already overwritten.
    expect(readFileSync(join(appRoot, "src/edited.ts"), "utf8")).toBe("ORIGINAL\n");
  });
});

describe("recovery from an interrupted run", () => {
  /**
   * Simulate a signal/crash: the migration's files are on disk, the lock never
   * recorded it, and the journal survives with the undo captured so far. This
   * is the state the process is in between the last executeStep and writeLock.
   */
  function simulateInterruptedRun() {
    writeFileAt(appRoot, "src/edited.ts", "MIGRATED\n"); // step 1 had run
    writeFileAt(appRoot, "src/added.ts", "ADDED\n"); // step 2 had run
    writeFileSync(
      journalPath(appRoot),
      JSON.stringify({
        version: 1,
        id: "40-crash-test",
        startedAt: "2026-08-01T00:00:00.000Z",
        cliVersion: "test",
        undo: [
          { type: "file.write", mode: "replace", path: "src/edited.ts", from: "__undo__" },
          { type: "file.delete", path: "src/added.ts" },
        ],
        undoPayloads: { "src/edited.ts": "ORIGINAL\n" },
      }) + "\n",
      "utf8",
    );
  }

  it("reverts the interrupted migration before re-applying it", async () => {
    simulateInterruptedRun();

    await apply(appRoot, { yes: true, payloadDir });

    // Recovery ran, then the migration applied cleanly from the true baseline.
    expect(existsSync(journalPath(appRoot))).toBe(false);
    const lock = readLock(appRoot);
    expect(lock.applied).toHaveLength(1);
    expect(lock.applied[0].id).toBe("40-crash-test");
  });

  it("aborts without re-applying when recovery cannot restore a path", async () => {
    writeFileAt(appRoot, "src/edited.ts", "MIGRATED\n");
    writeFileSync(
      journalPath(appRoot),
      JSON.stringify({
        version: 1,
        id: "40-crash-test",
        startedAt: "2026-08-01T00:00:00.000Z",
        cliVersion: "test",
        undo: [{ type: "file.write", mode: "replace", path: "src/edited.ts", from: "__undo__" }],
        undoPayloads: {}, // no stored content -> unrecoverable
      }) + "\n",
      "utf8",
    );

    await apply(appRoot, { yes: true, payloadDir });

    // Refused rather than proceeding on an unknown baseline.
    expect(readLock(appRoot).applied).toHaveLength(0);
    expect(existsSync(journalPath(appRoot))).toBe(true);
  });

  it("aborts on an unreadable journal instead of re-running over a half-migrated tree", async () => {
    writeFileAt(appRoot, "src/edited.ts", "HALF MIGRATED\n");
    writeFileSync(journalPath(appRoot), "{ not json", "utf8");

    expect(await apply(appRoot, { yes: true, payloadDir })).toBe(false);

    expect(readLock(appRoot).applied).toHaveLength(0);
    expect(readFileSync(join(appRoot, "src/edited.ts"), "utf8")).toBe("HALF MIGRATED\n");
    expect(existsSync(journalPath(appRoot))).toBe(true);
  });

  it("readJournal throws for a journal missing required fields", () => {
    writeFileSync(journalPath(appRoot), JSON.stringify({ version: 1 }), "utf8");
    expect(() => readJournal(appRoot)).toThrow(/cannot be read/);
  });

  it("writeJournal leaves no temp file behind (atomic tmp + rename)", () => {
    writeJournal(appRoot, { version: 1, id: "x", startedAt: "", cliVersion: "t", undo: [], undoPayloads: {} });
    expect(readJournal(appRoot)?.id).toBe("x");
    expect(existsSync(`${journalPath(appRoot)}.tmp`)).toBe(false);
  });
});
