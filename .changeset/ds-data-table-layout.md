---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTable`: cells now truncate below `lg` and wrap from `lg`. Mark a column with `meta.isActionsColumn` to keep it on one line and shrink it to fit; the generated `actions` column already is. `meta.cellClassName` replaces a column's default cell classes. New `layout` prop: `"fixed"` honours `ColumnDef.size`. Column `meta` is typed as `IGRPDataTableColumnMeta`.
