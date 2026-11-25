import { createInterface } from "readline";
import { readFileSync, statSync } from "fs";
import { join } from "path";
import { getManifest } from "../manifest.js";
import { readLock, writeLock } from "../lock.js";
import { assertInsideAppRoot, executeStep, resolvePayload } from "../apply.js";
import { hashFileIgnoringEol } from "../hash.js";
import { clearJournal, journalPath, readJournal, writeJournal, type Journal } from "../journal.js";
import { encodeUndoPayload, unwindSteps } from "../unwind.js";
import type { LockEntry, MigrationStep } from "../types.js";

/** The journal is kept on a failed unwind, so the user must clear it once the tree is restored. */
function reportIncompleteUnwind(appRoot: string, what: string): void {
  console.error(`\n  ${what} was incomplete — restore the listed paths (e.g. from git),`);
  console.error(`  then delete ${journalPath(appRoot)} before re-running,`);
  console.error("  or the migration may record a wrong undo baseline.\n");
}

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} [y/N] `, (answer) => { rl.close(); resolve(answer.toLowerCase() === "y"); });
  });
}

export async function apply(
  appRoot: string,
  opts: { toId?: string; yes?: boolean; force?: boolean; payloadDir?: string }
): Promise<boolean> {
  const manifest = getManifest();

  // Read the lock BEFORE any recovery: a legacy lock must abort while the tree
  // is still untouched, and the recovery decision below depends on what the
  // lock already records.
  const lock = readLock(appRoot);

  // A journal on disk means a previous run died mid-migration (signal, crash,
  // CI timeout) after mutating files but before recording them. Put the tree
  // back before doing anything else: without this the migration re-runs over
  // already-migrated files. See journal.ts.
  let pendingJournal;
  try {
    pendingJournal = readJournal(appRoot);
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    return false;
  }
  if (pendingJournal && lock.applied.some((a) => a.id === pendingJournal.id)) {
    // The lock ALREADY records this migration, so the run died in the narrow
    // window between `writeLock` and `clearJournal` — after the migration had
    // fully succeeded. Unwinding here would revert the files while leaving the
    // lock claiming the migration applied: `apply` would then report "nothing
    // to apply", `check` would pass, and the app would silently lack the
    // migration forever. The journal is stale, not a recovery signal.
    clearJournal(appRoot);
  } else if (pendingJournal) {
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
      reportIncompleteUnwind(appRoot, "Recovery");
      return false;
    }
    clearJournal(appRoot);
    console.log("  ✓ recovered\n");
  }

  // Self-heal: stamp the current template identifier so apps migrated under an
  // older identifier (e.g. the former "demo-v1") converge on the current one.
  // The field is cosmetic (only printed by `status`), so this is purely tidiness.
  lock.template = manifest.template;
  const appliedIds = new Set(lock.applied.map((a) => a.id));

  // For each managed path, the payload the last APPLIED migration put there.
  //
  // Derived from the manifest + the shipped payload tree, not from the lock.
  // The first version of this read `postHashes` off lock entries, which only
  // exist for migrations the CLI actually executed — so a freshly scaffolded
  // app, whose lock is forty-one baseline entries, had an empty baseline and
  // the guard below protected nothing at all. That is the common case, not an
  // edge case. The payloads are right there in dist/, and they are the same
  // bytes the migration wrote, so they answer the question directly and for
  // every app regardless of how it got here.
  const lastWritten = new Map<string, string>();
  for (const migration of manifest.migrations) {
    if (!appliedIds.has(migration.id)) continue;
    for (const step of migration.steps) {
      if (step.type === "file.create" || step.type === "file.write") {
        if (step.from) lastWritten.set(step.path, step.from);
      } else if (step.type === "file.delete") {
        // Nothing manages this path any more until something rewrites it.
        lastWritten.delete(step.path);
      }
    }
  }

  let pending = manifest.migrations.filter((m) => !appliedIds.has(m.id));
  if (opts.toId && appliedIds.has(opts.toId)) {
    console.log(`Migration ${opts.toId} is already applied.`);
    return true;
  }
  if (opts.toId) {
    const idx = pending.findIndex((m) => m.id === opts.toId);
    if (idx === -1) { console.error(`Migration ${opts.toId} not found.`); return false; }
    pending = pending.slice(0, idx + 1);
  }
  if (pending.length === 0) { console.log("Nothing to apply — already up to date."); return true; }
  // Without a terminal nobody can answer the prompt: readline would wait on a
  // closed or idle stdin forever (or read EOF as "no" and skip everything).
  if (!opts.yes && !process.stdin.isTTY) {
    console.error("✗ apply needs confirmation but stdin is not a terminal. Re-run with --yes.");
    return false;
  }

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
      return false;
    }
    // Refuse to overwrite a managed file the consumer has edited since the
    // migration that last wrote it. `apply` used to clobber these silently.
    // A local edit is far more likely to be deliberate than accidental, so
    // this stops rather than warns.
    const locallyModified: string[] = [];
    // Paths no earlier migration wrote, so there is no baseline to call an edit
    // "local". Usually template originals, expected to be replaced — warn only.
    const replaced = new Set<string>();
    for (const step of migration.steps) {
      if (step.type !== "file.write" && step.type !== "file.create" && step.type !== "file.delete") continue;
      const from = lastWritten.get(step.path);
      if (from === undefined) {
        if (step.type !== "file.delete" && step.from) {
          const current = hashFileIgnoringEol(join(appRoot, step.path));
          const next = hashFileIgnoringEol(resolvePayload(step.from, opts.payloadDir));
          if (current !== null && current !== next) replaced.add(step.path);
        }
        continue;
      }
      const expected = hashFileIgnoringEol(resolvePayload(from, opts.payloadDir));
      // No payload on disk (a hand-authored `from`, or a trimmed install) means
      // no baseline to judge against — say nothing rather than guess.
      if (expected === null) continue;
      const current = hashFileIgnoringEol(join(appRoot, step.path));
      // A missing file is not a modification: a later migration may have
      // deleted it, or the consumer may have removed something they never
      // wanted. Re-creating it is the migration's job either way.
      if (current !== null && current !== expected) locallyModified.push(step.path);
    }
    if (locallyModified.length > 0 && !opts.force) {
      console.error(`  ✗ ${migration.id} would overwrite ${locallyModified.length} locally modified file(s):`);
      for (const path of locallyModified) console.error(`      ${path}`);
      console.error("");
      console.error("  These differ from what the last migration left in them, so the changes");
      console.error("  are yours. Commit or stash them and re-run, or pass --force to overwrite.");
      console.error("  Aborting before any step ran.\n");
      return false;
    }
    if (replaced.size > 0) {
      console.warn(`  ! ${replaced.size} file(s) will be replaced — commit first so git can restore them:`);
      for (const path of replaced) console.warn(`      ${path}`);
    }

    if (!opts.yes) {
      const ok = await confirm(`  Apply ${migration.steps.length} step(s)?`);
      if (!ok) { console.log("  Skipped.\n"); continue; }
    }

    // Pre-migration contents, held only by the journal so a kill mid-step can
    // still put every touched file back.
    const journalPayloads: Record<string, string> = {};
    const undoSteps: MigrationStep[] = [];
    // Opened before the first step and cleared only once the lock entry is
    // persisted, so an interruption anywhere in between is recoverable.
    const journal: Journal = {
      version: 1,
      id: migration.id,
      startedAt: new Date().toISOString(),
      cliVersion: manifest.cliVersion,
      undo: undoSteps,
      undoPayloads: journalPayloads,
    };
    writeJournal(appRoot, journal);
    try {
      for (const step of migration.steps) {
        const s = step as Record<string, unknown>;
        const pathKey = String(s.path ?? s.file ?? s.manifest);
        const target = join(appRoot, pathKey);
        assertInsideAppRoot(appRoot, target);
        const prior = statSync(target, { throwIfNoEntry: false });
        // First capture wins: a later one would hold this migration's own
        // intermediate output, not the true pre-migration original.
        if (prior?.isFile() && !(pathKey in journalPayloads)) {
          journalPayloads[pathKey] = encodeUndoPayload(readFileSync(target));
        }
        // Provisional undo, journaled BEFORE the step runs: a kill between its
        // write and the next journal update must still leave this path
        // restorable. The step's own undo replaces it once it returns.
        const slot = undoSteps.length;
        if (!prior) undoSteps.push({ type: "file.delete", path: pathKey });
        else if (prior.isFile()) undoSteps.push({ type: "file.write", mode: "replace", path: pathKey, from: "__undo__" });
        writeJournal(appRoot, journal);
        const undo = executeStep(step, appRoot, opts.payloadDir);
        undoSteps[slot] = undo;
        // Keep the in-run baseline in step with what just happened, so a second
        // migration in the SAME run is judged against this one's output.
        if (step.type === "file.create" || step.type === "file.write") {
          if (step.from) lastWritten.set(step.path, step.from);
        } else if (step.type === "file.delete") {
          lastWritten.delete(step.path);
        }
        // env.add's undo lists exactly the keys it appended — a non-empty list
        // means this file really did gain keys (already-present ones are skipped).
        if (undo.type === "env.remove" && undo.keys.length > 0) {
          envFilesTouched.add(undo.file);
        }
        // Persist progress after every step — `undo`/`undoPayloads` are the same
        // objects the journal holds, so this snapshots what has run so far.
        writeJournal(appRoot, journal);
        // A file.delete with `expect` keeps a changed file; its undo is then a rewrite.
        const kept = step.type === "file.delete" && undo.type === "file.write";
        console.log(kept ? `  - kept  ${pathKey}` : `  ✓ ${step.type}  ${pathKey}`);
      }
    } catch (err) {
      console.error(`  ✗ Error: ${(err as Error).message}`);
      // Transactional unwind: reverse the steps that already ran THIS migration
      // so disk returns to its pre-migration state. Without this, a re-run
      // starts from already-mutated files.
      const { failures } = unwindSteps(undoSteps, journalPayloads, appRoot, opts.payloadDir);
      for (const failure of failures) console.error(`  ✗ Unwind step failed: ${failure}`);
      if (failures.length > 0) {
        // The journal stays, so the next run cannot migrate over a half-reverted tree.
        reportIncompleteUnwind(appRoot, "Rollback of the failed migration");
        return false;
      }
      clearJournal(appRoot);
      console.error("  Migration aborted and rolled back. Fix the cause, then re-run.");
      return false;
    }

    const entry: LockEntry = {
      id: migration.id,
      cliVersion: manifest.cliVersion,
      manifestHash: migration.contentHash,
      ...(migration.payloadHash ? { payloadHash: migration.payloadHash } : {}),
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
  return true;
}
