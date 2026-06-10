import { getManifest } from "../manifest.js";
import { readLock, writeLock } from "../lock.js";
import { executeStep } from "../apply.js";
import type { MigrationStep } from "../types.js";

function isPlaceholder(step: MigrationStep): boolean {
  const s = step as Record<string, unknown>;
  return s.from === "__undo__" || s.patch === "__undo__";
}

function stepPath(step: MigrationStep): string | undefined {
  const s = step as Record<string, unknown>;
  return typeof s.path === "string" ? s.path : undefined;
}

export async function rollback(
  appRoot: string,
  id: string,
  opts: { force?: boolean } = {}
): Promise<boolean> {
  // getManifest is called to validate CLI is set up correctly
  getManifest();
  const lock = readLock(appRoot);
  const idx = lock.applied.findIndex((a) => a.id === id);
  if (idx === -1) {
    console.log(`Migration ${id} is not applied.`);
    return false;
  }
  const entry = lock.applied[idx];

  // A placeholder undo step is only restorable if apply stored the prior
  // content in undoPayloads (newer CLI versions do — see commands/apply.ts).
  const unrestorable = entry.undo.filter((step) => {
    if (!isPlaceholder(step)) return false;
    const p = stepPath(step);
    return p === undefined || entry.undoPayloads?.[p] === undefined;
  });

  if (unrestorable.length > 0 && !opts.force) {
    console.error(`\nCannot fully roll back ${id} — no stored undo content for:`);
    for (const step of unrestorable) {
      console.error(`  - ${step.type}  ${stepPath(step) ?? "(unknown path)"}`);
    }
    console.error(
      "\nThese files were overwritten or deleted by the migration and their prior" +
        "\ncontent was not captured (lock entry written by an older CLI version)." +
        "\nRestore them manually (e.g. from git), or re-run with --force to roll back" +
        "\nthe remaining steps anyway — the files listed above will NOT be restored.\n"
    );
    return false;
  }

  console.log(`\nRolling back ${id} (${entry.undo.length} undo step(s))\n`);
  for (const step of entry.undo) {
    const pathKey =
      stepPath(step) ??
      (step as Record<string, unknown>).file ??
      (step as Record<string, unknown>).manifest;
    console.log(`  undo ${step.type}  ${pathKey}`);
    if (isPlaceholder(step)) {
      // Restored from stored payloads in Task 6 (phase 2). Until then —
      // and for steps with no stored payload under --force — skip.
      console.log("    (undo payload not stored — manual restoration required)");
      continue;
    }
    executeStep(step, appRoot);
  }
  lock.applied.splice(idx, 1);
  writeLock(appRoot, lock);
  console.log(`\n✓ ${id} rolled back\n`);
  return true;
}
