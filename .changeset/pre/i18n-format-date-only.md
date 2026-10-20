---
"@igrp/framework-next": patch
---

Fix i18n format helpers: date-only strings keep their calendar day in any zone, `igrpFormatDateTime` accepts `dateStyle`/`timeStyle`, and relative time promotes a rounded value that fills the next unit.
