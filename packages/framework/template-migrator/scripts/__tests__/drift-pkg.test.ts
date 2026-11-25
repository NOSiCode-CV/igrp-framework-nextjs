import { describe, expect, it } from "vitest";
import { findPkgFieldDrift, foldPkgSteps } from "../drift-pkg.js";

const template = {
  name: "@igrp/framework-next-template",
  description: "igrp template",
  displayName: "igrp template",
  version: "0.2.0-beta.8",
  engines: { node: ">=24" },
  scripts: { dev: "node scripts/dev.mjs", test: "vitest run", "publish:template": "pwsh x.ps1" },
  dependencies: { next: "15.5.29" },
};

describe("findPkgFieldDrift", () => {
  it("is clean when pkg.set steps carry every field but name, description, displayName, deps and publish:template", () => {
    const expected = foldPkgSteps([
      { fields: { version: "0.2.0-beta.7", engines: { node: ">=24" }, scripts: { dev: "next dev", old: "x" } } },
      { fields: { version: "0.2.0-beta.8", scripts: { dev: "node scripts/dev.mjs", test: "vitest run", old: null } } },
    ]);
    expect(findPkgFieldDrift({ template, expected })).toEqual([]);
  });

  it("names a new script, a changed field and a field the template dropped", () => {
    const expected = foldPkgSteps([
      { fields: { version: "0.2.0-beta.7", license: "MIT", engines: { node: ">=24" }, scripts: { dev: "node scripts/dev.mjs" } } },
    ]);
    expect(findPkgFieldDrift({ template, expected })).toEqual([
      { field: "license", template: undefined, expected: "MIT" },
      { field: "scripts.test", template: "vitest run", expected: undefined },
      { field: "version", template: "0.2.0-beta.8", expected: "0.2.0-beta.7" },
    ]);
  });
});
