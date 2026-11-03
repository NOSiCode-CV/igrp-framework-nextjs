---
"@igrp/igrp-framework-react-design-system": patch
---

New `IGRPLookupField`: an input whose value is picked through an adjacent button (`onLookup`) rather than typed. With `valueName` it renders the hidden value input and shows that field's validation error under the visible one. `onClear` adds a clear button that writes `null` to both fields. `inputDisabled` and `lookupDisabled` are independent, `lookupDisabledReason` shows a tooltip over the disabled button, and `loading` swaps its icon for a spinner.
