import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "fs";
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

  it("round-trips a fully populated entry", () => {
    const lock = {
      version: 1 as const,
      template: "demo-v1" as const,
      applied: [
        {
          id: "01-x",
          appliedAt: "2026-01-01T00:00:00.000Z",
          cliVersion: "test",
          manifestHash: "abcd",
          undo: [],
          fileHashes: { "a.ts": "ff" },
        },
      ],
    };
    writeLock(appRoot, lock);
    expect(readLock(appRoot)).toEqual(lock);
  });
});
