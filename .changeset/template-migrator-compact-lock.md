---
"@igrp/template-migrator": patch
---

Compact `.igrp-migrations-lock.json` and remove `rollback`.

- The lock is now version 2: each migration keeps only its id, `manifestHash` and `payloadHash`, grouped by CLI release line (`"0.1"`, `"0.2"`). It no longer stores `undo`, `undoPayloads`, `fileHashes` or `appliedAt`. Locks with full pre-migration file contents grew past 1.2 MiB and Biome refused to format them (1 MiB limit).
- A version-1 lock is still read. The next `apply` rewrites it as version 2 and drops the undo content.
- `igrp-migrate rollback` is removed, together with the `rollback` export. Without undo content there is nothing to restore. To undo a migration, revert its commit with git.
- Older CLIs cannot read a version-2 lock. Use `@igrp/template-migrator@latest`.
- Migration 101: demo-v1 `docs/MIGRATION_GUIDE.md` drops the `rollback` section and describes the compact lock.
- Migrations no longer ship test files: `pack` drops every step for a `__tests__/` path or a `*.test.ts(x)` file (migrations 92 and 94 brought 7). Their hashes still cover those steps, so apps that already applied them are not reported as changed. The drift gate's new-file check ignores test files too.
