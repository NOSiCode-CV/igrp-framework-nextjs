---
'@igrp/framework-next-auth': patch
---

`withIGRPAuth` now defaults `session.maxAge` to 28800 s (8 h), AM's absolute session ceiling, instead of NextAuth's 30 days. The session cookie and the session-store entry used to outlive the AM session by ~90×: once AM's refresh grant answered `invalid_grant`, the dead entry lingered for weeks. A refresh failure still ends in `/logout` and a fresh sign-in. Pass `session.maxAge` (or set `IGRP_SESSION_MAX_AGE` in the template) to override it.
