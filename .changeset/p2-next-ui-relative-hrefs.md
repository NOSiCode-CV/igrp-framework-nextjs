---
"@igrp/framework-next-ui": patch
---

`IGRPTemplateNavUser` and `IGRPTemplateNotifications`: emit basePath-relative
`next/link` hrefs (`/profile`, `/notifications`, `/setting`) instead of
`window.location.origin`-based absolute URLs. Fixes the SSR/CSR hydration
mismatch, the full-page reload, and the 404 under a `NEXT_PUBLIC_BASE_PATH`
deployment.
