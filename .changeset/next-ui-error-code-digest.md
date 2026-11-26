---
"@igrp/framework-next-ui": patch
---

`igrpResolveErrorCopy` reads the platform code from `error.digest` (`<id>|<code>`) when the error has no `code` of its own. A server-thrown `IgrpError` now gets its catalog copy in production instead of the generic copy. Only a key of the `byCode` catalog is used, so an `AppError` message in the digest still falls through.
