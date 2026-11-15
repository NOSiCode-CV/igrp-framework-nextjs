---
'@igrp/framework-next': patch
---

`igrpBuildConfig` requires `appCode` again only when `syncAccess` is on and preview is off. An app without `IGRP_APP_CODE` gets the sidebar's own `IGRP_APP_CODE_MISSING` error instead of `global-error` on every route, `/login` included. `getDisplayableErrorMessage` no longer returns a raw `error.message` in production.

`IGRPLayoutFull` restores the sidebar open state from the `sidebar_state` cookie the design-system sidebar writes on toggle. An explicit `defaultSidebarOpen` still wins; with neither, the sidebar opens.
