import { getManifest } from "../manifest.js";
import { readLock } from "../lock.js";

export function plan(appRoot: string, toId?: string) {
  const manifest = getManifest();
  const lock = readLock(appRoot);
  const appliedIds = new Set(lock.applied.map((a) => a.id));
  let pending = manifest.migrations.filter((m) => !appliedIds.has(m.id));
  if (toId) {
    const idx = pending.findIndex((m) => m.id === toId);
    if (idx === -1) { console.log(`Migration ${toId} not found or already applied.`); return; }
    pending = pending.slice(0, idx + 1);
  }
  if (pending.length === 0) { console.log("Nothing to apply — already up to date."); return; }
  console.log(`\n${pending.length} migration(s) to apply:\n`);
  for (const m of pending) {
    const ver = m.targetFrameworkVersion ? ` → framework ${m.targetFrameworkVersion}` : "";
    console.log(`  ── ${m.id}${ver}`);
    for (const step of m.steps) {
      const pathKey = (step as Record<string, unknown>).path ?? (step as Record<string, unknown>).file ?? (step as Record<string, unknown>).manifest;
      console.log(`     ${step.type}  ${pathKey}`);
    }
    console.log("");
  }
}
