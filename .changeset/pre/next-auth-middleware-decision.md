---
"@igrp/framework-next-auth": patch
---

`@igrp/framework-next-auth/middleware` exports `igrpMiddlewareDecision(request, auth, options?)`, the middleware's auth rules: bypass (preview mode or `AUTH_PROVIDER=none`), public and static paths, the logout-pending backstop, token checks, host logout and a sanitized `callbackUrl`. It returns `pass` or `redirect`; the app builds the response. `@igrp/framework-next-auth/sanitize` exports `sanitizeCallbackUrl`, moved from the template.
