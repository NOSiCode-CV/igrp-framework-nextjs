---
"@igrp/igrp-framework-react-design-system": patch
---

fix(input-number): make decimal input actually typable

`IGRPInputNumber` re-parsed the field on every keystroke and wrote the parsed
number straight back to the input, which dropped the decimal separator ("3." ->
3, so "3.14" became 31) and, for formatted fields, stripped the locale group /
decimal separators ("12,55" + "5" -> 12555).

- The text being typed is now kept as-is until the field is left; the parsed
  value is still published on every keystroke.
- Focusing a formatted field swaps the formatted text for an editable,
  unformatted one (percent fields are edited in percent units) and re-formats
  on blur, so a displayed value can be edited in place.
- Formatted input is parsed with the same locale separators used to display it.
- `min` / `max` are applied on blur instead of per keystroke, so values such as
  15 stay reachable in a field whose `min` is 10.
- Stepper results are rounded to the precision of the step, removing floating
  point drift (12.50 + five 0.01 steps is 12.55, not 12.549999999999999).
