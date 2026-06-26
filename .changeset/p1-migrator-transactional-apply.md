---
"@igrp/template-migrator": patch
---

Make `apply` transactional: on a mid-migration step failure, unwind the
steps that already ran (restoring overwritten/deleted files from the
captured undo payloads) before aborting, instead of leaving files mutated
with no lock entry. Prevents a re-run from re-capturing a corrupted undo
baseline.
