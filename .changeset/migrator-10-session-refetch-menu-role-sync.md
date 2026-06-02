---
"@igrp/template-migrator": patch
---

Add migration `10-session-refetch-and-menu-role-sync` for `demo-legacy`, capturing the template changes since migration 09:

- `IGRP_SESSION_REFETCH_INTERVAL` — configurable client session-refetch cadence (default 180s), replacing the hard-coded 5-minute poll in `src/lib/config/get-session-args.ts`
- `IGRP_SYNC_ON_CODE_MENU_ROLES` — forwards `syncRoles` to the on-code menu push so menu↔role assignments can be reconciled (or left untouched)
- Removes the dead `IGRP_M2M_SCOPE` env var and documents `NEXT_PUBLIC_IGRP_SETTINGS_URL`
- Logout-hang fix, sidebar-visibility correction (`showSidebar` default), and design-system token/theme alignment
- `deps.bump` to `framework-next@0.1.0-beta.142`, `framework-next-types@0.1.0-beta.136`, `framework-next-ui@0.1.0-beta.141`, `platform-access-management-client-ts@0.2.0-beta.10`
