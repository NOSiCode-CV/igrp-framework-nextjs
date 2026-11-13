import { existsSync, readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

const LEGACY_DIR = ".igrpmigrations";
const LEGACY_LOCK = join(LEGACY_DIR, "lock.json");
const NEW_LOCK = ".igrp-migrations-lock.json";

function parses(path: string): boolean {
  try {
    JSON.parse(readFileSync(path, "utf8"));
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns false when there was nothing to convert, so the CLI can set the exit
 * code. `convert` is exported from the package root, and a library function
 * that calls `process.exit` takes the host process down with it.
 */
export function convert(appRoot: string): boolean {
  const legacyPath = join(appRoot, LEGACY_LOCK);
  const newPath = join(appRoot, NEW_LOCK);

  // Heal partial-convert: both files exist means a previous run was interrupted.
  // Only when the new lock is whole; a torn one is rewritten from legacy below.
  if (existsSync(legacyPath) && existsSync(newPath) && parses(newPath)) {
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

  const content = readFileSync(legacyPath, "utf8");
  writeFileSync(newPath, content, "utf8");
  // The legacy lock is the only copy until the new one reads back.
  if (!parses(newPath)) {
    console.error(`${NEW_LOCK} did not read back as JSON; kept ${LEGACY_LOCK}. Fix it and re-run.`);
    return false;
  }
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
