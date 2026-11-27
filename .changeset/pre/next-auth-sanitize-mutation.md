---
"@igrp/framework-next-auth": patch
---

`sanitize.ts` drops guards that other checks already cover (`== null` before `typeof`, empty-length checks, the raw-backslash check in `sanitizeCallbackUrl`). New tests bring its mutation score to 100%. Behaviour is unchanged.
