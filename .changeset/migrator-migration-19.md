---
"@igrp/template-migrator": patch
---

- Add migration 19 (`19-adaptive-session-refresh`): removes `IGRP_SESSION_REFETCH_INTERVAL` from `.env.example` and updates `get-session-args.ts` to use a 600s backstop interval now that `IGRPSessionWatcher` handles adaptive refresh from `session.expiresAt`
