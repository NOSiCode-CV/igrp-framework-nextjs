import { getManifest } from "../manifest.js";
import { readLock } from "../lock.js";

export function check(appRoot: string): boolean {
  const manifest = getManifest();
  const lock = readLock(appRoot);
  const appliedIds = new Set(lock.applied.map((a) => a.id));
  const pending = manifest.migrations.filter((m) => !appliedIds.has(m.id));
  if (pending.length > 0) {
    console.error(`\n✗ ${pending.length} migration(s) not applied:\n`);
    for (const m of pending) console.error(`  • ${m.id}`);
    console.error("\nRun: pnpm dlx @igrp/template-migrator apply\n");
    return false;
  }
  console.log("✓ All migrations applied.");
  return true;
}
