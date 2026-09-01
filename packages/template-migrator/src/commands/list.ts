import { getManifest } from "../manifest.js";

export function list() {
  const manifest = getManifest();
  console.log(`\n@igrp/template-migrator ${manifest.cliVersion}  —  ${manifest.migrations.length} migrations:\n`);
  for (const m of manifest.migrations) {
    const ver = m.targetFrameworkVersion ? ` → ${m.targetFrameworkVersion}` : "";
    console.log(`  ${m.id}  (${m.date})${ver}`);
  }
  console.log("");
}
