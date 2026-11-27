---
"@igrp/template-migrator": patch
---

Added migration `106-audit-headers-logout-error-copy`. The fixed security headers move from `src/middleware.ts` to `next.config.ts` `headers()`, so they reach every path, including static files and paths the matcher skips. The matcher no longer skips `/apps`. The logout layout's cross-site check moves to `src/lib/logout-entry.ts`. `(auth)/error.tsx` shows an `AppError`'s public message before the generic auth copy.
