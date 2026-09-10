import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { hashSteps } from "../../src/hash.js";
import type { LockEntry, LockFile } from "../../src/types.js";
import {
  buildTemplateLock,
  diffTemplateLock,
  isLockClean,
  readTemplateLock,
  summarise,
  type MigrationSummary,
} from "../template-lock.js";

function migration(id: string, date = "2026-01-01", steps: unknown = [{ type: "noop", id }]): MigrationSummary {
  return { id, date, contentHash: hashSteps(steps) };
}

function entry(m: MigrationSummary, overrides: Partial<LockEntry> = {}): LockEntry {
  return {
    id: m.id,
    appliedAt: `${m.date}T00:00:00.000Z`,
    cliVersion: "0.1.0-beta.100",
    manifestHash: m.contentHash,
    undo: [],
    fileHashes: {},
    ...overrides,
  };
}

function lockOf(entries: LockEntry[]): LockFile {
  return { version: 1, template: "demo-v1", applied: entries };
}

describe("diffTemplateLock", () => {
  it("is clean when the lock records every migration in order", () => {
    const migrations = [migration("01-a"), migration("02-b")];
    const diff = diffTemplateLock({ migrations, lock: lockOf(migrations.map((m) => entry(m))) });
    expect(isLockClean(diff)).toBe(true);
  });

  it("flags migrations the lock never records — the stale-template case", () => {
    const migrations = [migration("01-a"), migration("02-b"), migration("03-c")];
    const diff = diffTemplateLock({ migrations, lock: lockOf([entry(migrations[0])]) });
    expect(diff.missing).toEqual(["02-b", "03-c"]);
    expect(isLockClean(diff)).toBe(false);
  });

  it("flags lock entries for migrations that no longer exist", () => {
    const kept = migration("01-a");
    const dropped = migration("02-removed");
    const diff = diffTemplateLock({ migrations: [kept], lock: lockOf([entry(kept), entry(dropped)]) });
    expect(diff.unknown).toEqual(["02-removed"]);
  });

  it("flags a recorded hash that no longer matches the migration's steps", () => {
    const m = migration("01-a");
    const diff = diffTemplateLock({
      migrations: [m],
      lock: lockOf([entry(m, { manifestHash: "deadbeefdeadbeef" })]),
    });
    expect(diff.hashMismatch).toEqual([
      { id: "01-a", recorded: "deadbeefdeadbeef", expected: m.contentHash },
    ]);
  });

  it("flags entries recorded out of migration order", () => {
    const migrations = [migration("01-a"), migration("02-b")];
    const diff = diffTemplateLock({
      migrations,
      lock: lockOf([entry(migrations[1]), entry(migrations[0])]),
    });
    expect(diff.outOfOrder).toBe(true);
  });

  it("does not report order when the id sets already disagree", () => {
    // missing/unknown are the actionable signal there; order would be noise.
    const migrations = [migration("01-a"), migration("02-b")];
    const diff = diffTemplateLock({ migrations, lock: lockOf([entry(migrations[1])]) });
    expect(diff.missing).toEqual(["01-a"]);
    expect(diff.outOfOrder).toBe(false);
  });

  it("treats a missing lock file as everything pending", () => {
    const migrations = [migration("01-a"), migration("02-b")];
    const diff = diffTemplateLock({ migrations, lock: null });
    expect(diff.missing).toEqual(["01-a", "02-b"]);
  });
});

describe("buildTemplateLock", () => {
  it("appends missing migrations and leaves recorded history untouched", () => {
    const first = migration("01-a", "2025-11-10");
    const second = migration("02-b", "2026-03-04");
    const existing = lockOf([entry(first, { appliedAt: "2025-11-10T00:00:00.000Z", cliVersion: "0.1.1-beta.115" })]);

    const built = buildTemplateLock({
      migrations: [first, second],
      existing,
      cliVersion: "0.1.0-beta.134",
    });

    expect(built.applied).toHaveLength(2);
    // History preserved verbatim — regenerating must not churn prior entries.
    expect(built.applied[0]).toEqual(existing.applied[0]);
    expect(built.applied[1]).toMatchObject({
      id: "02-b",
      appliedAt: "2026-03-04T00:00:00.000Z",
      cliVersion: "0.1.0-beta.134",
      manifestHash: second.contentHash,
      undo: [],
      fileHashes: {},
    });
  });

  it("refreshes a stale hash without rewriting appliedAt or cliVersion", () => {
    const m = migration("01-a");
    const existing = lockOf([entry(m, { manifestHash: "0000000000000000", cliVersion: "0.1.1-beta.115" })]);
    const built = buildTemplateLock({ migrations: [m], existing, cliVersion: "0.1.0-beta.134" });
    expect(built.applied[0].manifestHash).toBe(m.contentHash);
    expect(built.applied[0].cliVersion).toBe("0.1.1-beta.115");
  });

  it("drops entries for migrations that no longer exist", () => {
    const kept = migration("01-a");
    const dropped = migration("02-removed");
    const built = buildTemplateLock({
      migrations: [kept],
      existing: lockOf([entry(kept), entry(dropped)]),
      cliVersion: "0.1.0-beta.134",
    });
    expect(built.applied.map((e) => e.id)).toEqual(["01-a"]);
  });

  it("reorders entries to match migration order", () => {
    const migrations = [migration("01-a"), migration("02-b")];
    const built = buildTemplateLock({
      migrations,
      existing: lockOf([entry(migrations[1]), entry(migrations[0])]),
      cliVersion: "0.1.0-beta.134",
    });
    expect(built.applied.map((e) => e.id)).toEqual(["01-a", "02-b"]);
  });

  it("builds a complete lock from nothing", () => {
    const migrations = [migration("01-a", "2025-11-10")];
    const built = buildTemplateLock({ migrations, existing: null, cliVersion: "0.1.0-beta.134" });
    expect(built).toEqual({
      version: 1,
      template: "demo-v1",
      applied: [
        {
          id: "01-a",
          appliedAt: "2025-11-10T00:00:00.000Z",
          cliVersion: "0.1.0-beta.134",
          manifestHash: migrations[0].contentHash,
          undo: [],
          fileHashes: {},
        },
      ],
    });
  });

  it("produces a lock that the diff then considers clean", () => {
    const migrations = [migration("01-a"), migration("02-b"), migration("03-c")];
    const built = buildTemplateLock({ migrations, existing: null, cliVersion: "0.1.0-beta.134" });
    expect(isLockClean(diffTemplateLock({ migrations, lock: built }))).toBe(true);
  });

  it("rejects a migration whose date cannot be parsed", () => {
    const broken: MigrationSummary = { id: "01-a", date: "not-a-date", contentHash: "abc" };
    expect(() => buildTemplateLock({ migrations: [broken], existing: null, cliVersion: "1.0.0" })).toThrow(
      /unparsable date/,
    );
  });
});

describe("readTemplateLock", () => {
  it("returns null when the lock does not exist", () => {
    expect(readTemplateLock(join(mkdtempSync(join(tmpdir(), "igrp-lock-")), "nope.json"))).toBeNull();
  });

  it("throws a described error on malformed JSON rather than a bare parse failure", () => {
    const dir = mkdtempSync(join(tmpdir(), "igrp-lock-"));
    const p = join(dir, "lock.json");
    writeFileSync(p, "{ this is not json");
    try {
      expect(() => readTemplateLock(p)).toThrow(/is not valid JSON/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reads a well-formed lock", () => {
    const dir = mkdtempSync(join(tmpdir(), "igrp-lock-"));
    const p = join(dir, "lock.json");
    const m = migration("01-a");
    writeFileSync(p, JSON.stringify(lockOf([entry(m)])));
    try {
      expect(readTemplateLock(p)?.applied.map((e) => e.id)).toEqual(["01-a"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("summarise", () => {
  it("hashes steps the same way the packer stamps contentHash", () => {
    const steps = [{ type: "file.write", path: "src/middleware.ts" }];
    expect(summarise({ id: "01-a", date: "2026-01-01", steps }).contentHash).toBe(hashSteps(steps));
  });

  it("tolerates frontmatter with no date", () => {
    expect(summarise({ id: "01-a", steps: [] }).date).toBe("");
  });
});
