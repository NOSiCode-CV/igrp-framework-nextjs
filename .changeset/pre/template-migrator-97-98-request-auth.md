---
"@igrp/template-migrator": patch
---

Migrations 97 and 98: demo-v1's `lib/auth.ts` seeds the access client through `igrpEnsureAccessClientConfig`, its middleware takes the auth decision from `igrpMiddlewareDecision`, and `lib/utilities.ts` delegates `isAuthBypass` and `sanitizeCallbackUrl` to `@igrp/framework-next-auth`.
