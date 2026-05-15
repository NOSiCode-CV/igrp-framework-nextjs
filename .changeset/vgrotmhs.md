---
"@igrp/framework-next-auth": patch
---

buildEndSessionUrl no longer requires idToken to build the Keycloak end-session URL; idToken fallback in refreshOidcAccessToken now uses || to handle empty-string responses
