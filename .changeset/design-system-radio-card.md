---
'@igrp/igrp-framework-react-design-system': patch
---

Add `IGRPRadioGroup variant="card"` — single choice as option cards (consumer
request §12, `docs/12-igrp-card-radio-group.md`) — and fix the field around it.

- **Option cards.** Each option is a clickable card with its `icon`, `label`,
  `badge` and `description`; the selected look comes from the radio's own
  state, never from a prop. `orientation` picks a responsive 1/2/3-column grid
  (default) or a single column; cards in a row are equal height.
- **Options take `IGRPOptionsProps`.** `IGRPRadioOption` is now a deprecated
  alias of it. `IGRPOptionsProps` gains `badge`, rendered only by option cards.
- **Form writes validate, dirty and touch** (both variants), so a required
  error clears as soon as an option is picked — same as `IGRPMultiSelect`.
- **Grouped as a field set.** The label is a `<legend>` that names the radio
  group; the message is a `FieldError` (`role="alert"`); `data-invalid` is on
  the set and `aria-invalid` on the group.
- **`emptyLabel`** is shown when `options` is empty (pt-PT default "Sem opções
  disponíveis.", overridable via `IGRPI18nProvider` `radioGroup.empty`).
- **`errorText`** now works in controlled mode too; `error` is deprecated.
- Fixed: `className` landed on both the wrapper and the group; option ids
  collided between two groups with the same `name`; a disabled option dimmed
  its whole row including the radio instead of just its text.
