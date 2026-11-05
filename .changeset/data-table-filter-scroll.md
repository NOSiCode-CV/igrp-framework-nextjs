---
"@igrp/igrp-framework-react-design-system": patch
---

Data table filters: `IGRPDataTableFilterFaceted` now scrolls when it has many options (it had no `CommandList`, so the popover grew past the screen), and `IGRPDataTableFilterSelect` caps its list at the same height as `IGRPDataTableFilterDropdown` instead of filling the viewport. `IGRPDataTableClientFilter` accepts a `className` for its wrapper.
