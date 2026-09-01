import { describe, it, expect } from "vitest";
import { hashContent, hashFile } from "../hash";

describe("hashContent", () => {
  it("returns a 16-char hex digest", () => {
    expect(hashContent("hello")).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is deterministic for the same input", () => {
    expect(hashContent("same")).toBe(hashContent("same"));
  });

  it("differs for different input", () => {
    expect(hashContent("a")).not.toBe(hashContent("b"));
  });
});

describe("hashFile", () => {
  it("returns null for a missing file", () => {
    expect(hashFile("Z:/definitely/not/a/real/file.txt")).toBeNull();
  });
});
