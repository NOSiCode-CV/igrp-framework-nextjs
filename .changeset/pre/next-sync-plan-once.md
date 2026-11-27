---
"@igrp/framework-next": patch
---

In production, `IGRPRootLayout` no longer rebuilds and validates the Access Management sync plan on every request once a sync has succeeded. The config is fixed for the process, and that sync proved it valid. In development the plan is still validated on every request, so an edited config still fails fast after a hot reload.
