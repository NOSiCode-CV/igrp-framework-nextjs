import { createInterface } from "readline";
import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { getManifest } from "../manifest.js";
import { readLock, writeLock } from "../lock.js";
import { executeStep } from "../apply.js";
import { hashFile } from "../hash.js";
import { clearJournal, readJournal, writeJournal, type Journal } from "../journal.js";
import { unwindSteps } from "../unwind.js";
import type { LockEntry, MigrationStep } from "../types.js";

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} [y/N] `, (answer) => { rl.close(); resolve(answer.toLowerCase() === "y"); });
  });
}

export async function apply(
  appRoot: string,
  opts: { toId?: string; yes?: boolean; payloadDir?: string }
) {
  const manifest = getManifest();

  // A journal on disk means a previous run died mid-migration (signal, crash,
  // CI timeout) after mutating files but before recording them. Put the tree
  // back before doing anything else: without this the migration re-runs and
  // captures its undo baseline from already-migrated files, which silently
  // makes a later rollback restore the wrong content. See journal.ts.
  const pendingJournal = readJournal(appRoot);
  if (pendingJournal) {
    console.log(`\nRecovering from an interrupted run of ${pendingJournal.id}...`);
    const { reverted, failures } = unwindSteps(
      pendingJournal.undo,
      pendingJournal.undoPayloads ?? {},
      appRoot,
      opts.payloadDir,
    );
    console.log(`  reverted ${reverted} step(s) from the interrupted migration`);
    for (const failure of failures) console.error(`  ✗ ${failure}`);
    if (failures.length > 0) {
      console.error("\n  Recovery was incomplete — restore the listed paths (e.g. from git)");
      console.error("  before re-running, or the migration may record a wrong undo baseline.\n");
      return;
    }
    clearJournal(appRoot);
    console.log("  ✓ recovered\n");
  }

  const lock = readLock(appRoot);
  // Self-heal: stamp the current template identifier so apps migrated under an
  // older identifier (e.g. the former "demo-legacy") converge on the current one.
  // The field is cosmetic (only printed by `status`), so this is purely tidiness.
  lock.template = manifest.template;
  const appliedIds = new Set(lock.applied.map((a) => a.id));
  let pending = manifest.migrations.filter((m) => !appliedIds.has(m.id));
  if (opts.toId) {
    const idx = pending.findIndex((m) => m.id === opts.toId);
    if (idx === -1) { console.log(`Migration ${opts.toId} not found or already applied.`); return; }
    pending = pending.slice(0, idx + 1);
  }
  if (pending.length === 0) { console.log("Nothing to apply — already up to date."); return; }

  console.log(`\nApplying ${pending.length} migration(s) to ${appRoot}\n`);
  // .env files that actually gained keys during this run, for the closing hint.
  const envFilesTouched = new Set<string>();
  for (const migration of pending) {
    const ver = migration.targetFrameworkVersion ? ` (→ framework ${migration.targetFrameworkVersion})` : "";
    console.log(`── ${migration.id}${ver}`);
    const missingReqs = (migration.requires ?? []).filter((r) => !appliedIds.has(r));
    if (missingReqs.length > 0) {
      console.error(`  ✗ ${migration.id} requires unapplied migration(s): ${missingReqs.join(", ")}`);
      console.error("  Aborting — apply the prerequisite(s) first.");
      return;
    }
    if (!opts.yes) {
      const ok = await confirm(`  Apply ${migration.steps.length} step(s)?`);
      if (!ok) { console.log("  Skipped.\n"); continue; }
    }

    const fileHashes: Record<string, string> = {};
    const undoPayloads: Record<string, string> = {};
    const undoSteps: MigrationStep[] = [];
    // Opened before the first step and cleared only once the lock entry is
    // persisted, so an interruption anywhere in between is recoverable.
    const journal: Journal = {
      version: 1,
      id: migration.id,
      startedAt: new Date().toISOString(),
      cliVersion: manifest.cliVersion,
      undo: undoSteps,
      undoPayloads,
    };
    writeJournal(appRoot, journal);
    try {
      for (const step of migration.steps) {
        const pathKey = (step as Record<string, unknown>).path ?? (step as Record<string, unknown>).file ?? (step as Record<string, unknown>).manifest;
        if (pathKey && typeof pathKey === "string") {
          const hash = hashFile(join(appRoot, pathKey));
          if (hash) fileHashes[pathKey] = hash;
        }
        // Capture prior content for steps whose undo would otherwise be an
        // unrestorable __undo__ placeholder: an overwrite of an existing file,
        // or a delete. (A file.create over nothing undoes cleanly via delete.)
        if (
          (step.type === "file.write" || step.type === "file.delete" || step.type === "file.create") &&
          typeof (step as { path?: unknown }).path === "string"
        ) {
          const path = (step as { path: string }).path;
          const target = join(appRoot, path);
          // First capture wins: if a migration touches the same path twice,
          // later captures would hold intermediate migrated content, not the
          // true pre-migration original. Directories are never captured
          // (file.delete may target one) — they fall into the rollback
          // refusal path, which is correct.
          if (!(path in undoPayloads) && existsSync(target) && statSync(target).isFile()) {
            undoPayloads[path] = readFileSync(target, "utf8");
          }
        }
        const undo = executeStep(step, appRoot, opts.payloadDir);
        undoSteps.push(undo);
        // env.add's undo lists exactly the keys it appended — a non-empty list
        // means this file really did gain keys (already-present ones are skipped).
        if (undo.type === "env.remove" && undo.keys.length > 0) {
          envFilesTouched.add(undo.file);
        }
        // Persist progress after every step — `undo`/`undoPayloads` are the same
        // objects the journal holds, so this snapshots what has run so far.
        writeJournal(appRoot, journal);
        console.log(`  ✓ ${step.type}  ${pathKey}`);
      }
    } catch (err) {
      console.error(`  ✗ Error: ${(err as Error).message}`);
      // Transactional unwind: reverse the steps that already ran THIS migration
      // so disk returns to its pre-migration state. Without this, a re-run
      // re-captures undo baselines from already-mutated files, silently
      // corrupting the recorded "original" content used by rollback.
      const { failures } = unwindSteps(undoSteps, undoPayloads, appRoot, opts.payloadDir);
      for (const failure of failures) console.error(`  ✗ Unwind step failed: ${failure}`);
      clearJournal(appRoot);
      console.error("  Migration aborted and rolled back. Fix the cause, then re-run.");
      return;
    }

    const entry: LockEntry = {
      id: migration.id,
      appliedAt: new Date().toISOString(),
      cliVersion: manifest.cliVersion,
      manifestHash: migration.contentHash,
      undo: undoSteps,
      fileHashes,
      ...(Object.keys(undoPayloads).length > 0 ? { undoPayloads } : {}),
    };
    lock.applied.push(entry);
    writeLock(appRoot, lock);
    // The migration is now durably recorded — the journal has served its purpose.
    clearJournal(appRoot);
    appliedIds.add(migration.id);
    console.log(`  ✓ done\n`);
  }

  console.log("All done.\n");
  console.log("Next steps:");
  console.log("  pnpm install");
  if (envFilesTouched.size > 0) {
    // Migrations only ever write .env.example — the real .env holds secrets, is
    // gitignored, and never ships in the template zip. So new keys land in the
    // example file and the running app still lacks them until someone copies
    // them across. Say so, or the next boot fails for a non-obvious reason.
    const files = [...envFilesTouched].sort().join(", ");
    console.log(`  # ${files} gained new keys — copy any you need into your .env`);
    console.log("  #   (values without defaults, e.g. client IDs/secrets, must be filled in)");
  }
  // console.log("  # (pnpm build:framework if inside the monorepo)\n");
}
