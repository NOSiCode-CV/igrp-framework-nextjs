---
"@igrp/template-migrator": patch
---

Migration 100: demo-v1 reads `IGRP_ENABLED_LOCALES` (`pt` or `pt,en`) to choose the languages a deployment offers. With one language the locale switcher is hidden; unset keeps all three.
