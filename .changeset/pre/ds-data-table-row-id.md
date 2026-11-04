---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTable`: new `getRowId` prop; without it, expanded rows followed the row index and opened a different record when `data` was reordered or replaced (server-side sorting or paging, a refetch). Warns in development when `renderSubComponent` is used without it.
