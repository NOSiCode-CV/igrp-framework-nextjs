---
"@igrp/template-migrator": patch
---

Fix incomplete migration `10-session-refetch-and-menu-role-sync`: also ship `src/actions/igrp/auth.ts` and `src/lib/utils.ts`. The new logout page imports `getLogoutUrl` from `actions/igrp/auth.ts`, but the last migration to ship that file (04) predated the function — sequential consumers would apply a logout page calling an undefined export. `lib/utils.ts` is refreshed alongside, as `get-session-args.ts` (also new in 10) consumes its `isPreviewMode`/auth-bypass helpers.
