---
"@igrp/framework-next": patch
---

`igrpBuildConfig` now canonicalizes `appCode` (trim + uppercase) in the returned config, so the Access Management sync and the read paths (menu/app fetch hooks and their cache keys) always see the same uppercase form. Previously only the sync path normalized, so a lowercase `IGRP_APP_CODE` could register the app as `APP_X` while reads queried `app_x`. Configs whose `appCode` is already canonical are returned unchanged (same object identity).
