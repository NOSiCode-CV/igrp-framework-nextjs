import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { LockFile } from "./types.js";

const LOCK_DIR = ".igrpmigrations";
const LOCK_FILE = "lock.json";
// Legacy path used by CLI versions < 0.1.2-beta.115
const LEGACY_LOCK_FILE = ".igrpmigrations.lock.json";

export function lockPath(appRoot: string): string {
  return join(appRoot, LOCK_DIR, LOCK_FILE);
}

export function readLock(appRoot: string): LockFile {
  const newPath = lockPath(appRoot);
  if (existsSync(newPath)) {
    return JSON.parse(readFileSync(newPath, "utf8")) as LockFile;
  }
  // Backward compat: migrate from root-level lock file written by older CLI versions.
  const legacyPath = join(appRoot, LEGACY_LOCK_FILE);
  if (existsSync(legacyPath)) {
    const lock = JSON.parse(readFileSync(legacyPath, "utf8")) as LockFile;
    writeLock(appRoot, lock); // promote to new location
    return lock;
  }
  return { version: 1, template: "demo-legacy", applied: [] };
}

export function writeLock(appRoot: string, lock: LockFile): void {
  const dir = join(appRoot, LOCK_DIR);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, LOCK_FILE), JSON.stringify(lock, null, 2) + "\n", "utf8");
}
