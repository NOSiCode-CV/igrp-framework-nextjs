---
"@igrp/igrp-framework-react-design-system": patch
---

- `IGRPText`: deprecate the `variant` color prop and stop applying a hard-coded solid color class, so text color now inherits from `className` / semantic tokens instead of being forced to `primary`.
- `IGRPStatusBanner`: drop redundant `cn()` wrappers around static className strings.
