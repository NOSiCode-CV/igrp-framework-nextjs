---
"@igrp/framework-next-auth": patch
---

`useIGRPSession()` returns the same object while the session is unchanged, so `state` and `actions` are safe to use as effect or memo dependencies.
