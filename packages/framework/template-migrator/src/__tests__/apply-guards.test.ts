import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { readLock } from "../lock";
import { journalPath, writeJournal } from "../journal";
import type { Manifest } from "../types";

const manifestRef: { current: Manifest } = {
  current: { version: 1, cliVersion: "test", template: "demo-v1", migrations: [] },
};
vi.mock("../manifest", () => ({ getManifest: () => manifestRef.current }));

import { apply } from "../commands/apply";

let appRoot: string;
let payloadDir: string;

function writeFileAt(base: string, rel: string, content: string) {
  const p = join(base, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
}

function setManifest(migrations: Manifest["migrations"]) {
  manifestRef.current = { version: 1, cliVersion: "test", template: "demo-v1", migrations };
}

const migration = (id: string, steps: Manifest["migrations"][number]["steps"], requires: string[] = []) => ({
  id, date: "2026-08-01", requires, targetFrameworkVersion: null,
  guideHref: `${id}.md`, contentHash: `hash-${id}`, steps,
});

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-guard-"));
  payloadDir = mkdtempSync(join(tmpdir(), "tm-guard-payload-"));
  writeFileAt(payloadDir, "40/src/edited.ts", "MIGRATED\n");
  setManifest([
    migration("40-x", [
      { type: "file.write", mode: "replace", path: "src/edited.ts", from: "40/src/edited.ts" },
    ]),
  ]);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(appRoot, { recursive: true, force: true });
  rmSync(payloadDir, { recursive: true, force: true });
});

describe("a journal for an ALREADY-RECORDED migration is stale, not a crash", () => {
  it("does not unwind a migration the lock says succeeded", async () => {
    writeFileAt(appRoot, "src/edited.ts", "ORIGINAL\n");
    await apply(appRoot, { yes: true, payloadDir });
    expect(readFileSync(join(appRoot, "src/edited.ts"), "utf8")).toBe("MIGRATED\n");

    // The process died between writeLock() and clearJournal(): the migration had
    // fully succeeded, but the journal is still on disk. Unwinding here would
    // revert the files while the lock kept claiming the migration was applied,
    // so `apply` would report "nothing to apply" over a tree that lacks it.
    writeJournal(appRoot, {
      version: 1, id: "40-x", startedAt: new Date().toISOString(), cliVersion: "test",
      undo: [{ type: "file.write", mode: "replace", path: "src/edited.ts", from: "__undo__" }],
      undoPayloads: { "src/edited.ts": "ORIGINAL\n" },
    });

    await apply(appRoot, { yes: true, payloadDir });

    expect(readFileSync(join(appRoot, "src/edited.ts"), "utf8")).toBe("MIGRATED\n");
    expect(readLock(appRoot).applied.map((a) => a.id)).toEqual(["40-x"]);
    expect(existsSync(journalPath(appRoot))).toBe(false);
  });

  it("still recovers a journal for a migration the lock does NOT record", async () => {
    writeFileAt(appRoot, "src/edited.ts", "HALF-MIGRATED\n");
    writeJournal(appRoot, {
      version: 1, id: "40-x", startedAt: new Date().toISOString(), cliVersion: "test",
      undo: [{ type: "file.write", mode: "replace", path: "src/edited.ts", from: "__undo__" }],
      undoPayloads: { "src/edited.ts": "ORIGINAL\n" },
    });

    await apply(appRoot, { yes: true, payloadDir });

    // Recovered to ORIGINAL, then applied cleanly on top of it.
    expect(readFileSync(join(appRoot, "src/edited.ts"), "utf8")).toBe("MIGRATED\n");
    const entry = readLock(appRoot).applied[0];
    expect(entry.undoPayloads?.["src/edited.ts"]).toBe("ORIGINAL\n");
  });
});

describe("apply refuses to clobber a locally modified managed file", () => {
  async function applyThenEdit() {
    writeFileAt(appRoot, "src/edited.ts", "ORIGINAL\n");
    await apply(appRoot, { yes: true, payloadDir });
    // Consumer edits the file the migration wrote.
    writeFileAt(appRoot, "src/edited.ts", "MY OWN CHANGES\n");
    // A second migration wants to overwrite the same path.
    writeFileAt(payloadDir, "41/src/edited.ts", "MIGRATED AGAIN\n");
    setManifest([
      migration("40-x", [
        { type: "file.write", mode: "replace", path: "src/edited.ts", from: "40/src/edited.ts" },
      ]),
      migration("41-y", [
        { type: "file.write", mode: "replace", path: "src/edited.ts", from: "41/src/edited.ts" },
      ]),
    ]);
  }

  it("aborts before running any step", async () => {
    await applyThenEdit();
    await apply(appRoot, { yes: true, payloadDir });

    expect(readFileSync(join(appRoot, "src/edited.ts"), "utf8")).toBe("MY OWN CHANGES\n");
    expect(readLock(appRoot).applied.map((a) => a.id)).toEqual(["40-x"]);
  });

  it("proceeds under --force", async () => {
    await applyThenEdit();
    await apply(appRoot, { yes: true, force: true, payloadDir });

    expect(readFileSync(join(appRoot, "src/edited.ts"), "utf8")).toBe("MIGRATED AGAIN\n");
    expect(readLock(appRoot).applied.map((a) => a.id)).toEqual(["40-x", "41-y"]);
  });

  it("does not fire when the file still matches what the migration left", async () => {
    writeFileAt(appRoot, "src/edited.ts", "ORIGINAL\n");
    await apply(appRoot, { yes: true, payloadDir });
    writeFileAt(payloadDir, "41/src/edited.ts", "MIGRATED AGAIN\n");
    setManifest([
      migration("40-x", [
        { type: "file.write", mode: "replace", path: "src/edited.ts", from: "40/src/edited.ts" },
      ]),
      migration("41-y", [
        { type: "file.write", mode: "replace", path: "src/edited.ts", from: "41/src/edited.ts" },
      ]),
    ]);

    await apply(appRoot, { yes: true, payloadDir });
    expect(readFileSync(join(appRoot, "src/edited.ts"), "utf8")).toBe("MIGRATED AGAIN\n");
  });

  it("writes no hashes into the lock — the baseline comes from the payloads", async () => {
    writeFileAt(appRoot, "src/edited.ts", "ORIGINAL\n");
    await apply(appRoot, { yes: true, payloadDir });
    // The guard reads the shipped payload for the last applied migration that
    // wrote each path, so nothing has to be recorded here. That is what makes
    // it work for scaffolded apps, whose lock entries carry no hashes at all.
    const entry = readLock(appRoot).applied[0];
    expect(entry).not.toHaveProperty("postHashes");
  });
});
