---
"@igrp/template-migrator": patch
---

`executeStep` now throws a clear error for `file.write` `mode: "patch"`
(unimplemented) and for a missing `from`, instead of a cryptic
`Cannot read properties of undefined` TypeError that aborted the whole apply.
