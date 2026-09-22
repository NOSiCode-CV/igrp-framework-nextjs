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

const HELP = `
igrp-migrate — IGRP template migration CLI

Usage:
  igrp-migrate status                     Show applied/pending migrations
  igrp-migrate list                       List all migrations in this CLI version
  igrp-migrate plan [--to <id>]           Preview steps without writing
  igrp-migrate apply [--to <id>] [--yes] [--force]
                                          Apply pending migrations
  igrp-migrate rollback <id> [--force]    Revert a single applied migration
  igrp-migrate check                      CI mode: exit 1 if migrations are pending
                                          or an applied one has since changed
  igrp-migrate convert                    Upgrade legacy .igrpmigrations/lock.json

Flags:
  --to <id>   Stop after this migration
  --yes, -y   Skip the per-migration confirmation prompt
  --force     apply:    overwrite files you have modified locally
              rollback: proceed despite missing undo content, a scaffold
                        baseline entry, or still-applied dependents
`;

/**
 * Read a flag's value, rejecting a missing one or a following flag.
 *
 * `--to` with nothing after it used to yield `undefined` and silently apply
 * EVERY pending migration — the opposite of what someone asking to stop at a
 * specific one wanted.
 */
function flagValue(name: string): string | undefined {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const value = args[i + 1];
  if (value === undefined || value.startsWith("-")) {
    console.error(`${name} requires a migration id.`);
    process.exit(1);
  }
  return value;
}

async function main() {
  // convert and list don't read the lock file — run them unconditionally
  if (cmd === "convert") { process.exitCode = convert(appRoot) ? 0 : 1; return; }
  if (cmd === "list") { list(); return; }

  try {
    switch (cmd) {
      case "status": status(appRoot); break;
      case "plan": plan(appRoot, flagValue("--to")); break;
      case "apply":
        await apply(appRoot, {
          toId: flagValue("--to"),
          yes: args.includes("--yes") || args.includes("-y"),
          force: args.includes("--force"),
        });
        break;
      case "rollback": {
        const id = args[1];
        if (!id || id.startsWith("-")) {
          console.error("Usage: igrp-migrate rollback <id> [--force]");
          process.exit(1);
        }
        const ok = await rollback(appRoot, id, { force: args.includes("--force") });
        if (!ok) process.exit(1);
        break;
      }
      case "check":
        if (!check(appRoot)) process.exit(1);
        break;
      default:
        console.log(HELP);
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
