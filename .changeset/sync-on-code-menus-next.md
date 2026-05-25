---
'@igrp/framework-next': patch
---

feat(next): gate AM menu push on `IGRP_SYNC_ON_CODE_MENUS`

`igrpSyncMenus` now requires a `syncEnabled` arg. When `false`, the push is skipped and a `console.info` line is emitted. `IGRPRootLayout` sources the push payload from `apiManagementConfig.onCodeMenus` instead of the AM-loaded sidebar menus, so the push is meaningful (template-defined array → AM) rather than a no-op echo.

Outer sync gating on `IGRP_SYNC_ACCESS` / `IGRP_PREVIEW_MODE` is unchanged.
