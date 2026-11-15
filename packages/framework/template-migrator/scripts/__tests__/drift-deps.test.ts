import { describe, expect, it } from "vitest";
import { findUnpinnedDepDrift, unpinnedDeps } from "../drift-deps.js";

describe("findUnpinnedDepDrift", () => {
  const templateDeps = {
    "@igrp/framework-next": "workspace:*",
    next: "15.5.28",
    "next-intl": "^4.14.0",
    typescript: "5.9.3",
  };

  it("passes deps that are pinned, workspace-linked, or match the baseline", () => {
    expect(
      findUnpinnedDepDrift({ templateDeps, pinned: new Set(["next", "next-intl"]), baseline: { typescript: "5.9.3" } }),
    ).toEqual([]);
  });

  it("flags an unpinned dep missing from the baseline and one whose range moved", () => {
    expect(
      findUnpinnedDepDrift({ templateDeps, pinned: new Set(["next"]), baseline: { typescript: "5.9.2" } }),
    ).toEqual([
      { dep: "next-intl", declared: "^4.14.0", baseline: null },
      { dep: "typescript", declared: "5.9.3", baseline: "5.9.2" },
    ]);
  });

  it("flags a baseline entry the template no longer declares", () => {
    expect(
      findUnpinnedDepDrift({
        templateDeps,
        pinned: new Set(["next", "next-intl"]),
        baseline: { typescript: "5.9.3", zod: "^4.0.0" },
      }),
    ).toEqual([{ dep: "zod", declared: null, baseline: "^4.0.0" }]);
  });

  it("ignores a baseline entry the template still declares but a migration now pins", () => {
    expect(
      findUnpinnedDepDrift({
        templateDeps,
        pinned: new Set(["next", "next-intl", "typescript"]),
        baseline: { typescript: "5.9.2" },
      }),
    ).toEqual([]);
  });

  it("leaves a pinned dep the template dropped to the pin check", () => {
    expect(
      findUnpinnedDepDrift({
        templateDeps,
        pinned: new Set(["next", "next-intl", "zod"]),
        baseline: { typescript: "5.9.3", zod: "^4.0.0" },
      }),
    ).toEqual([]);
  });

  it("records only unpinned, non-workspace deps for the baseline", () => {
    expect(unpinnedDeps(templateDeps, new Set(["next"]))).toEqual({ "next-intl": "^4.14.0", typescript: "5.9.3" });
  });
});
