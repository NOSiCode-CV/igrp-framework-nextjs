---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPAvatar` gives its status dot and icon indicator `role="img"`, so their `aria-label` is valid and read out.
`CommandSeparator` (and so `IGRPCommandSeparator`, combobox, multi-select and data-table filter lists) renders with `role="none"` instead of cmdk's `role="separator"`, which a listbox may not contain.
The light `--success` token is darker (`oklch(0.5 0.154 150.069)`, was `0.527`), so soft success text keeps 4.5:1 contrast on a selected or hovered table row.
`IGRPDataTable`'s generated actions column now has a screen-reader header ("Ações", from the `table.actions` i18n key) instead of an empty `<th>`.
