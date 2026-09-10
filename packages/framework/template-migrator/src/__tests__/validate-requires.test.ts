import { describe, it, expect } from "vitest";
import { validateRequires } from "../validate-requires.js";

const m = (id: string, requires: string[] = []) => ({ id, requires });

describe("validateRequires", () => {
  it("passes a valid linear chain", () => {
    expect(() => validateRequires([m("01"), m("02", ["01"]), m("03", ["02"])])).not.toThrow();
  });

  it("passes when requires is omitted", () => {
    expect(() => validateRequires([m("01"), { id: "02" }])).not.toThrow();
  });

  it("rejects a forward / unknown requirement", () => {
    expect(() => validateRequires([m("01"), m("02", ["99"])])).toThrow(/earlier|forward|unknown/i);
  });

  it("rejects a requirement on a later migration", () => {
    expect(() => validateRequires([m("01", ["02"]), m("02")])).toThrow(/earlier|forward|unknown/i);
  });

  it("rejects duplicate ids", () => {
    expect(() => validateRequires([m("01"), m("01")])).toThrow(/duplicate/i);
  });
});
