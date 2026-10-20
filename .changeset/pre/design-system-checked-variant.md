---
'@igrp/igrp-framework-react-design-system': patch
---

Fix checked styling on radios, checkboxes, switches and radio-card labels.

The primitives style checked state with `data-checked:` / `data-unchecked:`, but
they wrap Radix, which only emits `data-state="checked" | "unchecked"` — so the
radio fill, the checkbox fill, the switch thumb position and the `FieldLabel`
selected surface never applied. `tokens.css` now widens both variants to also
match `data-state` (ADR 0002). Apps that import `/tokens` pick this up on their
next Tailwind build; no code changes needed.
