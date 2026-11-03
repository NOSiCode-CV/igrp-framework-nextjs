---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTable`: new `getRowId` prop; without it, expanded rows followed the row index across sorting and paging. Warns in development when `renderSubComponent` is used without it.
