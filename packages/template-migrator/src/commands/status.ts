import { getManifest } from "../manifest.js";
import { readLock } from "../lock.js";

export function status(appRoot: string) {
  const manifest = getManifest();
  const lock = readLock(appRoot);
  const appliedIds = new Set(lock.applied.map((a) => a.id));

  console.log(`\nTemplate: ${manifest.template}  CLI: ${manifest.cliVersion}\n`);
  for (const m of manifest.migrations) {
    const state = appliedIds.has(m.id) ? "✓ applied" : "• pending";
    const ver = m.targetFrameworkVersion ? ` (→ ${m.targetFrameworkVersion})` : "";
    console.log(`  ${state}  ${m.id}${ver}`);
  }
  const pending = manifest.migrations.filter((m) => !appliedIds.has(m.id));
  console.log(`\n${lock.applied.length} applied, ${pending.length} pending\n`);
}
