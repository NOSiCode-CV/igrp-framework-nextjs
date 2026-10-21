---
"@igrp/template-migrator": patch
---

Migration 71: `instrumentation.ts` refuses auth bypass in production builds without `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true`; the development Docker image opts in.
