import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { writeLock, readLock } from "../lock";
import type { LockEntry, Manifest } from "../types";

const manifestRef: { current: Manifest } = {
  current: { version: 1, cliVersion: "test", template: "demo-v1", migrations: [] },
};
vi.mock("../manifest", () => ({ getManifest: () => manifestRef.current }));

import { apply } from "../commands/apply";

let appRoot: string;
let payloadDir: string;

function writeAt(base: string, rel: string, content: string) {
  const p = join(base, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
}

const migration = (id: string, steps: Manifest["migrations"][number]["steps"]) => ({
  id,
  date: "2026-01-01",
  requires: [],
  targetFrameworkVersion: null,
  guideHref: `${id}.md`,
  contentHash: `hash-${id}`,
  steps,
});

/** A baseline entry, exactly as the template's shipped lock records one. */
const baseline = (id: string): LockEntry => ({
  id,
  appliedAt: "2026-01-01T00:00:00.000Z",
  cliVersion: "test",
  manifestHash: `hash-${id}`,
});

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-scaffold-"));
  payloadDir = mkdtempSync(join(tmpdir(), "tm-scaffold-payload-"));
  // Migration 01 shipped middleware.ts; the scaffolded app already contains it.
  writeAt(payloadDir, "01/src/middleware.ts", "ORIGINAL\n");
  writeAt(payloadDir, "02/src/middleware.ts", "UPGRADED\n");
  writeAt(appRoot, "src/middleware.ts", "ORIGINAL\n");
  manifestRef.current = {
    version: 1,
    cliVersion: "test",
    template: "demo-v1",
    migrations: [
      migration("01-ships-middleware", [
        { type: "file.create", path: "src/middleware.ts", from: "payload/01/src/middleware.ts" },
      ]),
      migration("02-upgrades-middleware", [
        { type: "file.write", mode: "replace", path: "src/middleware.ts", from: "payload/02/src/middleware.ts" },
      ]),
    ],
  };
  // The scaffold baseline: 01 recorded as applied, with no undo and no hashes.
  writeLock(appRoot, { version: 1, template: "demo-v1", applied: [baseline("01-ships-middleware")] });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(appRoot, { recursive: true, force: true });
  rmSync(payloadDir, { recursive: true, force: true });
});

describe("a freshly scaffolded app is protected too", () => {
  it("refuses to clobber an edit to a file the TEMPLATE shipped", async () => {
    // Regression: the baseline came from lock `postHashes`, which a scaffolded
    // app has none of — so this edit was silently overwritten.
    writeAt(appRoot, "src/middleware.ts", "MY OWN CHANGES\n");

    await apply(appRoot, { yes: true, payloadDir });

    expect(readFileSync(join(appRoot, "src/middleware.ts"), "utf8")).toBe("MY OWN CHANGES\n");
    expect(readLock(appRoot).applied.map((a) => a.id)).toEqual(["01-ships-middleware"]);
  });

  it("applies cleanly when the file is untouched", async () => {
    await apply(appRoot, { yes: true, payloadDir });

    expect(readFileSync(join(appRoot, "src/middleware.ts"), "utf8")).toBe("UPGRADED\n");
    expect(readLock(appRoot).applied.map((a) => a.id)).toEqual([
      "01-ships-middleware",
      "02-upgrades-middleware",
    ]);
  });

  it("treats a CRLF checkout as untouched, not as a local edit", async () => {
    // Payloads are LF; a Windows consumer with core.autocrlf has CRLF on disk.
    writeAt(appRoot, "src/middleware.ts", "ORIGINAL\r\n");

    await apply(appRoot, { yes: true, payloadDir });

    expect(readFileSync(join(appRoot, "src/middleware.ts"), "utf8")).toBe("UPGRADED\n");
  });

  it("still overwrites under --force", async () => {
    writeAt(appRoot, "src/middleware.ts", "MY OWN CHANGES\n");

    await apply(appRoot, { yes: true, force: true, payloadDir });

    expect(readFileSync(join(appRoot, "src/middleware.ts"), "utf8")).toBe("UPGRADED\n");
  });

  it("keeps the lock at four keys — no hashes are written back into it", async () => {
    await apply(appRoot, { yes: true, payloadDir });

    const entry = readLock(appRoot).applied.find((a) => a.id === "01-ships-middleware");
    expect(Object.keys(entry ?? {})).toEqual(["id", "appliedAt", "cliVersion", "manifestHash"]);
  });
});
