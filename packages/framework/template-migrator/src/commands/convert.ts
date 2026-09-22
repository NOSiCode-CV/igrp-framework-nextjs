import { existsSync, readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

const LEGACY_DIR = ".igrpmigrations";
const LEGACY_LOCK = join(LEGACY_DIR, "lock.json");
const NEW_LOCK = ".igrp-migrations-lock.json";

/**
 * Returns false when there was nothing to convert, so the CLI can set the exit
 * code. `convert` is exported from the package root, and a library function
 * that calls `process.exit` takes the host process down with it.
 */
export function convert(appRoot: string): boolean {
  const legacyPath = join(appRoot, LEGACY_LOCK);
  const newPath = join(appRoot, NEW_LOCK);

  // Heal partial-convert: both files exist means a previous run was interrupted.
  if (existsSync(legacyPath) && existsSync(newPath)) {
    unlinkSync(legacyPath);
    const legacyDir = join(appRoot, LEGACY_DIR);
    try {
      if (readdirSync(legacyDir).length === 0) rmdirSync(legacyDir);
    } catch { /* already gone or not empty */ }
    console.log(`Recovered interrupted convert: removed stale ${LEGACY_LOCK}`);
    return true;
  }

  if (!existsSync(legacyPath)) {
    console.error(`No legacy lock file found at ${LEGACY_LOCK}. Nothing to convert.`);
    return false;
  }

  if (existsSync(newPath)) {
    console.error(`Already converted. ${NEW_LOCK} exists.`);
    return false;
  }

  const content = readFileSync(legacyPath, "utf8");
  writeFileSync(newPath, content, "utf8");
  unlinkSync(legacyPath);

  const legacyDir = join(appRoot, LEGACY_DIR);
  try {
    if (readdirSync(legacyDir).length === 0) {
      rmdirSync(legacyDir);
    }
  } catch {
    // Directory already gone or not empty — both are fine
  }

  console.log(`Converted ${LEGACY_LOCK} → ${NEW_LOCK}`);
  return true;
}
