---
"@igrp/igrp-framework-react-design-system": patch
---

New `IGRPButtonLink`: a button-shaped `next/link` that shows a spinner while the target route loads, renders a real disabled `<button>` when `disabled`, and takes `tooltip`, `tooltipSide` and `tooltipAlign`. With an icon size, `label` becomes the tooltip and accessible name instead of visible text. New `IGRPLinkPendingIcon` exposes the spinner for custom link controls. The `next` peer dependency is now `^15.3.0`, the first version with `useLinkStatus`.
