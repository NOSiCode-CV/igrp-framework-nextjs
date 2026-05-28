---
'@igrp/framework-next-auth': patch
---

`refreshOidcAccessToken` now deduplicates concurrent refreshes that share a refresh_token. NextAuth's jwt callback runs once per session read, so near token expiry an RSC render + a `useSession` poll + a server action can all attempt a refresh with the SAME refresh_token; with refresh-token rotation the IdP accepts the first and rejects every subsequent one with `invalid_grant`, and the last cookie write wins — logging the user out even though one refresh succeeded. Sharing the in-flight promise collapses N concurrent calls into one network round-trip and one cookie write.

In-memory only — multi-instance deployments can still race across pods, but single-process dev (and most production traffic via sticky routing) is fully covered.
