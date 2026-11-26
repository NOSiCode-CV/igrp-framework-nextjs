---
"@igrp/template-migrator": patch
---

`igrp-migrate status` counts a duplicated lock entry once. Migration 109 for demo-v1 documents in `.env.example` and `docs/ENVIRONMENT.md` that `IGRP_SYNC_ON_CODE_MENU_ROLES=true` resets the menu roles on every pod start.
