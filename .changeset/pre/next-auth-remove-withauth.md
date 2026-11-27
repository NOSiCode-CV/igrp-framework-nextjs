---
"@igrp/framework-next-auth": patch
---

`@igrp/framework-next-auth/middleware` no longer re-exports NextAuth's `withAuth` (and its `NextRequestWithAuth`, `NextMiddlewareWithAuth` and `WithAuthArgs` types). Without the IGRP cookie names it found no session and sent every request to sign-in, and with a session store it could not work at all. Use `igrpMiddlewareDecision`, or import `withAuth` from `next-auth/middleware` yourself.

Deprecated, because the framework does not use them: `getServerSessionStrict`, `sanitizeString`, `sanitizePath`, `getLoginPath`, `hasAccessToken` and `useSafeSession`. They are removed in a later release.
