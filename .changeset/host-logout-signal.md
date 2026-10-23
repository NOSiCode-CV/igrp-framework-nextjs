---
"@igrp/framework-next-auth": patch
---

Adds an `authTime` claim (sign-in time, unix seconds) to the JWT, an `isEndedByHostLogout(token, request)` check on the `withIGRPAuth` instance, and the `HOST_LOGOUT_COOKIE` constant, so co-hosted apps can end each other's sessions in the same browser after a logout.
