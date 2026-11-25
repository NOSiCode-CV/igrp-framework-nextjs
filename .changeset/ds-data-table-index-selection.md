---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTable` without `getRowId` now clears an uncontrolled row selection when the rows at those positions change (a refetch, the next server page, a delete). The selection was keyed by row index, so it moved to other records and bulk actions ran on rows the user never ticked. Rows that stay the same objects keep their selection. The development warning about `getRowId` now also fires when selection is used. Pass `getRowId` to keep a selection across data changes.
