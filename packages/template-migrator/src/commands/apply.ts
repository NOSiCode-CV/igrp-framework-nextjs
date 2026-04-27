import { createInterface } from "readline";
import { join } from "path";
import { getManifest } from "../manifest.js";
import { readLock, writeLock } from "../lock.js";
import { executeStep } from "../apply.js";
import { hashFile } from "../hash.js";
import type { LockEntry } from "../types.js";

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} [y/N] `, (answer) => { rl.close(); resolve(answer.toLowerCase() === "y"); });
  });
}

export async function apply(appRoot: string, opts: { toId?: string; yes?: boolean }) {
  const manifest = getManifest();
  const lock = readLock(appRoot);
  const appliedIds = new Set(lock.applied.map((a) => a.id));
  let pending = manifest.migrations.filter((m) => !appliedIds.has(m.id));
  if (opts.toId) {
    const idx = pending.findIndex((m) => m.id === opts.toId);
    if (idx === -1) { console.log(`Migration ${opts.toId} not found or already applied.`); return; }
    pending = pending.slice(0, idx + 1);
  }
  if (pending.length === 0) { console.log("Nothing to apply — already up to date."); return; }

  console.log(`\nApplying ${pending.length} migration(s) to ${appRoot}\n`);
  for (const migration of pending) {
    const ver = migration.targetFrameworkVersion ? ` (→ framework ${migration.targetFrameworkVersion})` : "";
    console.log(`── ${migration.id}${ver}`);
    if (!opts.yes) {
      const ok = await confirm(`  Apply ${migration.steps.length} step(s)?`);
      if (!ok) { console.log("  Skipped.\n"); continue; }
    }

    const fileHashes: Record<string, string> = {};
    const undoSteps: ReturnType<typeof executeStep>[] = [];
    try {
      for (const step of migration.steps) {
        const pathKey = (step as Record<string, unknown>).path ?? (step as Record<string, unknown>).file ?? (step as Record<string, unknown>).manifest;
        if (pathKey && typeof pathKey === "string") {
          const hash = hashFile(join(appRoot, pathKey));
          if (hash) fileHashes[pathKey] = hash;
        }
        const undo = executeStep(step, appRoot);
        undoSteps.push(undo);
        console.log(`  ✓ ${step.type}  ${pathKey}`);
      }
    } catch (err) {
      console.error(`  ✗ Error: ${(err as Error).message}`);
      console.error("  Migration aborted. Run again to resume.");
      return;
    }

    const entry: LockEntry = {
      id: migration.id,
      appliedAt: new Date().toISOString(),
      cliVersion: manifest.cliVersion,
      manifestHash: migration.contentHash,
      undo: undoSteps,
      fileHashes,
    };
    lock.applied.push(entry);
    writeLock(appRoot, lock);
    console.log(`  ✓ done\n`);
  }

  console.log("All done.\n");
  console.log("Next steps:");
  console.log("  pnpm install");
  // console.log("  # (pnpm build:framework if inside the monorepo)\n");
}
