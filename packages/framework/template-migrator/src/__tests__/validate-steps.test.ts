import { describe, it, expect } from "vitest";
import { validateSteps } from "../validate-steps";

const ok = (steps: unknown[]) => () => validateSteps("01-test", steps);

describe("validateSteps", () => {
  it("accepts the step shapes migrations actually use", () => {
    expect(
      ok([
        { type: "file.create", path: "src/a.ts", from: "payload/01/src/a.ts" },
        { type: "file.write", mode: "replace", path: "src/b.ts", from: "payload/01/src/b.ts" },
        { type: "file.delete", path: "src/c.ts" },
        { type: "env.add", file: ".env.example", keys: { KEY: { doc: "why" } } },
        { type: "env.remove", file: ".env.example", keys: ["KEY"] },
        { type: "deps.bump", manifest: "package.json", ranges: { pkg: "1.0.0" } },
        { type: "deps.remove", manifest: "package.json", deps: ["pkg"] },
        { type: "deps.restore", manifest: "package.json", removed: {} },
      ]),
    ).not.toThrow();
  });

  it("rejects file.write patch mode, which executeStep throws on at apply time", () => {
    expect(ok([{ type: "file.write", mode: "patch", path: "src/a.ts", patch: "..." }])).toThrow(
      /mode "patch" is not supported/,
    );
  });

  it("rejects a file step with no payload", () => {
    expect(ok([{ type: "file.write", mode: "replace", path: "src/a.ts" }])).toThrow(
      /"from" must be a non-empty string/,
    );
  });

  it("rejects an unknown step type", () => {
    expect(ok([{ type: "file.move", path: "src/a.ts" }])).toThrow(/unknown step type "file.move"/);
  });

  it("rejects a path that escapes the app root", () => {
    expect(ok([{ type: "file.delete", path: "../outside.ts" }])).toThrow(/must not contain/);
    expect(ok([{ type: "file.delete", path: "/etc/passwd" }])).toThrow(/must be relative/);
  });

  it("rejects an env key with no doc", () => {
    expect(ok([{ type: "env.add", file: ".env.example", keys: { KEY: {} } }])).toThrow(
      /"doc" must be a non-empty string/,
    );
  });

  it("rejects an empty step list", () => {
    expect(ok([])).toThrow(/non-empty array/);
  });
});
