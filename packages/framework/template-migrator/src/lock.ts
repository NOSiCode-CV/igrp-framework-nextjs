import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import type { LockFile } from "./types.js";
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
  const lock = parsed as LockFile;
  if (!lock || typeof lock !== "object" || !Array.isArray(lock.applied)) {
    throw new Error(`${p} is not a migration lock file (no "applied" array).`);
  }
  return lock;
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
  const target = lockPath(appRoot);
  const tmp = `${target}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(lock, null, 2) + "\n", "utf8");
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
