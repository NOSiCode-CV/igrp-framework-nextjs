import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copyPayloadFile, isBinary, toLf } from "../payload-copy.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "igrp-payload-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("toLf", () => {
  it("converts CRLF to LF", () => {
    expect(toLf("a\r\nb\r\n")).toBe("a\nb\n");
  });

  it("converts lone CR to LF", () => {
    expect(toLf("a\rb")).toBe("a\nb");
  });

  it("leaves LF-only content untouched", () => {
    expect(toLf("a\nb\n")).toBe("a\nb\n");
  });
});

describe("isBinary", () => {
  it("treats content with a NUL byte as binary", () => {
    expect(isBinary(Buffer.from([0x89, 0x50, 0x00, 0x4e]))).toBe(true);
  });

  it("treats normal source text as text", () => {
    expect(isBinary(Buffer.from("export const a = 1;\r\n", "utf8"))).toBe(false);
  });

  it("treats an empty file as text", () => {
    expect(isBinary(Buffer.alloc(0))).toBe(false);
  });

  it("ignores a NUL that appears beyond the sniff window", () => {
    const buf = Buffer.concat([Buffer.alloc(9000, 0x61), Buffer.from([0x00])]);
    expect(isBinary(buf)).toBe(false);
  });
});

describe("copyPayloadFile", () => {
  it("normalises a CRLF payload to LF and reports that it did", () => {
    const src = join(dir, "src.ts");
    const dest = join(dir, "out", "src.ts");
    writeFileSync(src, "const a = 1;\r\nconst b = 2;\r\n");

    expect(copyPayloadFile(src, dest)).toBe(true);
    expect(readFileSync(dest, "utf8")).toBe("const a = 1;\nconst b = 2;\n");
  });

  it("copies an already-LF payload unchanged and reports no normalisation", () => {
    const src = join(dir, "src.ts");
    const dest = join(dir, "out", "src.ts");
    writeFileSync(src, "const a = 1;\n");

    expect(copyPayloadFile(src, dest)).toBe(false);
    expect(readFileSync(dest, "utf8")).toBe("const a = 1;\n");
  });

  it("copies binary payloads byte-for-byte, never rewriting them", () => {
    // A PNG header contains 0x0D 0x0A — a CRLF that must survive verbatim.
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff]);
    const src = join(dir, "logo.png");
    const dest = join(dir, "out", "logo.png");
    writeFileSync(src, png);

    expect(copyPayloadFile(src, dest)).toBe(false);
    expect(readFileSync(dest).equals(png)).toBe(true);
  });

  it("creates missing destination directories", () => {
    const src = join(dir, "src.ts");
    const dest = join(dir, "deep", "nested", "src.ts");
    writeFileSync(src, "x\r\n");

    copyPayloadFile(src, dest);
    expect(readFileSync(dest, "utf8")).toBe("x\n");
  });

  it("is idempotent — re-copying an already-normalised file changes nothing", () => {
    const src = join(dir, "src.ts");
    const dest = join(dir, "out", "src.ts");
    writeFileSync(src, "a\r\nb\r\n");

    copyPayloadFile(src, dest);
    const first = readFileSync(dest);
    copyPayloadFile(src, dest);
    expect(readFileSync(dest).equals(first)).toBe(true);
  });

  it("makes CRLF and LF sources produce identical output", () => {
    // The point of the whole exercise: whoever authored the payload, and on
    // whatever OS, consumers receive the same bytes.
    mkdirSync(join(dir, "a"));
    mkdirSync(join(dir, "b"));
    writeFileSync(join(dir, "a", "f.ts"), "x = 1;\r\ny = 2;\r\n");
    writeFileSync(join(dir, "b", "f.ts"), "x = 1;\ny = 2;\n");

    copyPayloadFile(join(dir, "a", "f.ts"), join(dir, "outA", "f.ts"));
    copyPayloadFile(join(dir, "b", "f.ts"), join(dir, "outB", "f.ts"));

    expect(readFileSync(join(dir, "outA", "f.ts")).equals(readFileSync(join(dir, "outB", "f.ts")))).toBe(true);
  });
});
