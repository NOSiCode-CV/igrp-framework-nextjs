---
"@igrp/framework-next-auth": patch
---

- Remove debug `console.debug` trace calls from OIDC token refresh (`refreshOidcAccessToken`), end-session URL builder (`buildEndSessionUrl`), and the `events.signOut` handler; retain all `console.warn`/`console.error` calls with diagnostic value
