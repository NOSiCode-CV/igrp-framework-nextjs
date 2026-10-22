import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import { tmpdir } from "os";
import { join } from "path";

// Partial mock: every fs function is real except renameSync, which a test can
// make fail the way Windows does while another process holds the target open.
vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return { ...actual, renameSync: vi.fn(actual.renameSync) };
});

const { readLock, writeLock } = await import("../lock");
const actualFs = await vi.importActual<typeof import("fs")>("fs");
const rename = vi.mocked(fs.renameSync);

const eperm = () => Object.assign(new Error("EPERM: operation not permitted, rename"), { code: "EPERM" });
const lock = { version: 1 as const, template: "demo-v1" as const, applied: [] };

let appRoot: string;

beforeEach(() => {
  appRoot = fs.mkdtempSync(join(tmpdir(), "tm-lockretry-"));
  rename.mockReset();
  rename.mockImplementation(actualFs.renameSync);
});

afterEach(() => {
  fs.rmSync(appRoot, { recursive: true, force: true });
});

describe("writeLock rename retry", () => {
  it("retries a transient EPERM and writes the lock", () => {
    rename.mockImplementationOnce(() => { throw eperm(); }).mockImplementationOnce(() => { throw eperm(); });
    writeLock(appRoot, lock);
    expect(rename).toHaveBeenCalledTimes(3);
    expect(readLock(appRoot)).toEqual(lock);
  });

  it("does not retry other errors, and removes the temp file", () => {
    rename.mockImplementationOnce(() => { throw Object.assign(new Error("ENOENT"), { code: "ENOENT" }); });
    expect(() => writeLock(appRoot, lock)).toThrow(/ENOENT/);
    expect(rename).toHaveBeenCalledTimes(1);
    expect(fs.readdirSync(appRoot)).toEqual([]);
  });
});
