---
"@igrp/template-migrator": patch
---

Migration 69: demo-v1 pins framework 0.2.0-beta.11 (`@igrp/framework-next` and `-next-ui` 0.2.0-beta.11, `@igrp/framework-next-i18n` 0.2.0-beta.3) and refreshes `docs/I18N.md` (app middleware is left untouched). `check-catalogs` now fails on missing keys; `lint:i18n` needs the four extra `check-literals` paths by hand.
