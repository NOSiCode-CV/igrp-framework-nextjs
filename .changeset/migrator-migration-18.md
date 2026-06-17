---
"@igrp/template-migrator": patch
---

- Add migration 18 (`18-email-scope-enable`): updates `.env.example` to set `IGRP_AUTH_SCOPES=openid email` now that the IdP advertises the `email` scope; bumps all framework deps to beta.142–153
