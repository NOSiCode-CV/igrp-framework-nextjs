---
"@igrp/igrp-framework-react-design-system": patch
---

Fix `IGRPButton` icon wiring and chart `className` merging.

**`IGRPButton`**

- Emit `data-icon="inline-start"` / `data-icon="inline-end"` on leading and trailing icons so the button primitive's `has-data-[icon=...]` padding compensation applies. Icon buttons previously rendered with uncompensated horizontal padding.
- Remove the hand-maintained icon size map and let the primitive size icons via its own `[&_svg:not([class*='size-'])]` rules. The map had drifted from the primitive for `lg`, `icon-sm` and `icon-lg`, rendering those icons at the wrong size.
- Use the `Spinner` primitive for the loading state instead of a hand-rolled spinning `IGRPIcon`.
- `asChild` now honours `loading`: the button is disabled, marked `aria-disabled` and made inert while loading. Previously `<IGRPButton asChild loading>` stayed fully interactive.

**Charts**

- `IGRPBarChartHorizontal`, `IGRPBarChartVertical`, `IGRPLineChart`, `IGRPPieChart`, `IGRPRadarChart` and `IGRPRadialChart` now merge the consumer `className` through `cn()` instead of string interpolation, so passed utilities can override the component's own defaults.
