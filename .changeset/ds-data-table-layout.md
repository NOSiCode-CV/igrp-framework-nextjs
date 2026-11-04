---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTable`: cells now truncate below `lg` and wrap from `lg`. Mark a column with `meta.isActionsColumn` to keep it on one line and shrink it to fit; the generated `actions` column already is. `meta.cellClassName` replaces a column's default cell classes. New `layout` prop: `"fixed"` honours `ColumnDef.size`. Column `meta` is typed as `IGRPDataTableColumnMeta` and still accepts the app's own keys. Existing consumers with no `meta` see three changes: body cells wrap from `lg` instead of truncating, headers can wrap from `lg`, and the generated actions column drops its inline width and shrinks to fit.
