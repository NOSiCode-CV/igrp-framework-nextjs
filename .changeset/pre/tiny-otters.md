---
"@igrp/framework-next": patch
---

- Fix `IGRPLayoutFull` header/sidebar data providers failing to load the current user, menus, or apps with an "Invalid URL" error — the access-client credentials (token/baseUrl) weren't reliably reaching those providers once rendered inside their `<Suspense>` boundaries.
