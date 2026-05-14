import { existsSync, readFileSync, writeFileSync } from "fs";
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
    return { version: 1, template: "demo-legacy", applied: [] };
  }
  return JSON.parse(readFileSync(p, "utf8")) as LockFile;
}

export function writeLock(appRoot: string, lock: LockFile): void {
  writeFileSync(lockPath(appRoot), JSON.stringify(lock, null, 2) + "\n", "utf8");
}
