/** Numeric-prefix sort for `NN.MIGRATIONS-*.md` files, so 9 < 10 < 100. */
export function sortMigrationFiles(files: string[]): string[] {
  return [...files].sort((a, b) => {
    const na = Number.parseInt(a, 10);
    const nb = Number.parseInt(b, 10);
    if (Number.isNaN(na) || Number.isNaN(nb)) return a.localeCompare(b);
    // Same number (two "47"s): fall back to the name, or the order is whatever readdir gives on this OS.
    return na - nb || (a < b ? -1 : a > b ? 1 : 0);
  });
}
