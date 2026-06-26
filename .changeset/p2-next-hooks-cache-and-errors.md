---
"@igrp/framework-next": patch
---

Data hooks (`fetchMenus`, `fetchAppsByUser`, `fetchAppByCode`,
`fetchCurrentUser`): switch to request-scoped React `cache()` reading the
token inside (no token-in-cache-key, no cross-user leak), and rethrow
non-401/403 failures so transient/server errors hit the error boundary
instead of rendering an empty layout.
