---
"@igrp/framework-next": patch
---

chore: route data-fetch error logging in the layout hooks (menus, applications, user) through the package `logger` instead of bare `console.error`, for consistent `[Error]` prefixes and dev-only stack traces.
