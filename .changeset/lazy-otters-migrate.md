---
"@igrp/template-migrator": patch
---

- Added migration `27-csp-hsts-headers`: captures `src/middleware.ts`'s new `Strict-Transport-Security` and `Content-Security-Policy-Report-Only` security headers.
- Added migration `28-resync-beta165-query-provider-split`: resyncs 17 files that drifted since migrations 25/26, captures the `query-client.tsx` → `query-client.ts`/`query-client.server.ts`/`query-provider.tsx` split, and bumps `@igrp/framework-next`/`@igrp/framework-next-ui` dependency pins to `0.1.0-beta.165`/`0.1.0-beta.161`.
