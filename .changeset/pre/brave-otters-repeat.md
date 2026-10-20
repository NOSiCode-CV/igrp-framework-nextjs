---
"@igrp/template-migrator": patch
---

Fix three cases where the CLI reported success while leaving an app in a wrong state.

**An interrupted `apply` no longer corrupts the recorded undo.** The lock entry is written only after a whole migration succeeds, so a signal (Ctrl-C, CI timeout, crash) between the last step and that write left files mutated with nothing recorded. The retry then captured its undo baseline from the *already-migrated* files, so the lock claimed migrated content was the pre-migration original and a later `rollback` silently restored the wrong state. The in-process transactional unwind never covered this — it only runs inside `catch`.

`apply` now keeps a crash-durable journal (`.igrp-migration-journal.json`) in the app root, written before the first step and cleared once the lock entry is safe. On startup a surviving journal is replayed to revert the interrupted migration before anything else, then the migration re-applies from a clean baseline; if a path cannot be restored, `apply` aborts rather than proceeding on an unknown baseline. The unwind logic is now shared (`src/unwind.ts`) between the error path and crash recovery so both leave the tree in the same state.

**`rollback` refuses scaffold-baseline entries.** Entries with no undo steps and no stored payloads come from the template's shipped lock — a scaffolded app already contained the result, so nothing was executed and nothing was captured. Rolling one back previously printed `✓ rolled back`, changed no files, and removed the entry, leaving the app claiming the migration was unapplied so the next `apply` re-ran it. It now refuses and explains why; `--force` still drops the entry.

**`status` lists lock entries it doesn't ship** instead of only counting them. An app migrated by a newer CLI previously showed `30 applied` above a list of 29 rows, with nothing explaining the gap. Unknown entries are now printed with the CLI version that applied them, and the summary says how many came from a newer CLI.

**The template zip now normalises line endings to LF too.** The previous release fixed this for the CLI channel (payloads are normalised into `dist/` at pack time), but the zip is built from the working tree — so on a Windows checkout with `core.autocrlf=true`, `pnpm release:demo` still produced a CRLF zip while the migrator shipped LF. `create-zip-template.ps1` now normalises the tree before `Compress-Archive`, using the same NUL-byte binary guard, so both channels agree regardless of who built the artifact.

Verified by diffing a scaffolded app against a CLI-upgraded one: **0 differences across all 50 migration-managed paths** (previously 37 diverged).

Also: the transient journal is exempt from the drift gate's new-file check, and the consumer guide documents crash recovery and the rollback refusal.
