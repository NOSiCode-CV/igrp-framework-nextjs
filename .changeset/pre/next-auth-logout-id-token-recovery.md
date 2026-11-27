---
"@igrp/framework-next-auth": patch
---

- `buildEndSessionUrl` now reads the rotated token from the recovery store before setting `id_token_hint`. After a refresh that ran where the cookie could not be written (an RSC render), logout used to send the cookie's older id_token.
- Sign-in expiry now resolves through `resolveTokenResponseExpiry`, the same function the refresh path uses. A non-positive `expires_in` at sign-in now falls back to the token's `exp` instead of expiring the session at once.
