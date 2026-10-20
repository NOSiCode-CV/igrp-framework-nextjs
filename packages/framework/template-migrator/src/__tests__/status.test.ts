import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { writeLock } from "../lock";
import type { LockEntry, Manifest } from "../types";

const manifestRef: { current: Manifest } = {
  current: { version: 1, cliVersion: "test", template: "demo-v1", migrations: [] },
};

vi.mock("../manifest", () => ({
  getManifest: () => manifestRef.current,
}));

import { status } from "../commands/status";

let appRoot: string;

function migration(id: string) {
  return {
    id,
    date: "2026-01-01",
    requires: [],
    targetFrameworkVersion: null,
    guideHref: `${id}.md`,
    contentHash: "aaaaaaaaaaaaaaaa",
    steps: [],
  };
}

function entry(id: string, cliVersion = "test"): LockEntry {
  return {
    id,
    appliedAt: "2026-01-01T00:00:00.000Z",
    cliVersion,
    manifestHash: "aaaaaaaaaaaaaaaa",
    undo: [],
    fileHashes: {},
  };
}

/** Capture what status() printed. */
function runStatus(): string {
  const lines: string[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
    lines.push(args.map(String).join(" "));
  });
  try {
    status(appRoot);
  } finally {
    spy.mockRestore();
  }
  return lines.join("\n");
}

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-status-"));
  manifestRef.current = {
    version: 1,
    cliVersion: "test",
    template: "demo-v1",
    migrations: [migration("01-a"), migration("02-b")],
  };
});

afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
});

describe("status", () => {
  it("reports applied and pending counts matching the rows shown", () => {
    writeLock(appRoot, { version: 1, template: "demo-v1", applied: [entry("01-a")] });

    const out = runStatus();

    expect(out).toContain("✓ applied  01-a");
    expect(out).toContain("• pending  02-b");
    expect(out).toContain("1 applied, 1 pending");
  });

  it("reports 0 pending for a fully migrated app", () => {
    writeLock(appRoot, {
      version: 1,
      template: "demo-v1",
      applied: [entry("01-a"), entry("02-b")],
    });

    expect(runStatus()).toContain("2 applied, 0 pending");
  });

  it("lists lock entries this CLI does not ship instead of only counting them", () => {
    // An app migrated by a newer CLI, then inspected with an older one. The
    // count used to include these while the listing omitted them, so the total
    // silently disagreed with the rows above it.
    writeLock(appRoot, {
      version: 1,
      template: "demo-v1",
      applied: [entry("01-a"), entry("02-b"), entry("03-from-the-future", "0.1.0-beta.999")],
    });

    const out = runStatus();

    expect(out).toContain("? unknown  03-from-the-future (applied by CLI 0.1.0-beta.999)");
    expect(out).toContain("3 applied (1 from a newer CLI), 0 pending");
    expect(out).toContain("migrated by a newer @igrp/template-migrator");
  });

  it("says nothing about newer CLIs when every entry is known", () => {
    writeLock(appRoot, { version: 1, template: "demo-v1", applied: [entry("01-a")] });

    const out = runStatus();

    expect(out).not.toContain("? unknown");
    expect(out).not.toContain("from a newer CLI");
  });
});
