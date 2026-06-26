---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTable` client filter: derive `isFiltered` from the live column-filter
state each render instead of memoizing on the stable `table` reference, so the
Clear-filters button appears after a filter is applied.
