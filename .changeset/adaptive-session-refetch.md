---
"@igrp/framework-next-ui": patch
---

`IGRPSessionWatcher` now schedules an adaptive silent refresh 45s before access-token expiry, derived from `session.expiresAt`, so token-refresh timing no longer depends on hand-tuning `IGRP_SESSION_REFETCH_INTERVAL` to the IdP access-token TTL. The fixed `SessionProvider` poll remains as a fallback.
