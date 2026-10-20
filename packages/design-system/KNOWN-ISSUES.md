# Known issues — design-system

## IGRPDataTable row selection can't be read or controlled

`enableRowSelection: true` is hard-coded in `src/components/horizon/data-table/index.tsx`. The `rowSelection` / `onRowSelectionChange` props are commented out (search for `// rowSelection,`). So `IGRPDataTableCellCheckbox`, `IGRPDataTableCellSwitch` and `IGRPDataTableHeaderRowsSelect` only toggle internal state that no consumer can observe. `IGRPDataTableHeaderRowsSelect` also shows page-scoped checked state but calls `toggleAllRowsSelected` across every row (`header.tsx`).

Not fixed because it is new API, not a bug fix: decide the shape first. It could be controlled `rowSelection` + `onRowSelectionChange` (TanStack's), a `getRowId` for stable keys, and/or an `onSelectionChange(rows)` convenience. Then make select-all page-scoped or document it.

Workaround (documented in `plugins/igrp/skills/design-system/references/data-table.md`): keep selected ids in app state and render an `IGRPCheckbox` in a display column.
