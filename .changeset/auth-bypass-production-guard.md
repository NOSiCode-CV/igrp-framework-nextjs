---
"@igrp/framework-next": patch
---

`igrpAssertAuthBypassAllowed()` refuses a production start while `IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none`, unless `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true`. Call it from `register()` in `instrumentation.ts`. `isIgrpAuthBypass()` now accepts a quoted `AUTH_PROVIDER` (`"none"`), like the other bypass checks.
