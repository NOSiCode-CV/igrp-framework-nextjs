---
"@igrp/framework-next": patch
---

i18n: ignore `undefined` chrome overrides (object-valued ones such as `errorCodes` apply again), render impossible date-only strings like `2026-02-31` as empty, mark the locale cookie Secure on https origins without a proxy header, key the message-merge cache by default locale, and announce a failed language change in a status region.
