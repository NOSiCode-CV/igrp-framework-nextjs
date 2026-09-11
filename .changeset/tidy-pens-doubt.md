---
"@igrp/igrp-framework-react-design-system": patch
---

fix(input-color): bind to the form value, and fix disabled / a11y / parsing

`IGRPInputColor` kept the selected color in component state and never read the
field value, so `defaultValues`, `setValue()` and `reset()` never reached the
swatch or the value field — an untouched field could submit a value that did not
match what was on screen.

- The committed color now comes from the field value (or `value` when
  controlled); only the in-progress text edit is local state.
- The displayed format follows the format the stored value declares, so a saved
  `#3b82f6` is no longer rewritten as `oklch(…)` before the user touches it.
  `defaultFormat` applies when the value declares none.
- `disabled` now disables the value field and the format selector too — both
  stayed keyboard-reachable and editable behind a `pointer-events-none` wrapper.
- The visible label is associated with the picker, and `aria-describedby` /
  `aria-invalid` reach the controls instead of the wrapper element.
- User-facing strings moved to the i18n catalog (new `inputColor` group,
  pt-PT defaults) — they were hardcoded in English.
- The value field accepts the full CSS syntax (`rgb(255 0 0 / 50%)`,
  `hsl(210 40% 50%)`, `oklch(62.8% 0.25 29)`, `#rgba` / `#rrggbbaa`, `deg` and
  `%` units; alpha is discarded) and an unparseable entry now shows a message
  instead of silently reverting. Override it with `invalidValueMessage`.
- Unparseable text is published as typed instead of being held back, so the
  field value and the value on screen never disagree and the consumer schema
  decides whether to reject it; the swatch keeps the last color that parsed. The
  built-in message is suppressed when the field already carries an error, so a
  schema message is not doubled up.
- Props declared by the type (`placeholder`, `readOnly`, `inputClassName`, …)
  are forwarded to the value field instead of being dropped.
