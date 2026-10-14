---
"@igrp/template-migrator": patch
---

- Migration 56: optional Redis session store (`IGRP_SESSION_STORE_URL`). Adds `redis`, `src/instrumentation.ts` and `src/lib/session-store.ts`, documents the variable in `.env.example`, and bumps the framework packages to the versions that ship the store.
- Migration 57: the middleware `config` becomes a literal, so Next applies the matcher instead of running the middleware on every path.
