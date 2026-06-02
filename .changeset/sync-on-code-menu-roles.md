---
'@igrp/framework-next-types': patch
'@igrp/framework-next': patch
---

feat: gate menu-role sync on `IGRP_SYNC_ON_CODE_MENU_ROLES`

The on-code menu push can now control the `syncRoles` argument of
`client.m2m.syncApplicationMenus(appCode, menus, syncRoles)`.

- **next-types**: new optional `apiManagementConfig.syncOnCodeMenuRoles?: boolean`. Defaults to `true` (matching the AM client default) when omitted.
- **next**: `igrpSyncMenus` now requires a `syncRoles` arg and forwards it as the third parameter of `syncApplicationMenus`; `planAccessManagementSync` derives `syncOnCodeMenuRoles` from config (`true` unless explicitly `false`) and `igrpStartupSync` threads it through.

Only consulted when the on-code menu push actually runs (`IGRP_SYNC_ON_CODE_MENUS=true` plus the outer `IGRP_SYNC_ACCESS` / `IGRP_PREVIEW_MODE` gates). Outer gating is unchanged.
