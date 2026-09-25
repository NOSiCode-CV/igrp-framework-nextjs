---
'@igrp/igrp-framework-react-design-system': patch
---

Add `IGRPMultiSelect`, a multi-value choice field whose value is always a
`string[]` (consumer request §11, `docs/11-igrp-multi-select.md`).

- **The selection survives the round trip.** An initial `["A","B"]` renders as
  two picks, and `getValues(name)` right after a click returns the new array.
  Each write starts from the form's current value, not the value at render
  time, so two edits in the same tick (removing two chips quickly) both land.
- **Option order, not click order.** The value is always sorted in option
  order, so a reopened record shows picks in the order they were saved.
  Codes that no current option carries (options still loading, or a retired
  code) are kept after the options and shown as raw-code chips. They are never
  dropped. A bare string is read as a one-item selection.
- **Validates like a field.** Picking marks the field dirty and touched and
  revalidates, so a required error clears as soon as something is picked.
  Closing the popover also marks the field touched.
- **Non-modal popover** with a checkbox per option. Search appears from 8
  options up (`showSearch` overrides it). The footer shows an `x de y` tally
  and "Selecionar tudo" / "Limpar"; "select all" is not offered when
  `maxSelected` is set. Option `icon`, `description`, `status`, `color`,
  `group` and the new `IGRPOptionsProps.disabled` render when present.
- **Chips below the trigger**, each with its own remove button, so no
  interactive control is nested inside the trigger `<button>`. Use `hideChips`
  for dense layouts.
- Form-bound inside `IGRPForm` by `name`, or controlled with `value` /
  `onChange`. Strings come from a new `multiSelect` i18n group with pt-PT
  defaults, and each can be overridden by a prop.

`IGRPCombobox variant="multiple"` is deprecated in favour of `IGRPMultiSelect`.
It logs a one-time warning in development and will be removed at 0.1.0 stable.
See `packages/design-system/docs/adr/0001-multi-select-separate-from-combobox.md`.
