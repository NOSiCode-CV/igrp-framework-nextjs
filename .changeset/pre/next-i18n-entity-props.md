---
"@igrp/framework-next-i18n": patch
---

`check-literals` no longer flags an HTML entity in a quoted prop (`title="&mdash;"`), which JSX decodes as it does in JSX text. Inside `{"…"}` the entity stays visible and is still flagged.
