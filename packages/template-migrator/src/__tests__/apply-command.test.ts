import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { readLock } from "../lock";
import type { Manifest } from "../types";

const manifestRef: { current: Manifest } = {
  current: { version: 1, cliVersion: "test", template: "demo-legacy", migrations: [] },
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
      template: "demo-legacy",
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
});
