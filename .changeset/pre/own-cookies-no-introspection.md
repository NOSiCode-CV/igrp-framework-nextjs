---
"@igrp/framework-next-auth": patch
"@igrp/framework-next": patch
---

Two fixes for apps that share a domain.

**`igrpDeleteAuthCookies()` only deletes the calling app's cookies.** It matched every cookie whose name contained `next-auth.session-token`. A basePath app's logout page also receives the app-center's `Path=/` cookie, so it deleted that too. The center then looked signed out while its session at the authorization server stayed active and unrevoked, and apps under other paths were not touched at all. It now expires the app's current cookie at its basePath, plus the app's own pre-scoping names (through `staleAuthCookies`) at `/`. A new `{ sweepStockNames }` option lets a root-path app also clear its stock-named orphan. Signing out of other apps is the authorization server's job (single logout).

**No introspection before refresh.** The jwt callback called `/oauth2/introspect` with the refresh token before every refresh. The refresh already reports a revoked or expired token (`invalid_grant`), so this only added an IdP round trip. It was also a second way to present a rotated-out refresh token, which Access Management treats as reuse (`token_type_hint=refresh_token`) and answers by revoking the session. `introspectOidcToken` stays exported from `./oidc`.
