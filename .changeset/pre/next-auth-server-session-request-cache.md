---
"@igrp/framework-next-auth": patch
---

`withIGRPAuth().serverSession()` (and `getSession()`, which calls it) now reads the session once per RSC render instead of once per call.

A layout tree reads the session from several places that render in parallel — the root layout for the client `SessionProvider`, the authenticated layout through `getSession()` — and every read decrypted the session cookie and ran the `jwt` and `session` callbacks again. The `getServerSession` call is now wrapped in `React.cache`, which is scoped to the current render; outside one (Route Handlers, Server Actions) it is a passthrough, so a session is never shared across requests. `react` is loaded lazily alongside `next-auth`, so the Edge-reachable static import graph of `./config` is unchanged.

Callers that seed per-request state from the session (e.g. `igrpSetAccessClientConfig`) must keep doing so themselves after each call — only the read is memoized, not the caller's side effects.
