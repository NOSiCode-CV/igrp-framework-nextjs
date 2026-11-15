---
"@igrp/template-migrator": patch
---

`rollback --force` now names the locally changed files it discards, and the refusal says they "differ from what <id> wrote" instead of "changed since it ran". `apply --to <id>` exits 0 when `<id>` is already applied, so repeated scripted runs succeed. `check:drift` also fails on an unpinned dependency the template dropped but `template-baseline.json` still lists, and no longer reports a dropped dependency a migration pins under both checks.

A payload file overwritten in place is now caught. The manifest carries a `payloadHash` per migration (the step payloads, line endings ignored), `apply` records it in the lock, and `check`/`status` report the migration as changed when the recorded value differs. Lock entries written before this release have no `payloadHash` and are compared on `manifestHash` alone, so upgrading the CLI does not flag every applied migration. The template's shipped lock now records `payloadHash` for every migration.

For a migration flagged changed only because its payload files changed, `check` and `status` now advise removing its lock entry and re-running `apply` instead of rolling it back, which the rollback edit guard would always refuse.
