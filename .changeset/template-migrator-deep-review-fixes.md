---
"@igrp/template-migrator": patch
---

Deep-review fixes across the migrator: crash recovery, rollback safety, and the release gates.

**Correctness**

- `apply` no longer unwinds a migration the lock already records. A crash in the window between `writeLock` and `clearJournal` left a journal for a migration that had fully succeeded; replaying its undo reverted the files while the lock kept claiming the migration was applied, so `apply` reported "nothing to apply", `check` passed, and the app silently lacked the migration forever.
- `apply` refuses to overwrite a managed file the consumer has edited since the migration that last wrote it, naming the paths and aborting before any step runs. `--force` overwrites. New `postHashes` on each lock entry is the baseline for this; entries from older CLI versions are not checked.
- `check` and `status` now compare each applied entry's `manifestHash` against the migration's current `contentHash`, so a migration corrected in place after release no longer leaves apps holding the old result with nothing to say so.
- `rollback <id>` refuses (without `--force`) when a still-applied migration declares `<id>` in its `requires` — the state `apply` already refuses to create, reached from the other side.
- `env.remove` takes the contiguous comment block above each key with it, and recovers `doc` / `required_if` from those comments. An `env.add` undo used to leave orphaned `# …` lines behind on every apply/rollback cycle and restore a bare `# ` on re-add. Both env steps now preserve the file's existing line endings, and `env.add` no longer opens an empty file with blank lines.
- Undo payload restoration in `unwind` and `rollback` runs the same `assertInsideAppRoot` guard `executeStep` applies — those two branches wrote directly and could escape the app root via a hand-edited or badly merged lock.
- `readLock` reports the offending file and likely cause instead of leaking a raw `SyntaxError`, and rejects valid JSON that is not a lock file. `writeLock` is now atomic (temp file + rename).
- `convert` returns a boolean instead of calling `process.exit`; it is exported from the package root, where exiting takes the host process down.
- `--to` with no value now errors instead of silently applying every pending migration.

**Gates**

- Pack-time step validation (`src/validate-steps.ts`): a typo'd `type`, a missing `from`, a path containing `..`, or `mode: "patch"` (never implemented, throws at apply time) now fails the build instead of shipping and failing part way through a consumer's migration.
- The drift gate treats "a migration deletes a path the template still ships" as a hard failure rather than a warning — it is the exact mirror of a case that already failed.
- `release` now runs `typecheck` and `test` before `check:drift`; a new `typecheck` script covers `scripts/` as well as `src/` (its tsconfig existed but nothing invoked it). Corrupt-baseline reads report cleanly instead of throwing a parse stack trace.
- The workspace-version scan no longer recurses through `node_modules`.

**Packaging**

- No JS sourcemaps or `.d.ts.map` files are emitted: `files` publishes only `dist/`, so both pointed at `src/` paths absent from the tarball.
