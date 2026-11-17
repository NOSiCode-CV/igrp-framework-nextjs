---
"@igrp/framework-next-auth": patch
"@igrp/framework-next": patch
---

`@igrp/framework-next-auth/providers` exports `isIgrpAuthBypass(env?)` and `isPreviewModeEnabled(env?)`, the one definition of "auth is bypassed" (preview mode or `AUTH_PROVIDER=none`). `@igrp/framework-next`'s `isIgrpAuthBypass` and next-auth's own session callbacks now use it instead of their own copies. Behaviour is unchanged.
