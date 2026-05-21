---
'@igrp/framework-next-auth': patch
---

fix(auth): close the logout race that left IdP refresh tokens unrevoked + refresh now re-issues id_token

- **Refresh-token grant now requests `scope`**, matching `IGRP_AUTH_SCOPES` and always including `openid`. Without this, Spring Authorization Server (and other OIDC v1 servers) returns access_token + refresh_token only, leaving the original id_token in the JWT. Over the lifetime of a session, the cached id_token's `sid` claim drifts away from the current servlet session — and the IdP's `/connect/logout` endpoint then no-ops because `id_token_hint.sid` no longer matches. With `scope=openid` on refresh, the IdP re-issues a fresh id_token whose `sid` tracks the current session.
- `revokeOidcSession` now returns a tagged result instead of throwing. Adds explicit reasons for skip (`no_refresh_token`, `no_revocation_endpoint`), and captures HTTP status + response body on non-2xx so IdP-side rejections are diagnosable.
- `events.signOut` now **awaits** `revokeOidcSession`. NextAuth holds the `/api/auth/signout` response until revoke settles, so the browser does not navigate to the end-session URL with a still-in-flight revoke request that the navigation would abort.
- Dev-only diagnostics: `buildEndSessionUrl` logs the built URL shape (which of `client_id`, `post_logout_redirect_uri`, `id_token_hint` were set); `refreshOidcAccessToken` warns when the IdP did not return a new id_token on refresh; `events.signOut` logs `{ hasIdToken, hasAccessToken, hasRefreshToken, authProviderId, expiresAt, error }` (booleans only — never token values). Gated behind `NODE_ENV !== 'production'`.

Companion change in `templates/demo-legacy`: `/logout` page logs the end-session URL just before navigating, and warns when no URL was built. `.env`, `.env.example`, and `README.md` document the post-logout redirect URI registration requirement and clarify scope alignment with the IdP discovery doc.
