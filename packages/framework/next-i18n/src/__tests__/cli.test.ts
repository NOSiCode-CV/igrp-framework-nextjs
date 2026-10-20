import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { main } from "../main.js";

afterEach(() => vi.restoreAllMocks());

describe("main", () => {
  it("does not swallow the path after an unknown flag", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(main(["check-literals", "src/a", "--verbose", "src/b"])).toBe(2);
  });

  it("accepts --name=value", () => {
    const d = mkdtempSync(join(tmpdir(), "igrp-cli-"));
    writeFileSync(join(d, "pt.json"), '{"a":"x"}');
    vi.spyOn(console, "log").mockImplementation(() => {});
    expect(main(["check-catalogs", d, "--default=pt"])).toBe(0);
  });

  it("prints error and returns 2 when a command throws", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(main(["check-literals", join(tmpdir(), "igrp-missing-xyz")])).toBe(
      2,
    );
    expect(String(err.mock.calls[0]?.[0])).toMatch(/^error /);
  });
});
