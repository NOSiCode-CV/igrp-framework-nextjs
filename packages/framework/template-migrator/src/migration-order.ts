/** Numeric-prefix sort for `NN.MIGRATIONS-*.md` files, so 9 < 10 < 100. */
export function sortMigrationFiles(files: string[]): string[] {
  return [...files].sort((a, b) => {
    const na = Number.parseInt(a, 10);
    const nb = Number.parseInt(b, 10);
    if (Number.isNaN(na) || Number.isNaN(nb)) return a.localeCompare(b);
    return na - nb;
  });
}
