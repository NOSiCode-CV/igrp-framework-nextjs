---
'@igrp/template-migrator': patch
---

Adds migration `90-session-focus-refetch-off`. It sets `refetchOnWindowFocus: false` in `src/lib/config/get-session-args.ts`, because `IGRPSessionWatcher` now refreshes on tab focus with a 60-second throttle. Needs `@igrp/framework-next-ui` 0.2.0-beta.22 or later.
