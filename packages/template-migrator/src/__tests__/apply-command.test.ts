import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { readLock } from "../lock";
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
      template: "demo-v1",
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

  it("keeps the FIRST captured content when a migration touches the same path twice", async () => {
    writeFileAt(appRoot, "src/twice.ts", "TRUE ORIGINAL\n");
    writeFileAt(payloadDir, "11/src/twice.v1.ts", "INTERMEDIATE\n");
    writeFileAt(payloadDir, "11/src/twice.v2.ts", "FINAL\n");

    manifestRef.current = {
      version: 1,
      cliVersion: "test",
      template: "demo-v1",
      migrations: [
        {
          id: "11-twice-test",
          date: "2026-06-10",
          requires: [],
          targetFrameworkVersion: null,
          guideHref: "11.MIGRATIONS-10062026.md",
          contentHash: "0123456789abcdef",
          steps: [
            { type: "file.write", mode: "replace", path: "src/twice.ts", from: "11/src/twice.v1.ts" },
            { type: "file.write", mode: "replace", path: "src/twice.ts", from: "11/src/twice.v2.ts" },
          ],
        },
      ],
    };

    await apply(appRoot, { yes: true, payloadDir });

    const entry = readLock(appRoot).applied[0];
    expect(entry.undoPayloads).toEqual({ "src/twice.ts": "TRUE ORIGINAL\n" });
  });

  it("directory delete does not abort apply", async () => {
    writeFileAt(appRoot, "src/dead-dir/file.txt", "x\n");

    manifestRef.current = {
      version: 1,
      cliVersion: "test",
      template: "demo-v1",
      migrations: [
        {
          id: "12-dir-delete-test",
          date: "2026-06-10",
          requires: [],
          targetFrameworkVersion: null,
          guideHref: "12.MIGRATIONS-10062026.md",
          contentHash: "deadbeefdeadbeef",
          steps: [{ type: "file.delete", path: "src/dead-dir" }],
        },
      ],
    };

    await apply(appRoot, { yes: true, payloadDir });

    // directory removed, migration recorded
    expect(existsSync(join(appRoot, "src/dead-dir"))).toBe(false);
    const lock = readLock(appRoot);
    expect(lock.applied).toHaveLength(1);
    // directories are not captured as undo payloads (text files only)
    expect(lock.applied[0].undoPayloads?.["src/dead-dir"]).toBeUndefined();
  });
});

describe("apply self-heals the template identifier", () => {
  it("upgrades a stale demo-legacy lock to the current manifest template", async () => {
    // An app previously migrated under the former "demo-legacy" identifier.
    writeFileSync(
      join(appRoot, ".igrp-migrations-lock.json"),
      JSON.stringify({ version: 1, template: "demo-legacy", applied: [] }),
      "utf8"
    );
    writeFileAt(payloadDir, "21/src/new.ts", "NEW\n");

    manifestRef.current = {
      version: 1,
      cliVersion: "test",
      template: "demo-v1",
      migrations: [
        {
          id: "21-heal-test",
          date: "2026-06-25",
          requires: [],
          targetFrameworkVersion: null,
          guideHref: "21.MIGRATIONS-25062026.md",
          contentHash: "abcabcabcabcabca",
          steps: [{ type: "file.create", path: "src/new.ts", from: "21/src/new.ts" }],
        },
      ],
    };

    await apply(appRoot, { yes: true, payloadDir });

    expect(readLock(appRoot).applied).toHaveLength(1);
    expect(readLock(appRoot).template).toBe("demo-v1");
  });
});
