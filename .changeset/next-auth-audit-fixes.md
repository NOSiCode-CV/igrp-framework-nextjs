---
"@igrp/framework-next-auth": patch
---

Session refresh and logout fixes.

- `IGRP_AUTH_CLIENT_ID` and `IGRP_AUTH_CLIENT_SECRET` are trimmed for refresh, revocation and RP-initiated logout, as sign-in already did. A secret mounted from a file with a trailing newline made the first refresh fail with `invalid_client` and logged every user out.
- If the IdP discovery document cannot be fetched during a refresh, the session is kept unchanged and the next request retries. It used to force a logout, although the refresh token was never sent.
- A replica that adopts another replica's refresh from the session store now clears a stale `RefreshAccessTokenError` / `forceLogout` flag.
- The refresh lock lasts 30 s instead of 20 s, which covers a worst-case refresh with its retry.
- The in-memory session store now removes expired entries as it grows, so abandoned sessions no longer accumulate.
- Removed `introspectOidcToken` from `./oidc`. Nothing called it, and introspecting a rotated-out refresh token makes Access Management revoke the session.
