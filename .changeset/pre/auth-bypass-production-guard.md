---
"@igrp/framework-next": patch
---

`igrpAssertAuthBypassAllowed()` throws while `IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none`, unless `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true`; any `NODE_ENV` other than `development` or `test` counts as production. Call it from `register()` in `instrumentation.ts`: the throw makes Next log the error and answer every request with 500. `isIgrpAuthBypass()` now accepts a quoted `AUTH_PROVIDER` (`"none"`), like the other bypass checks.
