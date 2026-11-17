---
'@igrp/framework-next': patch
---

`igrpResetAccessClientConfig()` now clears the stored `locale` along with the token, base URL and timeout. A kept locale made `igrpEnsureAccessClientConfig()` skip reading the request's `IGRP_LOCALE` cookie and `Accept-Language`, so the Access Management API answered in the previous locale.
