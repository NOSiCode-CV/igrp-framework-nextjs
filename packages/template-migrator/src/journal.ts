// Crash-durable record of a migration that is mid-flight.
//
// `apply` executes a migration's steps and only writes the lock entry once the
// whole migration succeeds. An in-process failure is handled by the
// transactional unwind in commands/apply.ts — but that runs inside `catch`, so
// a signal (Ctrl-C, CI timeout, power loss) bypasses it entirely and leaves the
// files mutated with nothing recorded.
//
// The damage from that is not the half-applied files — most steps are
// idempotent, so a re-run fixes them. It is that the re-run re-captures its
// undo baseline from the ALREADY-MIGRATED files, so the lock ends up claiming
// the migrated content is the pre-migration original. A later rollback then
// "restores" the migrated state and reports success. Silent, and invisible to
// the user.
//
// This journal closes that window. It is written before the first step, updated
// after each one, and removed only once the lock entry is safely persisted. Its
// presence on startup therefore means exactly one thing: a previous run died
// mid-migration. `apply` uses the recorded undo to put the tree back before
// doing anything else, which is the same recovery the in-process unwind would
// have performed.

import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
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
 * An unreadable journal is treated as absent rather than fatal: it must never
 * be the thing that blocks a consumer from running `apply`. The caller warns.
 */
export function readJournal(appRoot: string): Journal | null {
  const p = journalPath(appRoot);
  if (!existsSync(p)) return null;
  try {
    const parsed = JSON.parse(readFileSync(p, "utf8")) as Journal;
    if (!parsed || typeof parsed.id !== "string" || !Array.isArray(parsed.undo)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeJournal(appRoot: string, journal: Journal): void {
  writeFileSync(journalPath(appRoot), JSON.stringify(journal, null, 2) + "\n", "utf8");
}

export function clearJournal(appRoot: string): void {
  rmSync(journalPath(appRoot), { force: true });
}
