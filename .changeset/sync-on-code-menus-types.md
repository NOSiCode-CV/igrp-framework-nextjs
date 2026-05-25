---
'@igrp/framework-next-types': patch
---

feat(next-types): add `syncOnCodeMenus` and `onCodeMenus` to `apiManagementConfig`

Two new optional fields on `IGRPConfigArgs['apiManagementConfig']`:

- `syncOnCodeMenus?: boolean` — when true, the framework pushes `onCodeMenus` to Access Management at startup.
- `onCodeMenus?: IGRPMenuItemArgs[]` — the template-defined menu array used as the push payload.

Both are optional; omitting them keeps the current (post-migration-08) no-push behavior.
