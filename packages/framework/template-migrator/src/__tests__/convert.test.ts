import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { convert } from "../commands/convert";

let appRoot: string;
const LEGACY = ".igrpmigrations";
const NEW_LOCK = ".igrp-migrations-lock.json";

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-convert-"));
});

afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("convert", () => {
  it("moves the legacy lock to the new path and removes the empty legacy dir", () => {
    mkdirSync(join(appRoot, LEGACY), { recursive: true });
    const content = JSON.stringify({ version: 1, template: "demo-v1", applied: [] });
    writeFileSync(join(appRoot, LEGACY, "lock.json"), content, "utf8");

    expect(convert(appRoot)).toBe(true);

    expect(readFileSync(join(appRoot, NEW_LOCK), "utf8")).toBe(content);
    expect(existsSync(join(appRoot, LEGACY, "lock.json"))).toBe(false);
    expect(existsSync(join(appRoot, LEGACY))).toBe(false);
  });

  it("heals an interrupted convert when both lock files exist", () => {
    mkdirSync(join(appRoot, LEGACY), { recursive: true });
    writeFileSync(join(appRoot, LEGACY, "lock.json"), "{\"stale\":true}", "utf8");
    const newContent = "{\"version\":1}";
    writeFileSync(join(appRoot, NEW_LOCK), newContent, "utf8");

    expect(convert(appRoot)).toBe(true);

    expect(existsSync(join(appRoot, LEGACY, "lock.json"))).toBe(false);
    expect(readFileSync(join(appRoot, NEW_LOCK), "utf8")).toBe(newContent);
  });

  it("reports failure when there is no legacy lock to convert", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    expect(convert(appRoot)).toBe(false);
    // `convert` is exported from the package root: a library function must
    // never take the host process down with it.
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("reports failure when only the new lock exists (no legacy lock)", () => {
    // legacy missing + new lock present → "no legacy lock" branch fires first
    writeFileSync(join(appRoot, NEW_LOCK), "{}", "utf8");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(convert(appRoot)).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("No legacy lock file found"));
  });
});
