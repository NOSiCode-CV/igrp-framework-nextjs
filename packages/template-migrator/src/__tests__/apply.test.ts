import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { executeStep } from "../apply";
import type { MigrationStep } from "../types";

let appRoot: string;
let payloadDir: string;

function writePayload(rel: string, content: string) {
  const p = join(payloadDir, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
}

function writeAppFile(rel: string, content: string) {
  const p = join(appRoot, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
}

function readAppFile(rel: string): string {
  return readFileSync(join(appRoot, rel), "utf8");
}

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-app-"));
  payloadDir = mkdtempSync(join(tmpdir(), "tm-payload-"));
});

afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
  rmSync(payloadDir, { recursive: true, force: true });
});

describe("executeStep: file.create / file.write", () => {
  it("copies the payload file to the app and returns file.delete undo when target did not exist", () => {
    writePayload("01/src/lib/new.ts", "export const x = 1;\n");
    const step: MigrationStep = { type: "file.create", path: "src/lib/new.ts", from: "01/src/lib/new.ts" };

    const undo = executeStep(step, appRoot, payloadDir);

    expect(readAppFile("src/lib/new.ts")).toBe("export const x = 1;\n");
    expect(undo).toEqual({ type: "file.delete", path: "src/lib/new.ts" });
  });

  it("overwrites an existing target and returns a placeholder file.write undo", () => {
    writeAppFile("src/lib/old.ts", "OLD CONTENT\n");
    writePayload("02/src/lib/old.ts", "NEW CONTENT\n");
    const step: MigrationStep = { type: "file.write", mode: "replace", path: "src/lib/old.ts", from: "02/src/lib/old.ts" };

    const undo = executeStep(step, appRoot, payloadDir);

    expect(readAppFile("src/lib/old.ts")).toBe("NEW CONTENT\n");
    expect(undo).toEqual({ type: "file.write", mode: "replace", path: "src/lib/old.ts", from: "__undo__" });
  });

  it("strips a leading payload/ prefix from the from field", () => {
    writePayload("03/a.txt", "via-prefix\n");
    const step: MigrationStep = { type: "file.create", path: "a.txt", from: "payload/03/a.txt" };

    executeStep(step, appRoot, payloadDir);

    expect(readAppFile("a.txt")).toBe("via-prefix\n");
  });
});

describe("executeStep: file.delete", () => {
  it("deletes an existing file and returns a placeholder file.create undo", () => {
    writeAppFile("src/dead.ts", "bye\n");
    const step: MigrationStep = { type: "file.delete", path: "src/dead.ts" };

    const undo = executeStep(step, appRoot, payloadDir);

    expect(existsSync(join(appRoot, "src/dead.ts"))).toBe(false);
    expect(undo).toEqual({ type: "file.create", path: "src/dead.ts", from: "__undo__" });
  });

  it("does not throw when the target is already absent", () => {
    const step: MigrationStep = { type: "file.delete", path: "src/never-existed.ts" };
    expect(() => executeStep(step, appRoot, payloadDir)).not.toThrow();
  });
});

describe("executeStep: env.add", () => {
  it("appends missing keys with doc comments", () => {
    writeAppFile(".env", "EXISTING=1\n");
    const step: MigrationStep = {
      type: "env.add",
      file: ".env",
      keys: {
        NEW_KEY: { doc: "A new key", default: "abc" },
        OTHER_KEY: { doc: "Another", required_if: "FEATURE=on" },
      },
    };

    executeStep(step, appRoot, payloadDir);

    const env = readAppFile(".env");
    expect(env).toContain("EXISTING=1");
    expect(env).toContain("# A new key");
    expect(env).toContain("NEW_KEY=abc");
    expect(env).toContain("# Required if: FEATURE=on");
    expect(env).toContain("OTHER_KEY=");
  });

  it("skips keys that already exist (idempotent)", () => {
    writeAppFile(".env", "NEW_KEY=keep-me\n");
    const step: MigrationStep = {
      type: "env.add",
      file: ".env",
      keys: { NEW_KEY: { doc: "should not duplicate", default: "clobber" } },
    };

    executeStep(step, appRoot, payloadDir);

    const env = readAppFile(".env");
    expect(env.match(/NEW_KEY=/g)).toHaveLength(1);
    expect(env).toContain("NEW_KEY=keep-me");
  });
});

describe("executeStep: deps.bump", () => {
  it("updates dependencies and devDependencies and returns previous ranges as undo", () => {
    writeAppFile(
      "package.json",
      JSON.stringify(
        {
          name: "consumer",
          dependencies: { "@igrp/framework-next": "0.1.0-beta.140" },
          devDependencies: { typescript: "^5.8.0" },
        },
        null,
        2
      ) + "\n"
    );
    const step: MigrationStep = {
      type: "deps.bump",
      manifest: "package.json",
      ranges: {
        "@igrp/framework-next": "0.1.0-beta.149",
        typescript: "^5.9.3",
        "not-installed-pkg": "1.0.0",
      },
    };

    const undo = executeStep(step, appRoot, payloadDir);

    const pkg = JSON.parse(readAppFile("package.json"));
    expect(pkg.dependencies["@igrp/framework-next"]).toBe("0.1.0-beta.149");
    expect(pkg.devDependencies.typescript).toBe("^5.9.3");
    expect(pkg.dependencies["not-installed-pkg"]).toBeUndefined();
    expect(undo).toEqual({
      type: "deps.bump",
      manifest: "package.json",
      ranges: { "@igrp/framework-next": "0.1.0-beta.140", typescript: "^5.8.0" },
    });
  });
});

describe("executeStep: unknown type", () => {
  it("throws on an unknown step type", () => {
    const bogus = { type: "file.rename", path: "a" } as unknown as MigrationStep;
    expect(() => executeStep(bogus, appRoot, payloadDir)).toThrow(/Unknown step type/);
  });
});

describe("executeStep rejects unimplemented patch mode cleanly", () => {
  it("throws a clear error for file.write mode=patch (no from)", () => {
    expect(() =>
      executeStep(
        { type: "file.write", path: "src/x.ts", mode: "patch", patch: "..." } as unknown as MigrationStep,
        appRoot,
        payloadDir,
      ),
    ).toThrow(/patch mode is not supported/i);
  });
});
