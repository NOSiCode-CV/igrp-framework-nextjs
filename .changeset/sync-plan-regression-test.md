---
'@igrp/framework-next': patch
---

test(next): add regression test for sync-plan menu source

Pins `planAccessManagementSync` behavior: `menus` passes through from `args.menus` verbatim, `syncOnCodeMenus` narrows to `false` when omitted and `true` when explicitly set, and the planner returns `null` in preview mode regardless of other settings. Guards against accidental reversion of the on-code-menus push payload source.
