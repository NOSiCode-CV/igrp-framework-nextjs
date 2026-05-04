---
"@igrp/framework-next-auth": major
"@igrp/framework-next-types": patch
---

Replace Keycloak and Autentika providers with a single generic `oauth2` OIDC provider.

**Breaking changes:**
- `AUTH_PROVIDER` now accepts `oauth2` or `none` only (`keycloak` and `autentika` are removed)
- `AUTH_PROVIDER` defaults to `oauth2` (previously defaulted to `keycloak`)
- `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER` env vars removed
- `AUTENTIKA_CLIENT_ID`, `AUTENTIKA_CLIENT_SECRET`, `AUTENTIKA_HOST`, `AUTENTIKA_TENANT_NAME`, `AUTENTIKA_SCOPES` env vars removed
- `KEYCLOAK_PROVIDER_ID` and `AUTENTIKA_PROVIDER_ID` named exports removed from all entry points

**Migration:** Replace with `OAUTH2_CLIENT_ID`, `OAUTH2_CLIENT_SECRET`, `OAUTH2_ISSUER`, `OAUTH2_SCOPES` (optional, defaults to `openid`). The redirect URI to register on your server is `{NEXTAUTH_URL}/api/auth/callback/oauth2`.
