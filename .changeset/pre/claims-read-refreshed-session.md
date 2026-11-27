---
"@igrp/framework-next-auth": patch
"@igrp/framework-next": patch
---

Permission checks no longer fail after the access token expires. When the per-request store holds no token (a Server Action, a page rendered in parallel with its layout, or a seed written after an `await`), `igrpGetClaims` used to decode the session cookie, which is not refreshed during a render, so an expired token made gated sections disappear and `igrpAssertAuthorize` throw. `withIGRPAuth` now registers its `serverSession` process-wide (`registerIGRPServerSession` / `readIGRPServerSessionAccessToken` in `@igrp/framework-next-auth/session-store`), and the claims fallback reads the refreshed token through it, sharing the session read and refresh of the same request. Without a registered instance, or when that read fails, it decodes the cookie as before. No consumer change.
