import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { executeStep } from "../apply";
import { unwindSteps } from "../unwind";
import type { MigrationStep } from "../types";

let appRoot: string;
const ENV = ".env.example";
const read = () => readFileSync(join(appRoot, ENV), "utf8");

beforeEach(() => { appRoot = mkdtempSync(join(tmpdir(), "tm-env-")); });
afterEach(() => { rmSync(appRoot, { recursive: true, force: true }); });

const addStep = (keys: Record<string, { doc: string; default?: string; required_if?: string }>) =>
  ({ type: "env.add", file: ENV, keys }) as MigrationStep;

describe("env.add / env.remove round-trip", () => {
  it("leaves the file byte-identical after an undo", () => {
    const before = "EXISTING=1\n";
    writeFileSync(join(appRoot, ENV), before, "utf8");

    const undo = executeStep(addStep({ NEW_KEY: { doc: "What this does", default: "abc" } }), appRoot);
    expect(read()).toContain("NEW_KEY=abc");
    expect(read()).toContain("# What this does");

    executeStep(undo, appRoot);
    // The doc comment used to survive the undo, so every apply/rollback cycle
    // left another orphaned "# ..." line behind.
    expect(read()).toBe(before);
  });

  it("recovers doc and required_if so a re-add restores the real documentation", () => {
    writeFileSync(join(appRoot, ENV), "EXISTING=1\n", "utf8");
    const undo = executeStep(
      addStep({ CLIENT_ID: { doc: "OIDC client id", default: "", required_if: "AUTH_PROVIDER=oidc" } }),
      appRoot,
    );
    const afterAdd = read();

    const redo = executeStep(undo, appRoot);       // env.remove -> captures spec
    const undoAgain = executeStep(redo, appRoot);  // env.add    -> restores it
    expect(read()).toBe(afterAdd);
    expect(undoAgain.type).toBe("env.remove");
  });

  it("does not open an empty file with blank lines", () => {
    executeStep(addStep({ KEY: { doc: "d", default: "v" } }), appRoot);
    expect(read().startsWith("#")).toBe(true);
  });

  it("only undoes keys it actually appended", () => {
    writeFileSync(join(appRoot, ENV), "KEPT=mine\n", "utf8");
    const undo = executeStep(addStep({ KEPT: { doc: "ignored" }, ADDED: { doc: "d" } }), appRoot);
    expect(undo.type === "env.remove" && undo.keys).toEqual(["ADDED"]);
    executeStep(undo, appRoot);
    expect(read()).toBe("KEPT=mine\n");
  });
});

describe("unwind stays inside the app root", () => {
  it("refuses a stored undo payload whose path escapes", () => {
    const outside = join(appRoot, "..", "tm-escaped.txt");
    const result = unwindSteps(
      [{ type: "file.write", mode: "replace", path: "../tm-escaped.txt", from: "__undo__" }],
      { "../tm-escaped.txt": "pwned" },
      appRoot,
    );
    expect(existsSync(outside)).toBe(false);
    expect(result.reverted).toBe(0);
    expect(result.failures[0]).toMatch(/outside the app root/);
  });
});
