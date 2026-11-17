---
'@igrp/framework-next-auth': patch
---

Adds `useIGRPSession()` to `./client`: a typed `{ state: { status, data, accessToken, expiresAt, error }, actions: { update } }`, or `null` without a provider. No more casting `useSession().data`.
