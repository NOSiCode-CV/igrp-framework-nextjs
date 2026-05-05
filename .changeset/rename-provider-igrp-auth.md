---
"@igrp/framework-next-auth": patch
"@igrp/framework-next-ui": patch
---

Rename provider ID from `oauth2` to `igrp-auth`.

**Breaking changes:**
- `AUTH_PROVIDER` now accepts `igrp-auth` or `none` only (`oauth2` is removed)
- `AUTH_PROVIDER` defaults to `igrp-auth`
- `OAUTH2_CLIENT_ID`, `OAUTH2_CLIENT_SECRET`, `OAUTH2_ISSUER`, `OAUTH2_SCOPES` env vars renamed to `IGRP_AUTH_CLIENT_ID`, `IGRP_AUTH_CLIENT_SECRET`, `IGRP_AUTH_ISSUER`, `IGRP_AUTH_SCOPES`
- `OAUTH2_PROVIDER_ID` named export renamed to `IGRP_AUTH_PROVIDER_ID`
- `AUTH_PROVIDER_IDS.OAUTH2` key renamed to `AUTH_PROVIDER_IDS.IGRP_AUTH`
- NextAuth callback URL changes from `/api/auth/callback/oauth2` → `/api/auth/callback/igrp-auth`

**Migration:** Update your `.env` file — replace `AUTH_PROVIDER=oauth2` with `AUTH_PROVIDER=igrp-auth`, and rename all `OAUTH2_*` vars to `IGRP_AUTH_*`. Re-register the redirect URI on your authorization server as `{NEXTAUTH_URL}/api/auth/callback/igrp-auth`.
