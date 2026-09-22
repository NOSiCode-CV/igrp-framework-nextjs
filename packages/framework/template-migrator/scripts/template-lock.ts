// Template lock reconciliation — the fourth drift axis.
//
// `templates/demo-v1/.igrp-migrations-lock.json` is a normal tracked file and
// ships inside the template zip on purpose: a freshly scaffolded app must open
// with every migration already marked applied, because the template tree
// already contains their result.
//
// That only holds while the lock keeps pace with the migration set. When it
// falls behind, a brand-new app reports pending migrations it already has:
// `igrp-migrate check` fails on day one, and `apply` re-runs finished
// migrations, writing junk `undo` entries that describe a state the app was
// never in. The orphan check can't catch this (the lock is exempt by path) and
// the content check can't either (no migration manages it), so it gets its own
// axis here.
//
// This module is shared by scripts/check-drift.ts (detect) and
// scripts/sync-template-lock.ts (repair), so the two can never disagree about
// what a correct lock looks like.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { parse as parseYaml } from "yaml";
import { hashSteps } from "../src/hash.js";
import { sortMigrationFiles } from "../src/migration-order.js";
import type { LockEntry, LockFile } from "../src/types.js";

/** The subset of a packed migration this module reconciles against. */
export interface MigrationSummary {
  id: string;
  /** Frontmatter `date` (YYYY-MM-DD) — becomes `appliedAt` for new entries. */
  date: string;
  /** Canonical hash of the migration's steps; matches manifest `contentHash`. */
  contentHash: string;
}

export interface LockDiff {
  /** Migrations the manifest ships that the lock never records as applied. */
  missing: string[];
  /** Lock entries for ids no migration defines any more. */
  unknown: string[];
  /** Applied ids whose recorded hash no longer matches the migration's steps. */
  hashMismatch: { id: string; recorded: string; expected: string }[];
  /** True when the lock records the right ids but not in migration order. */
  outOfOrder: boolean;
}

export function isLockClean(diff: LockDiff): boolean {
  return (
    diff.missing.length === 0 &&
    diff.unknown.length === 0 &&
    diff.hashMismatch.length === 0 &&
    !diff.outOfOrder
  );
}

/** Build a MigrationSummary from parsed frontmatter. */
export function summarise(fm: { id: string; date?: string; steps: unknown }): MigrationSummary {
  return {
    id: fm.id,
    date: typeof fm.date === "string" ? fm.date : "",
    contentHash: hashSteps(fm.steps),
  };
}

/**
 * Compare the template's shipped lock against the migration set.
 *
 * `migrations` must be in pack order (the numeric-prefix file order), because
 * that is the order `apply` executes in and therefore the order a correct lock
 * records.
 */
export function diffTemplateLock(opts: {
  migrations: MigrationSummary[];
  lock: LockFile | null;
}): LockDiff {
  const { migrations, lock } = opts;
  const applied = lock?.applied ?? [];
  const appliedById = new Map(applied.map((entry) => [entry.id, entry]));
  const known = new Set(migrations.map((m) => m.id));

  const missing: string[] = [];
  const hashMismatch: LockDiff["hashMismatch"] = [];
  for (const migration of migrations) {
    const entry = appliedById.get(migration.id);
    if (!entry) {
      missing.push(migration.id);
      continue;
    }
    if (entry.manifestHash !== migration.contentHash) {
      hashMismatch.push({
        id: migration.id,
        recorded: entry.manifestHash,
        expected: migration.contentHash,
      });
    }
  }

  const unknown = applied.filter((entry) => !known.has(entry.id)).map((entry) => entry.id);

  // Order only means anything once both sides hold the same id set.
  const appliedIds = applied.map((entry) => entry.id);
  const expectedIds = migrations.map((m) => m.id);
  const outOfOrder =
    missing.length === 0 &&
    unknown.length === 0 &&
    appliedIds.join("\u0000") !== expectedIds.join("\u0000");

  return { missing, unknown, hashMismatch, outOfOrder };
}

/**
 * Produce the lock the template should ship.
 *
 * Existing entries keep their recorded `appliedAt` and `cliVersion` — those are
 * history, and rewriting them every release would churn the diff and lose the
 * record of which CLI actually stamped each migration. Only the hash is
 * refreshed (a migration's steps may have been corrected in place) and missing
 * entries are appended. Entries for migrations that no longer exist are dropped.
 *
 * New entries carry NO `undo`/`fileHashes`: nothing was executed against a file
 * tree here, the template simply *is* the post-migration state. Rollback of a
 * scaffolded app's baseline migrations is not a supported operation, and
 * omitting the fields says that more plainly than forty copies of `[]` and `{}`.
 * A prior entry that does carry real content keeps it — that can only come from
 * a lock some consumer actually ran against, which is not ours to discard.
 */
export function buildTemplateLock(opts: {
  migrations: MigrationSummary[];
  existing: LockFile | null;
  cliVersion: string;
  template?: string;
}): LockFile {
  const { migrations, existing, cliVersion } = opts;
  const previous = new Map((existing?.applied ?? []).map((entry) => [entry.id, entry]));

  const applied: LockEntry[] = migrations.map((migration) => {
    const prior = previous.get(migration.id);
    return {
      id: migration.id,
      appliedAt: prior?.appliedAt ?? isoFromDate(migration.date),
      cliVersion: prior?.cliVersion ?? cliVersion,
      manifestHash: migration.contentHash,
      // Only carried when there is something to carry — see the note above.
      ...(prior?.undo?.length ? { undo: prior.undo } : {}),
      ...(prior?.fileHashes && Object.keys(prior.fileHashes).length
        ? { fileHashes: prior.fileHashes }
        : {}),
      ...(prior?.undoPayloads ? { undoPayloads: prior.undoPayloads } : {}),
      ...(prior?.postHashes ? { postHashes: prior.postHashes } : {}),
    };
  });

  return {
    version: 1,
    template: (opts.template ?? existing?.template ?? "demo-v1") as LockFile["template"],
    applied,
  };
}

/** `YYYY-MM-DD` → midnight-UTC ISO stamp, matching the existing lock entries. */
function isoFromDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Migration has an unparsable date: "${date}"`);
  }
  return parsed.toISOString();
}

/** Frontmatter extraction, same CRLF-tolerant form as pack.ts / check-drift.ts. */
function parseFrontMatter(content: string): { id: string; date?: string; steps: unknown } {
  const normalised = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const match = normalised.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error("No frontmatter found");
  return parseYaml(match[1]) as { id: string; date?: string; steps: unknown };
}


/** All migrations in the directory, in pack (numeric-prefix) order. */
export function loadMigrationSummaries(migrationsDir: string): MigrationSummary[] {
  const files = sortMigrationFiles(
    readdirSync(migrationsDir).filter((f) => f.match(/^\d+\.MIGRATIONS.*\.md$/)),
  );
  return files.map((file) =>
    summarise(parseFrontMatter(readFileSync(join(migrationsDir, file), "utf8"))),
  );
}

/**
 * Read the template's lock file.
 *
 * Returns null when absent (the diff then reports every migration missing,
 * which is the right answer). Throws a described error when present but
 * unparsable, so callers can report a clean failure instead of leaking a raw
 * JSON.parse stack trace.
 */
export function readTemplateLock(lockPath: string): LockFile | null {
  if (!existsSync(lockPath)) return null;
  const raw = readFileSync(lockPath, "utf8");
  try {
    return JSON.parse(raw) as LockFile;
  } catch (err) {
    throw new Error(`${lockPath} is not valid JSON: ${(err as Error).message}`);
  }
}

/** The exact bytes a correct lock file holds. */
export function serialiseTemplateLock(lock: LockFile): string {
  return JSON.stringify(lock, null, 2) + "\n";
}

export function writeTemplateLock(lockPath: string, lock: LockFile): void {
  writeFileSync(lockPath, serialiseTemplateLock(lock), "utf8");
}
