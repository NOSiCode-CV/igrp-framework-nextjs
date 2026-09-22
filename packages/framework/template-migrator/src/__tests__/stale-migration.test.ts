import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { writeLock } from "../lock";
import type { LockEntry, Manifest } from "../types";

const manifestRef: { current: Manifest } = {
  current: { version: 1, cliVersion: "test", template: "demo-v1", migrations: [] },
};
vi.mock("../manifest", () => ({ getManifest: () => manifestRef.current }));

import { check } from "../commands/check";
import { status } from "../commands/status";

let appRoot: string;

const migration = (id: string, contentHash: string) => ({
  id,
  date: "2026-01-01",
  requires: [],
  targetFrameworkVersion: null,
  guideHref: `${id}.md`,
  contentHash,
  steps: [],
});

const entry = (id: string, manifestHash: string): LockEntry => ({
  id,
  appliedAt: "2026-01-01T00:00:00.000Z",
  cliVersion: "test",
  manifestHash,
  undo: [],
  fileHashes: {},
});

function capture(fn: () => void): string {
  const lines: string[] = [];
  const push = (...args: unknown[]) => {
    lines.push(args.join(" "));
  };
  vi.spyOn(console, "log").mockImplementation(push);
  vi.spyOn(console, "error").mockImplementation(push);
  fn();
  return lines.join("|");
}

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-stale-"));
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(appRoot, { recursive: true, force: true });
});

describe("an applied migration whose steps changed after it was released", () => {
  beforeEach(() => {
    manifestRef.current = {
      version: 1,
      cliVersion: "test",
      template: "demo-v1",
      migrations: [migration("07-corrected", "newhashnewhash00")],
    };
    // Applied back when the migration hashed to something else.
    writeLock(appRoot, {
      version: 1,
      template: "demo-v1",
      applied: [entry("07-corrected", "oldhasholdhash00")],
    });
  });

  it("fails `check`, which used to pass because nothing compared the hashes", () => {
    let ok = true;
    const out = capture(() => {
      ok = check(appRoot);
    });
    expect(ok).toBe(false);
    expect(out).toContain("07-corrected");
    expect(out).toContain("changed since they were applied");
  });

  it("is flagged by `status` rather than shown as a clean tick", () => {
    const out = capture(() => status(appRoot));
    expect(out).toContain("! changed");
    expect(out).toContain("07-corrected");
  });

  it("passes both once the hashes agree", () => {
    writeLock(appRoot, {
      version: 1,
      template: "demo-v1",
      applied: [entry("07-corrected", "newhashnewhash00")],
    });
    let ok = false;
    const out = capture(() => {
      ok = check(appRoot);
    });
    expect(ok).toBe(true);
    expect(out).toContain("All migrations applied");
  });
});
