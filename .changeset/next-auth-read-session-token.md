---
"@igrp/framework-next-auth": patch
"@igrp/framework-next": patch
---

`@igrp/framework-next-auth/session-store` exports `readIGRPSessionToken(cookies, env?)`: decodes this app's session token from a cookie jar without the `withIGRPAuth` instance, choosing the scoped or stock cookie from the jar. `@igrp/framework-next`'s access-token recovery in Server Actions now calls it instead of keeping its own copy of the cookie lookup. Behaviour is unchanged.
