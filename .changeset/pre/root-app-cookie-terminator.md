---
"@igrp/framework-next-auth": patch
"@igrp/framework-next": patch
---

Fix co-hosted apps losing their sessions when one app on the same host has no `NEXT_PUBLIC_BASE_PATH`. That root-path app used the stock `next-auth.session-token` name, which is a prefix of every basePath app's cookie. NextAuth reads session cookies by prefix, so the root app glued the other apps' cookies onto its own and failed with `Invalid Compact JWE` (`JWT_SESSION_ERROR`). Its session route then expired all of them, so switching between any two apps sent users back to `/login`. A root-path app now writes `next-auth.session-token~`, which no other app's name starts with.

⚠️ Deploy note: users of root-path apps are signed out once, and their old stock-named cookie lingers until it expires (`igrpDeleteAuthCookies()` sweeps it). Every app sharing a host must be upgraded, because one app still on the stock name keeps breaking the others.
