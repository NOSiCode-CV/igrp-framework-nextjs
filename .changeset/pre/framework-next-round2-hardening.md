---
'@igrp/framework-next': patch
---

Refuse expired claims, and stop duplicating auth helpers.

- `igrpGetClaims` now returns `status: 'error'` when the access token is past `exp` (with a 30s skew allowance), so `igrpAuthorize` / `igrpAssertAuthorize` fail closed. In a Server Action the token is recovered straight from the session cookie via `getToken`, which decrypts but does **not** run the `jwt` callback — so no refresh and no expiry check ran, and a revoked role kept working until the *cookie* expired rather than the token. Requires `@igrp/framework-next-auth` with `claimsExpired`.
- `resolveSecureCookie` and `isNextControlFlowError` are imported from `@igrp/framework-next-auth` (`./cookies`, `./runtime`) instead of being redefined here. They were copied to avoid rebuilding the chain root for a few lines; two hand-synced copies of security-relevant cookie logic is the worse trade.
- `igrpDeleteAuthCookies` takes a single optional `cookieBasename` (default: NextAuth's basename, which also matches `__Secure-` prefixed, chunked and basePath-scoped forms). The previous `(prodCookieName, devCookieName)` pair only looked like independent control — the prod name *contains* the dev name, so the first test already matched both.
