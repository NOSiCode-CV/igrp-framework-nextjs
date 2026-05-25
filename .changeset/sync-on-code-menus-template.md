---
'@igrp/framework-next-template': patch
---

feat(template): wire `IGRP_SYNC_ON_CODE_MENUS` end-to-end

- `.env.example` now documents `IGRP_SYNC_ON_CODE_MENUS=false` (default).
- `src/igrp.template.config.ts` imports `IGRP_DEFAULT_MENU` and forwards `syncOnCodeMenus` + `onCodeMenus` into `igrpBuildConfig`.
- See `packages/template-migrator/migrations/demo-legacy/09.MIGRATIONS-25052026.md` for the full migration guide.
