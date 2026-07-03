export interface MigrationLike {
  id: string;
  requires?: string[];
}

/**
 * Pack-time guard: migration ids must be unique, and every `requires` entry must
 * resolve to a strictly earlier migration in the (file-ordered) list.
 *
 * `apply` executes migrations in file order and only *checks* `requires` against
 * already-applied ids — it does not topologically reorder. So a `requires` that
 * points forward, at a typo, or at an unknown id would ship in the manifest and
 * permanently deadlock `apply` on a fresh consumer app (it reaches the migration,
 * sees the requirement unapplied, and aborts). Catch it here, at pack time.
 */
export function validateRequires(migrations: MigrationLike[]): void {
  const seen = new Set<string>();
  for (const { id, requires = [] } of migrations) {
    if (seen.has(id)) {
      throw new Error(`Duplicate migration id: ${id}`);
    }
    for (const req of requires) {
      if (!seen.has(req)) {
        throw new Error(
          `Migration ${id} requires "${req}", which is not an earlier migration (forward reference, typo, or unknown id).`,
        );
      }
    }
    seen.add(id);
  }
}
