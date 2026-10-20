import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { writeLock, readLock } from "../lock";
import type { LockEntry, Manifest } from "../types";

const manifestRef: { current: Manifest } = {
  current: { version: 1, cliVersion: "test", template: "demo-v1", migrations: [] },
};
vi.mock("../manifest", () => ({ getManifest: () => manifestRef.current }));

import { rollback } from "../commands/rollback";

let appRoot: string;

const migration = (id: string, requires: string[]) => ({
  id,
  date: "2026-01-01",
  requires,
  targetFrameworkVersion: null,
  guideHref: `${id}.md`,
  contentHash: "aaaaaaaaaaaaaaaa",
  steps: [],
});

const entry = (id: string): LockEntry => ({
  id,
  appliedAt: "2026-01-01T00:00:00.000Z",
  cliVersion: "test",
  manifestHash: "aaaaaaaaaaaaaaaa",
  undo: [{ type: "file.delete", path: "src/added.ts" }],
  fileHashes: {},
});

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-deps-"));
  manifestRef.current = {
    version: 1,
    cliVersion: "test",
    template: "demo-v1",
    migrations: [migration("04-base", []), migration("05-builds-on-04", ["04-base"])],
  };
  writeLock(appRoot, {
    version: 1,
    template: "demo-v1",
    applied: [entry("04-base"), entry("05-builds-on-04")],
  });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(appRoot, { recursive: true, force: true });
});

describe("rollback respects `requires`", () => {
  it("refuses to pull a prerequisite out from under an applied migration", async () => {
    // `apply` refuses to run 05 while 04 is unapplied. Rolling 04 back while 05
    // is still applied reaches that same forbidden state from the other side.
    expect(await rollback(appRoot, "04-base")).toBe(false);
    expect(readLock(appRoot).applied.map((a) => a.id)).toEqual(["04-base", "05-builds-on-04"]);
  });

  it("names the dependents so the user knows what order to undo in", async () => {
    const errors: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...args) => {
      errors.push(args.join(" "));
    });
    await rollback(appRoot, "04-base");
    expect(errors.join("|")).toContain("05-builds-on-04");
  });

  it("allows it under --force", async () => {
    expect(await rollback(appRoot, "04-base", { force: true })).toBe(true);
    expect(readLock(appRoot).applied.map((a) => a.id)).toEqual(["05-builds-on-04"]);
  });

  it("allows rolling back the dependent itself", async () => {
    expect(await rollback(appRoot, "05-builds-on-04")).toBe(true);
    expect(readLock(appRoot).applied.map((a) => a.id)).toEqual(["04-base"]);
  });
});
