---
"@igrp/template-migrator": patch
---

Rename the template identifier from `demo-legacy` to `demo-v1`, tracking the template folder rename (`templates/demo-legacy` → `templates/demo-v1`). The migrations source tree moves to `migrations/demo-v1/`, and the manifest and lock-file `template` field is now `demo-v1` (it is cosmetic — only printed by `status`). Existing consumer lock files self-heal: the next `apply`/`rollback` stamps the current identifier. No migration `id`s, step content hashes, or applied-migration state change, so already-migrated apps are unaffected.
