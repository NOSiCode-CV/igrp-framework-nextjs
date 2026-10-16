---
"@igrp/template-migrator": patch
---

- Add migration 62: apps pass a time zone to i18n (`IGRP_TIME_ZONE`, default `Atlantic/Cape_Verde`), fixing next-intl's `ENVIRONMENT_FALLBACK` warning and server/browser date mismatches.
