---
"@igrp/framework-next-template": patch
---

feat(template): wire `IGRP_SYNC_ON_CODE_MENU_ROLES`

- `igrp.template.config.ts` sources `syncOnCodeMenuRoles` from `process.env.IGRP_SYNC_ON_CODE_MENU_ROLES !== "false"` (defaults to `true`).
- Documented in `.env.example` and `docs/ENVIRONMENT.md`.
