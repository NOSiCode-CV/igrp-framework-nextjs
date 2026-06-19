---
"@igrp/framework-next-auth": patch
---

fix(oidc): warn in production when the IdP returns no fresh id_token on refresh-token grant. Previously the warning was gated to dev only, so a misconfigured IdP silently broke RP-initiated logout in deployed environments — exactly where operators most need the signal.
