---
"@igrp/template-migrator": patch
---

- Move migration guides and payloads from `templates/demo-legacy/.igrpmigrations/` into the CLI package at `migrations/demo-legacy/`
- Replace `.igrpmigrations/lock.json` with a flat `.igrp-migrations-lock.json` at the project root (same pattern as `skills-lock.json`)
- Add `igrp-migrate convert` command to upgrade existing consumers from the legacy lock path; all other commands block with a clear message if the legacy path is detected
