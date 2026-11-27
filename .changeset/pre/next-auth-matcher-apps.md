---
"@igrp/framework-next-auth": patch
---

The default middleware matcher (`auth.config.matcher`) no longer skips `/apps`. Matchers are relative to the basePath, so the exclusion skipped an `/apps` route inside the app, which then got no auth check and no security headers. An app whose basePath is `/apps/<name>` is not affected. An app with a public `/apps` route must now list it in `publicPaths`.
