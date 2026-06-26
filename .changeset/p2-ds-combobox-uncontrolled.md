---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPCombobox`: default `value` to `undefined` instead of `""` so standalone
uncontrolled usage persists the selection (previously the `localValue` path was
dead and the selection never displayed).
