---
"@igrp/template-migrator": patch
---

`igrp-migrate apply` no longer overwrites files that changed after an interrupted run. The journal now records each file's hash after its step, and recovery stops with a list of the changed files instead of restoring the pre-migration snapshot over them. Journals written by older versions recover as before.
