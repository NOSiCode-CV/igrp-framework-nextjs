---
"@igrp/template-migrator": patch
---

Migration 85: the demo-v1 middleware no longer skips the auth check for routes whose last segment contains a dot (`/api/users/john.doe`); only static-asset extensions are public. The CSP report-only header now reports to a new `/api/csp-report` route that logs violations, and the template's preview-mode and `AUTH_PROVIDER` checks parse quoted env values the same way the framework does.
