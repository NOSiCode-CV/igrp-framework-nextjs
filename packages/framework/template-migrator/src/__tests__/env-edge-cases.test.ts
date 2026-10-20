import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { executeStep } from "../apply";
import type { MigrationStep } from "../types";

let appRoot: string;
const ENV = ".env.example";
const read = () => readFileSync(join(appRoot, ENV), "utf8");
const write = (s: string) => writeFileSync(join(appRoot, ENV), s, "utf8");
const remove = (...keys: string[]) =>
  executeStep({ type: "env.remove", file: ENV, keys } as MigrationStep, appRoot);

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-envedge-"));
});
afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
});

describe("env.remove only claims a comment block it owns", () => {
  it("leaves a section header when another key still sits under it", () => {
    // Regression: the walk-back used to take any contiguous comment above the
    // key, eating the header and orphaning OIDC_B.
    write("# ===== OIDC settings =====\nOIDC_A=1\nOIDC_B=2\n");
    remove("OIDC_A");
    expect(read()).toBe("# ===== OIDC settings =====\nOIDC_B=2\n");
  });

  it("takes the block when the key is the last line of it", () => {
    write("KEPT=1\n\n# What this does\nNEW_KEY=abc\n");
    remove("NEW_KEY");
    expect(read()).toBe("KEPT=1\n");
  });

  it("takes the block at end of file", () => {
    write("KEPT=1\n\n# trailing doc\nLAST=2");
    remove("LAST");
    expect(read()).toBe("KEPT=1\n");
  });

  it("stops at a blank line between a comment and the key", () => {
    write("# unrelated note\n\nKEY=1\n");
    remove("KEY");
    // The note survives; the blank that separated it from the key goes with
    // the key, leaving a file that still ends in exactly one newline.
    expect(read()).toBe("# unrelated note\n");
  });

  it("does not absorb a commented-out setting as documentation", () => {
    write("# KEY=olddefault\nKEY=1\n");
    const undo = remove("KEY");
    // The commented-out default is the consumer's data and stays put.
    expect(read()).toContain("# KEY=olddefault");
    expect(undo.type === "env.add" && undo.keys.KEY.doc).toBe("");
  });
});

describe("env round-trip fidelity", () => {
  it("an UNdocumented key round-trips without gaining a bare comment", () => {
    // Regression: env.add wrote `# ${doc}` unconditionally, so undoing the
    // removal of a key that never had a comment invented an empty one.
    const before = "TOKEN=a=b=c\n";
    write(before);
    const undo = remove("TOKEN");
    executeStep(undo, appRoot);
    expect(read()).toBe(before);
  });

  it("a documented key round-trips byte-identically", () => {
    const before = "EXISTING=1\n";
    write(before);
    const undo = executeStep(
      {
        type: "env.add",
        file: ENV,
        keys: { NEW_KEY: { doc: "What this does", default: "abc" } },
      } as MigrationStep,
      appRoot,
    );
    executeStep(undo, appRoot);
    expect(read()).toBe(before);
  });

  it("preserves a value containing '='", () => {
    write("TOKEN=a=b=c\n");
    const undo = remove("TOKEN");
    expect(undo.type === "env.add" && undo.keys.TOKEN.default).toBe("a=b=c");
  });
});
