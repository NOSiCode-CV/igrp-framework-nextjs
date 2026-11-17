---
'@igrp/igrp-framework-react-design-system': patch
---

Accessibility follow-up:

- Required labels render the asterisk as `aria-hidden` plus visually hidden "obrigatório" (new `form.required` key), so every labelled control announces it. Date picker triggers and the colour swatch no longer carry `aria-required`, which their roles do not support.
- `IGRPInputFile` dropzone: the hidden file input is out of the accessibility tree and has no English `aria-label` or `id`; its label no longer opens the file dialog on click.
- `IGRPCombobox`: removing a chip moves focus to the next chip, the previous one, or the trigger.
- `IGRPAvatar`: `alt` defaults to `""` (decorative). Pass the person's name when no visible name sits beside it.
- `IGRPTextList`: completed items announce "concluído".
- `IGRPLink`, `IGRPBanner` and `IGRPChat` links that open a new tab say so.
- `IGRPTooltip`: an enabled control is the trigger itself, so its `aria-describedby` points at the tooltip.
- `IGRPDataTableCellCheckbox` / `IGRPDataTableCellSwitch` take an optional `label`; `IGRPDataTableCellExpander` is named by its visible label.
- `IGRPDataTablePaginationNumeric` page buttons are named "Página N" (new `dataTable.goToPage` key).
