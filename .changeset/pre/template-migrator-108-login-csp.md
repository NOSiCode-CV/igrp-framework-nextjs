---
"@igrp/template-migrator": patch
---

Migration 108 for demo-v1: `/login?reason=session_ended` signs the user out only when the request does not come from another site, and `/api/csp-report` logs 3 fields of at most 200 characters and answers `400` to a body that is not a CSP report. `src/lib/utilities.ts` drops `isPreviewMode()` and `isAuthDisabled()`; use `isAuthBypass()`.
