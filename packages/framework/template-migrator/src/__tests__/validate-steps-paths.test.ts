import { describe, it, expect } from "vitest";
import { validateSteps } from "../validate-steps";

const check = (path: string) => () => validateSteps("01-test", [{ type: "file.delete", path }]);

// The first version of requireAppRelative split on "/" alone, so every
// backslash form below was ACCEPTED. Each one is pinned here.
describe("requireAppRelative rejects paths that escape the app root", () => {
  it.each([
    ["../outside.ts", /must not contain/],
    ["..\\outside.ts", /must not contain/],
    ["a/../../b.ts", /must not contain/],
    ["a\\..\\..\\b.ts", /must not contain/],
    ["src/nested/../../../x.ts", /must not contain/],
  ])("rejects %s", (path, message) => {
    expect(check(path)).toThrow(message);
  });

  it.each([
    ["/etc/passwd"],
    ["//server/share/x.ts"],
    ["\\\\server\\share\\x.ts"],
    ["C:/abs/x.ts"],
    ["C:\\abs\\x.ts"],
  ])("rejects absolute/UNC %s", (path) => {
    expect(check(path)).toThrow(/must be relative to the app root/);
  });

  it.each([["src/ok.ts"], ["src\\ok.ts"], ["a/b/c.ts"], [".env.example"], ["src/..foo/x.ts"]])(
    "accepts %s",
    (path) => {
      expect(check(path)).not.toThrow();
    },
  );
});
