import { describe, it, expect } from "vitest";
import { sortMigrationFiles } from "../migration-order";

describe("sortMigrationFiles", () => {
  it("orders by numeric prefix, not lexicographically", () => {
    const input = ["10.MIGRATIONS-x.md", "2.MIGRATIONS-x.md", "100.MIGRATIONS-x.md", "9.MIGRATIONS-x.md"];
    expect(sortMigrationFiles(input)).toEqual([
      "2.MIGRATIONS-x.md", "9.MIGRATIONS-x.md", "10.MIGRATIONS-x.md", "100.MIGRATIONS-x.md",
    ]);
  });
});
