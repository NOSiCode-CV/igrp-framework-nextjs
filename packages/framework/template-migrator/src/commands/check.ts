import { getManifest } from "../manifest.js";
import { readLock } from "../lock.js";
import { staleCause } from "../hash.js";

/**
 * CI gate: the app must be on the current migration set.
 *
 * Two ways to fail it. Pending migrations are the obvious one. The other is an
 * applied migration whose steps or payloads have changed since: migrations do get corrected
 * in place and republished, and an app that applied the old version has the old
 * result with nothing to tell it so. `contentHash` was already recorded on both
 * sides for exactly this comparison — it just was never made.
 */
export function check(appRoot: string): boolean {
  const manifest = getManifest();
  const lock = readLock(appRoot);
  const appliedById = new Map(lock.applied.map((a) => [a.id, a]));
  const pending = manifest.migrations.filter((m) => !appliedById.has(m.id));
  const stale = manifest.migrations.filter((m) => staleCause(appliedById.get(m.id), m) !== null);
  const payloadOnly = new Set(
    stale.filter((m) => staleCause(appliedById.get(m.id), m) === "payload").map((m) => m.id),
  );

  if (pending.length === 0 && stale.length === 0) {
    console.log("✓ All migrations applied.");
    return true;
  }

  if (pending.length > 0) {
    console.error(`\n✗ ${pending.length} migration(s) not applied:\n`);
    for (const m of pending) console.error(`  • ${m.id}`);
  }
  if (stale.length > 0) {
    console.error(`\n✗ ${stale.length} applied migration(s) have changed since they were applied:\n`);
    for (const m of stale) console.error(`  • ${m.id}${payloadOnly.has(m.id) ? " (payload files only)" : ""}`);
    if (payloadOnly.size < stale.length) {
      console.error(`\n  Re-applying is not automatic: remove the lock entry (or roll the migration`);
      console.error("  back) and run apply again, after checking what changed in the guide.");
    }
    if (payloadOnly.size > 0) {
      // Rollback's edit guard compares against the NEW payload, which these
      // files cannot match — it would always refuse.
      console.error("\n  For a payload-only change, do not roll back: remove the migration's entry");
      console.error("  from .igrp-migrations-lock.json and run apply again, after checking the guide.");
    }
  }
  // Only when there is something `apply` would act on. It filters out ids the
  // lock already records, so a stale-but-applied migration is skipped entirely
  // — printing this unconditionally told CI to run a no-op, two lines after
  // saying that re-applying is not automatic.
  if (pending.length > 0) {
    console.error(`\nRun: pnpm dlx @igrp/template-migrator apply\n`);
  } else {
    console.error("");
  }
  return false;
}
