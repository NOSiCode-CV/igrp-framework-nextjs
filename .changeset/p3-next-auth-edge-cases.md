---
"@igrp/framework-next-auth": patch
---

Normalize the post-login `home` URL join when `NEXTAUTH_URL_INTERNAL` is set
(exactly one slash between base and slug); coerce a non-numeric/absent OIDC
`expires_in` to the 3600s default so a malformed value can no longer yield a
`NaN` token expiry.
