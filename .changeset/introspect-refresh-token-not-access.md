---
"@igrp/framework-next-auth": patch
---

fix(oidc): introspect the refresh token instead of the access token in the refresh gate

The jwt callback's pre-refresh introspection (`introspectOidcToken`) checked the **access token**. That gate only runs once the access token is expired or inside its refresh buffer, and an expired access token always introspects as `active: false` per RFC 7662 — so the gate forced a logout (`RefreshAccessTokenError` / `forceLogout`) exactly when a refresh should have happened, leaving silent refresh effectively non-functional.

It now introspects the **refresh token** (`token_type_hint=refresh_token`), whose liveness actually determines whether `grant_type=refresh_token` can succeed. A live refresh token proceeds to refresh; a server-side-revoked one is correctly detected and forces logout. Introspection stays fail-open so a flaky introspection endpoint never blocks refresh.
