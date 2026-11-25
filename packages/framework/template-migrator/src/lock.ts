import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import type { LockEntry, LockFile } from "./types.js";
import { LegacyLockError } from "./types.js";

const LOCK_FILE = ".igrp-migrations-lock.json";
const LEGACY_LOCK_PATH = join(".igrpmigrations", "lock.json");

export function lockPath(appRoot: string): string {
  return join(appRoot, LOCK_FILE);
}

export function readLock(appRoot: string): LockFile {
  if (existsSync(join(appRoot, LEGACY_LOCK_PATH))) {
    throw new LegacyLockError();
  }
  const p = lockPath(appRoot);
  if (!existsSync(p)) {
    return { version: 1, template: "demo-v1", applied: [] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(p, "utf8"));
  } catch (err) {
    // A raw SyntaxError here reads like a CLI bug. It is the consumer's own
    // file (a bad merge of the lock is the usual cause), so name it and say
    // what to do about it.
    throw new Error(
      `${p} is not valid JSON: ${(err as Error).message}\n` +
        "Fix the file (a bad merge is the usual cause) and re-run.",
    );
  }
  return decodeLock(parsed, p);
}

/**
 * Shape written by unreleased 0.2.0-beta.28 development builds (the template's
 * shipped lock among them): ids grouped by CLI release line, hashes only.
 * Still read; never written.
 */
interface GroupedDiskLock {
  version: 2;
  template: LockFile["template"];
  applied: Record<string, Record<string, { manifestHash: string; payloadHash?: string }>>;
}

/** Parse either shape: a flat `applied` array (written today, and by every CLI up to 0.2.0-beta.27) or the grouped one. */
export function decodeLock(parsed: unknown, p: string): LockFile {
  const raw = parsed as { template?: LockFile["template"]; applied?: unknown } | null;
  if (raw && typeof raw === "object" && Array.isArray(raw.applied)) {
    return { version: 1, template: raw.template ?? "demo-v1", applied: raw.applied as LockEntry[] };
  }
  if (raw && typeof raw === "object" && raw.applied && typeof raw.applied === "object") {
    const applied: LockEntry[] = [];
    for (const [cliVersion, group] of Object.entries((raw as GroupedDiskLock).applied)) {
      for (const [id, hashes] of Object.entries(group)) applied.push({ id, cliVersion, ...hashes });
    }
    return { version: 1, template: raw.template ?? "demo-v1", applied };
  }
  throw new Error(`${p} is not a migration lock file (no "applied" entries).`);
}

/**
 * Serialise as version 1 with a flat `applied` array, so CLIs up to
 * 0.2.0-beta.27 can still read it (they require `applied` to be an array).
 * Each entry keeps only what `status`/`check`/`apply` read: id, the CLI that
 * applied it, and the hashes. Undo content (`undo`, `undoPayloads`,
 * `fileHashes`, `appliedAt`) is dropped: full file contents pushed consumer
 * locks past 1 MiB (Biome's file size limit).
 */
export function encodeLock(lock: LockFile): string {
  const applied: LockEntry[] = lock.applied.map((entry) => ({
    id: entry.id,
    cliVersion: entry.cliVersion,
    manifestHash: entry.manifestHash,
    ...(entry.payloadHash ? { payloadHash: entry.payloadHash } : {}),
  }));
  return JSON.stringify({ version: 1, template: lock.template, applied }, null, 2) + "\n";
}

/**
 * Write the lock atomically (temp file + rename).
 *
 * The lock is the only durable record that a migration ran, so a torn write is
 * unrecoverable in exactly the way the crash journal exists to prevent. Rename
 * is atomic within a directory on every platform the CLI supports: a reader
 * sees either the old file or the new one, never half of either.
 */
export function writeLock(appRoot: string, lock: LockFile): void {
  writeFileAtomic(lockPath(appRoot), encodeLock(lock));
}

/** Temp file + rename, so a reader never sees a torn write. Also used by journal.ts. */
export function writeFileAtomic(target: string, content: string): void {
  const tmp = `${target}.tmp`;
  try {
    writeFileSync(tmp, content, "utf8");
    renameWithRetry(tmp, target);
  } catch (err) {
    rmSync(tmp, { force: true });
    throw err;
  }
}

// Windows refuses a rename over a file another process holds open (antivirus,
// an editor, a dev-server watcher) with EPERM/EACCES/EBUSY. The hold is brief,
// so retry for ~3 s, the way graceful-fs does, before giving up.
const RENAME_RETRY_CODES = new Set(["EPERM", "EACCES", "EBUSY"]);

function renameWithRetry(from: string, to: string): void {
  for (let attempt = 0; ; attempt++) {
    try {
      renameSync(from, to);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (attempt >= 30 || !code || !RENAME_RETRY_CODES.has(code)) throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
}
