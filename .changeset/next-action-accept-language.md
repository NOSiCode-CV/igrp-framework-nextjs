---
"@igrp/framework-next": patch
---

Server Actions and Route Handlers now send `Accept-Language`. `igrpEnsureAccessClientConfig` seeds the access-client locale from the `IGRP_LOCALE` cookie, then the request's `Accept-Language` header.
