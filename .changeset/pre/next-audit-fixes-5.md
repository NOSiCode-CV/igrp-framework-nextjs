---
'@igrp/framework-next': patch
---

In auth-bypass (preview) mode the framework server actions (`fetchMenusAction`, `fetchCurrentUserAction`, …) now return `{ ok: false, code: 'AUTH_BYPASSED' }` when no Access Management credentials are configured, instead of logging an error on every call. `IGRPActionErrorCode` gains `'AUTH_BYPASSED'`, with messages in the pt, en and fr catalogs.
