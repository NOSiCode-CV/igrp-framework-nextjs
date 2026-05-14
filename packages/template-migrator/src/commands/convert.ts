import { existsSync, readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

const LEGACY_DIR = ".igrpmigrations";
const LEGACY_LOCK = join(LEGACY_DIR, "lock.json");
const NEW_LOCK = ".igrp-migrations-lock.json";

export function convert(appRoot: string): void {
  const legacyPath = join(appRoot, LEGACY_LOCK);
  const newPath = join(appRoot, NEW_LOCK);

  if (!existsSync(legacyPath)) {
    console.error(`No legacy lock file found at ${LEGACY_LOCK}. Nothing to convert.`);
    process.exit(1);
  }

  if (existsSync(newPath)) {
    console.error(`Already converted. ${NEW_LOCK} exists.`);
    process.exit(1);
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
}
