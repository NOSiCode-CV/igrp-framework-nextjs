---
'@igrp/igrp-framework-react-design-system': patch
---

`IGRPDataTable` row selection can be read and controlled.

- `rowSelection` + `onRowSelectionChange` control it in TanStack's shape (`{ [rowId]: true }` and an updater callback, so `useState`'s setter fits). `onRowSelectionChange` alone observes an uncontrolled table.
- `onSelectionChange(rows)` receives the selected rows' data on every change, not on mount.
- Behaviour change: `IGRPDataTableHeaderRowsSelect` now selects and clears the current page only, matching the checked state it already showed. It used to select every row across all pages.
