---
"@igrp/igrp-framework-react-design-system": patch
---

New `IGRPTooltip` and `IGRPTooltipProvider`. The tooltip opens over a disabled control, on hover and keyboard focus. Data-table row actions use it, so their tooltips now also open when the action is disabled. A labelled trigger, including every existing data-table row action, is wrapped in an `inline-flex` span, and Radix's `aria-describedby` and `data-state` now sit on that span instead of the button.
