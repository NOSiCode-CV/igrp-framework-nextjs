import { getManifest } from "../manifest.js";
import { readLock } from "../lock.js";

export function status(appRoot: string) {
  const manifest = getManifest();
  const lock = readLock(appRoot);
  const appliedIds = new Set(lock.applied.map((a) => a.id));
  const knownIds = new Set(manifest.migrations.map((m) => m.id));

  console.log(`\nTemplate: ${manifest.template}  CLI: ${manifest.cliVersion}\n`);
  for (const m of manifest.migrations) {
    const state = appliedIds.has(m.id) ? "✓ applied" : "• pending";
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

  const pending = manifest.migrations.filter((m) => !appliedIds.has(m.id));
  const unknownNote = unknown.length > 0 ? ` (${unknown.length} from a newer CLI)` : "";
  console.log(`\n${lock.applied.length} applied${unknownNote}, ${pending.length} pending\n`);
  if (unknown.length > 0) {
    console.log("This app was migrated by a newer @igrp/template-migrator.");
    console.log("Upgrade the CLI (pnpm dlx @igrp/template-migrator@latest) before applying more.\n");
  }
}
