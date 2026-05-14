---
"@igrp/framework-next-auth": patch
---

Fix expiresAt unit bug causing infinite refresh loops; change AUTH_PROVIDER default to none; add buildEndSessionUrl for RP-initiated logout; add introspectOidcToken refresh gate
