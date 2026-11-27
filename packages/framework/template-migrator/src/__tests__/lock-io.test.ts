import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { readLock, writeLock, lockPath } from "../lock";

let appRoot: string;

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-lockio-"));
});

afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
});

describe("readLock", () => {
  it("names the file and the likely cause instead of leaking a SyntaxError", () => {
    writeFileSync(lockPath(appRoot), "{ not json", "utf8");
    expect(() => readLock(appRoot)).toThrow(/is not valid JSON/);
    expect(() => readLock(appRoot)).toThrow(/bad merge/);
  });

  it("rejects valid JSON that is not a lock file", () => {
    writeFileSync(lockPath(appRoot), JSON.stringify({ hello: "world" }), "utf8");
    expect(() => readLock(appRoot)).toThrow(/not a migration lock file/);
  });

  it("returns an empty lock when there is none", () => {
    expect(readLock(appRoot).applied).toEqual([]);
  });
});

describe("writeLock", () => {
  it("leaves no temp file behind", () => {
    writeLock(appRoot, { version: 1, template: "demo-v1", applied: [] });
    expect(readdirSync(appRoot).filter((f) => f.endsWith(".tmp"))).toEqual([]);
  });

  it("writes a flat applied array with hashes only, readable by CLIs up to 0.2.0-beta.27", () => {
    const applied = [
      { id: "01-a", cliVersion: "0.1.1-beta.115", manifestHash: "m1", payloadHash: "p1" },
      { id: "02-b", cliVersion: "0.1.0-beta.130", manifestHash: "m2" },
    ];
    writeLock(appRoot, { version: 1, template: "demo-v1", applied });
    expect(JSON.parse(readFileSync(lockPath(appRoot), "utf8"))).toEqual({ version: 1, template: "demo-v1", applied });
    expect(readLock(appRoot).applied).toEqual(applied);
  });

  it("reads the grouped version-2 lock of unreleased builds", () => {
    writeFileSync(
      lockPath(appRoot),
      JSON.stringify({
        version: 2,
        template: "demo-v1",
        applied: { "0.1": { "01-a": { manifestHash: "m1", payloadHash: "p1" } }, "0.2": { "03-c": { manifestHash: "m3" } } },
      }),
      "utf8",
    );
    expect(readLock(appRoot).applied).toEqual([
      { id: "01-a", cliVersion: "0.1", manifestHash: "m1", payloadHash: "p1" },
      { id: "03-c", cliVersion: "0.2", manifestHash: "m3" },
    ]);
  });

  it("reads a v1 lock and drops its undo content on the next write", () => {
    const big = "x".repeat(100_000);
    writeFileSync(
      lockPath(appRoot),
      JSON.stringify({
        version: 1,
        template: "demo-v1",
        applied: [{
          id: "01-a", appliedAt: "2026-01-01T00:00:00.000Z", cliVersion: "0.2.0-beta.3",
          manifestHash: "m1", payloadHash: "p1",
          undo: [{ type: "file.write", mode: "replace", path: "a.ts", from: "__undo__" }],
          undoPayloads: { "a.ts": big },
        }],
      }),
      "utf8",
    );
    const lock = readLock(appRoot);
    expect(lock.applied[0]).toMatchObject({ id: "01-a", manifestHash: "m1", payloadHash: "p1" });
    writeLock(appRoot, lock);
    const raw = readFileSync(lockPath(appRoot), "utf8");
    expect(raw).not.toContain(big);
    expect(JSON.parse(raw).applied).toEqual([{ id: "01-a", cliVersion: "0.2.0-beta.3", manifestHash: "m1", payloadHash: "p1" }]);
  });
});
