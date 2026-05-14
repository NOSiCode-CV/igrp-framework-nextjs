#!/usr/bin/env node
import { resolve } from "path";
import { status } from "./commands/status.js";
import { plan } from "./commands/plan.js";
import { apply } from "./commands/apply.js";
import { list } from "./commands/list.js";
import { rollback } from "./commands/rollback.js";
import { check } from "./commands/check.js";
import { convert } from "./commands/convert.js";
import { LegacyLockError } from "./types.js";

const args = process.argv.slice(2);
const cmd = args[0];
const appRoot = resolve(process.cwd());

async function main() {
  // convert and list don't read the lock file — run them unconditionally
  if (cmd === "convert") { await convert(appRoot); return; }
  if (cmd === "list") { await list(); return; }

  try {
    switch (cmd) {
      case "status": status(appRoot); break;
      case "plan": {
        const toIdx = args.indexOf("--to");
        const toId = toIdx !== -1 ? args[toIdx + 1] : undefined;
        plan(appRoot, toId);
        break;
      }
      case "apply": {
        const toIdx = args.indexOf("--to");
        const toId = toIdx !== -1 ? args[toIdx + 1] : undefined;
        const yes = args.includes("--yes") || args.includes("-y");
        await apply(appRoot, { toId, yes });
        break;
      }
      case "rollback": {
        const id = args[1];
        if (!id) { console.error("Usage: igrp-migrate rollback <id>"); process.exit(1); }
        await rollback(appRoot, id);
        break;
      }
      case "check": {
        const ok = check(appRoot);
        if (!ok) process.exit(1);
        break;
      }
      default:
        console.log(`
igrp-migrate — IGRP template migration CLI

Usage:
  igrp-migrate status           Show applied/pending migrations
  igrp-migrate list             List all migrations in this CLI version
  igrp-migrate plan [--to <id>] Preview steps without writing
  igrp-migrate apply [--to <id>] [--yes]  Apply pending migrations
  igrp-migrate rollback <id>    Revert a single applied migration
  igrp-migrate check            CI mode: exit 1 if pending migrations exist
  igrp-migrate convert          Upgrade legacy .igrpmigrations/lock.json → .igrp-migrations-lock.json
`);
    }
  } catch (err) {
    if (err instanceof LegacyLockError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
