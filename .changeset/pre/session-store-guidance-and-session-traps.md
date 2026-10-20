---
"@igrp/framework-next-auth": patch
"@igrp/framework-next": patch
"@igrp/template-migrator": patch
---

- `@igrp/framework-next-auth`: in production, warn once when a session is written without a session store. That is fine for one replica on its own domain. With several replicas, concurrent refreshes replay refresh tokens and Access Management revokes the session. With several apps on one domain, the cookies overflow proxy header limits. Never fires in development or at the Edge.
- `@igrp/framework-next`: `igrpGetAccessClient().sessions.rotateSession()` and `.closeSession()` warn on first use. `/api/session/rotate` closes the calling app's session and opens a replacement no token is bound to, so it logs the app out. `/api/session/close` is not a logout: it clears no cookie, keeps the SSO session and revokes no token. Both still call through.
- Migration 59: `.env.example` documents `IGRP_SESSION_STORE_URL` as required with more than one replica or on a shared domain, and recommends `IGRP_SESSION_MAX_AGE=28800`, Access Management's absolute session lifetime.
