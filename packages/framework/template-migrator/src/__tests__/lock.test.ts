import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { readLock, writeLock } from "../lock";
import { LegacyLockError, type LockFile } from "../types";

let appRoot: string;

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-lock-"));
});

afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
});

describe("readLock", () => {
  it("returns an empty lock when no lock file exists", () => {
    expect(readLock(appRoot)).toEqual({ version: 1, template: "demo-v1", applied: [] });
  });

  it("round-trips through writeLock", () => {
    const lock: LockFile = {
      version: 1,
      template: "demo-v1",
      applied: [
        {
          id: "01-test",
          cliVersion: "0.1",
          manifestHash: "abc123",
          payloadHash: "def456",
        },
      ],
    };
    writeLock(appRoot, lock);
    expect(readLock(appRoot)).toEqual(lock);
  });

  it("throws LegacyLockError when the legacy lock exists", () => {
    mkdirSync(join(appRoot, ".igrpmigrations"), { recursive: true });
    writeFileSync(join(appRoot, ".igrpmigrations", "lock.json"), "{}", "utf8");
    expect(() => readLock(appRoot)).toThrow(LegacyLockError);
  });
});
