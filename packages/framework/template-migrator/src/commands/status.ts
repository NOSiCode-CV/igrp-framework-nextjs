import { getManifest } from "../manifest.js";
import { readLock } from "../lock.js";

export function status(appRoot: string) {
  const manifest = getManifest();
  const lock = readLock(appRoot);
  const appliedById = new Map(lock.applied.map((a) => [a.id, a]));
  const appliedIds = new Set(appliedById.keys());
  const knownIds = new Set(manifest.migrations.map((m) => m.id));

  console.log(`\nTemplate: ${manifest.template}  CLI: ${manifest.cliVersion}\n`);
  for (const m of manifest.migrations) {
    const entry = appliedById.get(m.id);
    // An applied migration whose steps were corrected in place after release:
    // this app has the OLD result and nothing else would ever say so.
    const stale = entry !== undefined && entry.manifestHash !== m.contentHash;
    const state = stale ? "! changed " : entry ? "✓ applied" : "• pending";
    const ver = m.targetFrameworkVersion ? ` (→ ${m.targetFrameworkVersion})` : "";
    console.log(`  ${state}  ${m.id}${ver}`);
  }

  // Entries this CLI doesn't ship — the app was migrated by a newer version.
  // They must be listed, not just silently folded into the count, or the total
  // disagrees with the rows above and the user can't tell why.
  const unknown = lock.applied.filter((a) => !knownIds.has(a.id));
  for (const a of unknown) {
    console.log(`  ? unknown  ${a.id} (applied by CLI ${a.cliVersion})`);
  }

  const changed = manifest.migrations.filter((m) => {
    const e = appliedById.get(m.id);
    return e !== undefined && e.manifestHash !== m.contentHash;
  });

  const pending = manifest.migrations.filter((m) => !appliedIds.has(m.id));
  const unknownNote = unknown.length > 0 ? ` (${unknown.length} from a newer CLI)` : "";
  console.log(`\n${lock.applied.length} applied${unknownNote}, ${pending.length} pending\n`);
  if (changed.length > 0) {
    console.log(`! ${changed.length} applied migration(s) changed after they were applied:`);
    for (const m of changed) console.log(`    ${m.id}`);
    console.log("  Check the guide for what changed — re-applying is a manual step.");
    console.log("");
  }
  if (unknown.length > 0) {
    console.log("This app was migrated by a newer @igrp/template-migrator.");
    console.log("Upgrade the CLI (pnpm dlx @igrp/template-migrator@latest) before applying more.\n");
  }
}
