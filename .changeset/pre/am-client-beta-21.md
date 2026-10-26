---
'@igrp/framework-next': patch
'@igrp/framework-next-types': patch
---

Requires `@igrp/platform-access-management-client-ts` `^0.2.0-beta.21`, which adds `sessions.checkSession()` and removes `sessions.initializeSession()` and `sessions.rotateSession()` (both always failed: 404 and 501). `igrpGetAccessClient()` no longer wraps `rotateSession` with a warning, since the method is gone; `closeSession()` still warns that it is not a logout.
