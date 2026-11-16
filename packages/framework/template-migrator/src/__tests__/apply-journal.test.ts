import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { readLock } from "../lock";
import { journalPath } from "../journal";
import type { Manifest, MigrationStep } from "../types";

const manifestRef: { current: Manifest } = {
  current: { version: 1, cliVersion: "test", template: "demo-v1", migrations: [] },
};
vi.mock("../manifest", () => ({ getManifest: () => manifestRef.current }));

/** Runs after each real executeStep; lets a test fail a step or an undo on demand. */
const hook: { after?: (step: MigrationStep, isUndo: boolean) => void } = {};
vi.mock("../apply", async (importOriginal) => {
  const real = await importOriginal<typeof import("../apply")>();
  return {
    ...real,
    executeStep: (...args: Parameters<typeof real.executeStep>) => {
      const undo = real.executeStep(...args);
      hook.after?.(args[0], args[3] === true);
      return undo;
    },
  };
});

import { apply } from "../commands/apply";
import { rollback } from "../commands/rollback";

let appRoot: string;
const PKG = '{\n  "dependencies": {\n    "a": "1.0.0"\n  }\n}\n';
const readPkg = () => readFileSync(join(appRoot, "package.json"), "utf8");

function setSteps(steps: MigrationStep[]) {
  manifestRef.current = {
    version: 1,
    cliVersion: "test",
    template: "demo-v1",
    migrations: [
      {
        id: "50-journal",
        date: "2026-11-16",
        requires: [],
        targetFrameworkVersion: null,
        guideHref: "50.MIGRATIONS-16112026.md",
        contentHash: "abcdabcdabcdabcd",
        steps,
      },
    ],
  };
}

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-journal-"));
  writeFileSync(join(appRoot, "package.json"), PKG, "utf8");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  hook.after = undefined;
  vi.restoreAllMocks();
  rmSync(appRoot, { recursive: true, force: true });
});

const bump: MigrationStep = { type: "deps.bump", manifest: "package.json", ranges: { a: "2.0.0" } };

describe("journal is written before each step runs", () => {
  it("a kill right after a step's write still recovers to the true original", async () => {
    setSteps([bump]);
    // Snapshot disk + journal at the instant the step finished, as a kill would leave them.
    let crash: { pkg: string; journal: string } | undefined;
    hook.after = (_step, isUndo) => {
      if (isUndo || crash) return;
      crash = { pkg: readPkg(), journal: readFileSync(journalPath(appRoot), "utf8") };
      throw new Error("simulated kill");
    };
    expect(await apply(appRoot, { yes: true })).toBe(false);
    hook.after = undefined;
    writeFileSync(join(appRoot, "package.json"), crash!.pkg, "utf8");
    writeFileSync(journalPath(appRoot), crash!.journal, "utf8");

    expect(await apply(appRoot, { yes: true })).toBe(true);
    // Recovery reverted the bump first, so the recorded baseline is the real original.
    expect(readLock(appRoot).applied[0].undo).toEqual([
      { type: "deps.bump", manifest: "package.json", ranges: { a: "1.0.0" } },
    ]);
  });
});

describe("in-process unwind that fails", () => {
  it("keeps the journal and reports failure instead of claiming a rollback", async () => {
    setSteps([bump, { type: "file.create", path: "src/x.ts", from: "missing/x.ts" }]);
    hook.after = (_step, isUndo) => {
      if (isUndo) throw new Error("undo boom");
    };
    expect(await apply(appRoot, { yes: true, payloadDir: appRoot })).toBe(false);
    expect(existsSync(journalPath(appRoot))).toBe(true);
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining("rolled back"));
  });
});

describe("rollback reports unwind failures", () => {
  it("returns false and keeps the migration recorded when an undo step fails", async () => {
    setSteps([bump]);
    expect(await apply(appRoot, { yes: true })).toBe(true);
    hook.after = (_step, isUndo) => {
      if (isUndo) throw new Error("undo boom");
    };
    expect(await rollback(appRoot, "50-journal")).toBe(false);
    expect(readLock(appRoot).applied.map((a) => a.id)).toEqual(["50-journal"]);
  });
});
