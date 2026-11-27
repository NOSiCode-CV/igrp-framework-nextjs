---
"@igrp/framework-next-auth": patch
---

`withIGRPAuth` warns once at startup when the path of `NEXTAUTH_URL` is not `NEXT_PUBLIC_BASE_PATH` + `/api/auth`. NextAuth builds the OAuth `redirect_uri` from that path, so a missing basePath sends the user outside the app after login, and a missing `/api/auth` makes the login loop with a nested `callbackUrl`. Neither was reported before.
