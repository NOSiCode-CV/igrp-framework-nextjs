---
"@igrp/framework-next": patch
---

Sanitize the client-controlled `x-current-path` header through
`sanitizeRedirectUrl` before reflecting it into the `/login?callbackUrl=`
redirect in `fetchMenus`, `fetchAppsByUser`, `fetchAppByCode`, and
`fetchCurrentUser`. Prevents an open-redirect when a consumer's login page
trusts the framework-built callbackUrl.
