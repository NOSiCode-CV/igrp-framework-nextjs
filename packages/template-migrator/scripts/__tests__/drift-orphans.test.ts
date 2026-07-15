import { describe, expect, it } from "vitest";
import { findOrphanFiles, TEMPLATE_EXEMPT_FILES, TEMPLATE_EXEMPT_PREFIXES } from "../drift-orphans.js";

describe("findOrphanFiles", () => {
  it("flags a template file not managed, not baselined, not exempt", () => {
    const { orphans } = findOrphanFiles({
      templateFiles: ["src/lib/new-helper.ts"],
      managedPaths: [],
      baseline: [],
    });
    expect(orphans).toEqual(["src/lib/new-helper.ts"]);
  });

  it("does not flag migration-managed paths", () => {
    const { orphans } = findOrphanFiles({
      templateFiles: ["src/middleware.ts"],
      managedPaths: ["src/middleware.ts"],
      baseline: [],
    });
    expect(orphans).toEqual([]);
  });

  it("does not flag baselined paths", () => {
    const { orphans } = findOrphanFiles({
      templateFiles: ["src/lib/utils.ts"],
      managedPaths: [],
      baseline: ["src/lib/utils.ts"],
    });
    expect(orphans).toEqual([]);
  });

  it("does not flag files under exempt prefixes", () => {
    const { orphans } = findOrphanFiles({
      templateFiles: ["docs/NEW_GUIDE.md", "specs/2026-07-09-thing.md", ".github/workflows/ci.yml"],
      managedPaths: [],
      baseline: [],
    });
    expect(orphans).toEqual([]);
  });

  it("does not flag exact-path exempt files", () => {
    const { orphans } = findOrphanFiles({
      templateFiles: ["CLAUDE.md", "CHANGELOG.md", ".igrp-migrations-lock.json"],
      managedPaths: [],
      baseline: [],
    });
    expect(orphans).toEqual([]);
  });

  it("an exempt prefix must match a full path segment, not a name prefix", () => {
    const { orphans } = findOrphanFiles({
      templateFiles: ["docs-site/page.tsx"],
      managedPaths: [],
      baseline: [],
    });
    expect(orphans).toEqual(["docs-site/page.tsx"]);
  });

  it("normalises Windows separators on every input", () => {
    const { orphans } = findOrphanFiles({
      templateFiles: ["src\\app\\page.tsx", "src\\lib\\brand-new.ts"],
      managedPaths: ["src/app/page.tsx"],
      baseline: [],
    });
    expect(orphans).toEqual(["src/lib/brand-new.ts"]);
  });

  it("returns orphans sorted", () => {
    const { orphans } = findOrphanFiles({
      templateFiles: ["z.ts", "a.ts", "m.ts"],
      managedPaths: [],
      baseline: [],
    });
    expect(orphans).toEqual(["a.ts", "m.ts", "z.ts"]);
  });

  it("reports baseline entries the template no longer has as stale", () => {
    const { staleBaseline } = findOrphanFiles({
      templateFiles: ["src/kept.ts"],
      managedPaths: [],
      baseline: ["src/kept.ts", "src/removed.ts"],
    });
    expect(staleBaseline).toEqual(["src/removed.ts"]);
  });

  it("does not report managed baseline entries as stale even if absent from the template", () => {
    // A migration deletes the file — its absence is intentional, not stale.
    const { staleBaseline } = findOrphanFiles({
      templateFiles: [],
      managedPaths: ["src/deleted-by-migration.ts"],
      baseline: ["src/deleted-by-migration.ts"],
    });
    expect(staleBaseline).toEqual([]);
  });

  it("exports exemption lists that cover the non-shipped and docs paths", () => {
    expect(TEMPLATE_EXEMPT_PREFIXES).toContain("docs/");
    expect(TEMPLATE_EXEMPT_PREFIXES).toContain("create-template/");
    expect(TEMPLATE_EXEMPT_FILES).toContain("CLAUDE.md");
  });
});
