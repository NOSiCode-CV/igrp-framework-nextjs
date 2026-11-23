// Crash-durable record of a migration that is mid-flight.
//
// `apply` executes a migration's steps and only writes the lock entry once the
// whole migration succeeds. An in-process failure is handled by the
// transactional unwind in commands/apply.ts — but that runs inside `catch`, so
// a signal (Ctrl-C, CI timeout, power loss) bypasses it entirely and leaves the
// files mutated with nothing recorded.
//
// The damage from that is not the half-applied files — most steps are
// idempotent, so a re-run fixes them. It is that the re-run starts from the
// ALREADY-MIGRATED files and the next failure unwinds to that state, not to the
// true original. Silent, and invisible to the user.
//
// This journal closes that window. It is written before the first step, updated
// after each one, and removed only once the lock entry is safely persisted. Its
// presence on startup therefore means exactly one thing: a previous run died
// mid-migration. `apply` uses the recorded undo to put the tree back before
// doing anything else, which is the same recovery the in-process unwind would
// have performed.

import { existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { writeFileAtomic } from "./lock.js";
import type { MigrationStep } from "./types.js";

const JOURNAL_FILE = ".igrp-migration-journal.json";

export interface Journal {
  version: 1;
  /** Migration that was in flight. */
  id: string;
  startedAt: string;
  cliVersion: string;
  /** Undo steps for the steps that had completed, in execution order. */
  undo: MigrationStep[];
  /** Pre-migration contents for paths whose undo is a `__undo__` placeholder. */
  undoPayloads: Record<string, string>;
}

export function journalPath(appRoot: string): string {
  return join(appRoot, JOURNAL_FILE);
}

/**
 * Read a pending journal, or null when there is none.
 *
 * A journal that exists but cannot be read throws: a run died mid-migration and
 * we no longer know what to undo, so `apply` must stop rather than re-run over
 * a half-migrated tree and record a wrong undo baseline.
 */
export function readJournal(appRoot: string): Journal | null {
  const p = journalPath(appRoot);
  if (!existsSync(p)) return null;
  let parsed: Journal | null = null;
  try {
    parsed = JSON.parse(readFileSync(p, "utf8")) as Journal;
  } catch { /* reported below */ }
  if (!parsed || typeof parsed.id !== "string" || !Array.isArray(parsed.undo)) {
    throw new Error(
      `${p} exists but cannot be read, so the interrupted migration it records cannot be undone.\n` +
        "Restore the app's files (e.g. from git), delete that file, and re-run.",
    );
  }
  return parsed;
}

export function writeJournal(appRoot: string, journal: Journal): void {
  writeFileAtomic(journalPath(appRoot), JSON.stringify(journal, null, 2) + "\n");
}

export function clearJournal(appRoot: string): void {
  rmSync(journalPath(appRoot), { force: true });
}
