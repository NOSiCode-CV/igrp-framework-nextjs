---
"@igrp/template-migrator": patch
---

`rollback` refuses to delete or overwrite files you edited after the migration ran (pass `--force` to discard them). `apply` now exits 1 when it aborts, fails fast without `--yes` when stdin is not a terminal, warns before replacing files no earlier migration wrote, writes its crash journal atomically, and stops if that journal is unreadable. `convert` keeps the legacy lock until the new one reads back. The packer fails on a missing payload. Lock entries no longer carry the unused `fileHashes` field.
