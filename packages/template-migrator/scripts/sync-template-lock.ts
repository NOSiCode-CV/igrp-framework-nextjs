// Regenerates templates/demo-v1/.igrp-migrations-lock.json from the migration
// set, so the lock the template zip ships marks every migration as applied.
//
// Run this whenever a migration is added (or its steps are corrected in place);
// the drift gate fails the release until you do. See scripts/template-lock.ts
// for why the lock has to keep pace.
//
//   pnpm --filter @igrp/template-migrator sync:template-lock
//   pnpm --filter @igrp/template-migrator sync:template-lock --check   # dry run

import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  buildTemplateLock,
  diffTemplateLock,
  isLockClean,
  loadMigrationSummaries,
  readTemplateLock,
  writeTemplateLock,
} from "./template-lock.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MIGRATIONS_DIR = join(ROOT, "migrations/demo-v1");
const TEMPLATE_LOCK = join(ROOT, "../../templates/demo-v1/.igrp-migrations-lock.json");

function main(): void {
  const checkOnly = process.argv.includes("--check");

  if (!existsSync(dirname(TEMPLATE_LOCK))) {
    console.error(`Template directory not found: ${dirname(TEMPLATE_LOCK)}`);
    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { version: string };
  const migrations = loadMigrationSummaries(MIGRATIONS_DIR);

  // Repairing a corrupt lock is squarely this script's job, so an unparsable
  // file is a rebuild-from-scratch signal rather than an error. The only cost
  // is losing the recorded appliedAt/cliVersion history, which is stated plainly.
  let existing;
  try {
    existing = readTemplateLock(TEMPLATE_LOCK);
  } catch (err) {
    if (checkOnly) {
      console.error(`✗ ${(err as Error).message}`);
      process.exit(1);
    }
    console.log(`  ! ${(err as Error).message}`);
    console.log("  ! rebuilding from scratch — recorded appliedAt/cliVersion history is lost");
    existing = null;
  }
  const diff = diffTemplateLock({ migrations, lock: existing });

  if (isLockClean(diff)) {
    console.log(`✓ Template lock already records all ${migrations.length} migration(s).`);
    return;
  }

  if (diff.missing.length > 0) {
    console.log(`  + ${diff.missing.length} migration(s) to record: ${diff.missing.join(", ")}`);
  }
  if (diff.unknown.length > 0) {
    console.log(`  - ${diff.unknown.length} stale entry(ies) to drop: ${diff.unknown.join(", ")}`);
  }
  for (const m of diff.hashMismatch) {
    console.log(`  ~ ${m.id}: hash ${m.recorded} → ${m.expected}`);
  }
  if (diff.outOfOrder) console.log("  ~ entries reordered to match migration order");

  if (checkOnly) {
    console.error("\n✗ Template lock is out of date (--check: nothing written).");
    process.exit(1);
  }

  const lock = buildTemplateLock({ migrations, existing, cliVersion: pkg.version });
  writeTemplateLock(TEMPLATE_LOCK, lock);
  console.log(`\n✓ Wrote ${lock.applied.length} applied migration(s) to ${TEMPLATE_LOCK}`);
}

main();
