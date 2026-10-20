---
"@igrp/template-migrator": patch
---

Migration 64: `global-error.tsx` sets `<html lang>` from `igrpLastFormatLocale()`, so the global error page carries the deployment's region instead of the default one.
