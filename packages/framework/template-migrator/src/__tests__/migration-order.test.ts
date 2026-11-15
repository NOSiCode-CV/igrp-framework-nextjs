import { describe, it, expect } from "vitest";
import { sortMigrationFiles } from "../migration-order";

describe("sortMigrationFiles", () => {
  it("orders by numeric prefix, not lexicographically", () => {
    const input = ["10.MIGRATIONS-x.md", "2.MIGRATIONS-x.md", "100.MIGRATIONS-x.md", "9.MIGRATIONS-x.md"];
    expect(sortMigrationFiles(input)).toEqual([
      "2.MIGRATIONS-x.md", "9.MIGRATIONS-x.md", "10.MIGRATIONS-x.md", "100.MIGRATIONS-x.md",
    ]);
  });

  it("breaks a shared number by name, whatever order the directory listed them in", () => {
    const a = "47.MIGRATIONS-24092026.md";
    const b = "47.MIGRATIONS-25092026.md";
    expect(sortMigrationFiles([b, a, "48.MIGRATIONS-x.md"])).toEqual([a, b, "48.MIGRATIONS-x.md"]);
    expect(sortMigrationFiles([a, b])).toEqual([a, b]);
  });
});
