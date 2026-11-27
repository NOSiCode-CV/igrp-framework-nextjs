---
"@igrp/template-migrator": patch
---

Compact `.igrp-migrations-lock.json` and remove `rollback`.

- Each lock entry keeps only its id, `cliVersion`, `manifestHash` and `payloadHash`. The lock no longer stores `undo`, `undoPayloads`, `fileHashes` or `appliedAt`. Locks with full pre-migration file contents grew past 1.2 MiB and Biome refused to format them (1 MiB limit).
- An existing lock is still read. The next `apply` rewrites it in the compact form.
- `igrp-migrate rollback` is removed, together with the `rollback` export. Without undo content there is nothing to restore. To undo a migration, revert its commit with git.
- The lock keeps `version: 1` and a flat `applied` array, so older CLIs can still read it.
- Migration 101: demo-v1 `docs/MIGRATION_GUIDE.md` drops the `rollback` section and describes the compact lock.
- Migrations no longer ship test files: `pack` drops every `file.create`/`file.write` step for a `__tests__/` path or a `*.test.ts(x)` file (migrations 92 and 94 brought 7). Their hashes still cover those steps, so apps that already applied them are not reported as changed. The drift gate ignores test files too.
