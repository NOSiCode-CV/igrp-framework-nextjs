---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDatePickerMultiple`: clearing a field that has a default value now clears it. The clear button used to write `undefined`, which react-hook-form treats as unset, so the default dates came back. It now writes `null`; validate with `z.array(z.date()).nullable()`.
