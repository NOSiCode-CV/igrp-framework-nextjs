---
"@igrp/igrp-framework-react-design-system": patch
---

Default chart grid/axis/reference colors to semantic tokens instead of hardcoded
hex (`#e5e7eb`/`#d1d5db`). `gridColor`/`referenceLineColor` now default to
`var(--border)` and `axisColor` to `var(--muted-foreground)` across area, line,
radar, radial, and bar charts, so gridlines and axes adapt to dark mode without
per-chart overrides. The color props remain overridable.
