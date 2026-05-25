---
"@igrp/framework-next-auth": patch
---

Fix `withIGRPAuth` redirect callback discarding `callbackUrl` when `NEXTAUTH_URL_INTERNAL` was set, which forced every post-login redirect to the app home. The callback now honors a safe same-origin or relative `callbackUrl` and falls back to the configured home slug only when no useful destination was provided. This restores the expected flow after a token-refresh-driven re-login: the user lands back on the page they were on, not on `/`.
