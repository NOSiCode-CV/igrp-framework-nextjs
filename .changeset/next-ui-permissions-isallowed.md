---
"@igrp/framework-next-ui": patch
---

`usePermissions()` now exposes `isAllowed(name)` instead of `can(name)` — a clearer name for the permission-check function. `<IGRPAuthorization>` and `<IGRPGuardPage>` are updated accordingly. This is a breaking rename to the permission-gating client API; consumers calling `usePermissions().can(...)` must switch to `.isAllowed(...)`.
