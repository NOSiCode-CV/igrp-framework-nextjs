---
"@igrp/template-migrator": patch
---

Add migration `23-per-request-layout-and-routes-cache`: demo-v1 layouts use the
existing `getLayoutConfig` cache (one session decode per request) and
`getRoutes()` memoizes its routes-file read.
