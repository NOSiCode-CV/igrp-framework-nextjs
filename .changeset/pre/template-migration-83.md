---
"@igrp/template-migrator": patch
---

Migration 83: ship the ten demo-v1 guides in `docs/` that upgraded apps never received (only `docs/I18N.md` was migrated before). The drift gate no longer exempts `docs/`, so a new or edited guide fails `check:drift` until a migration ships it.
