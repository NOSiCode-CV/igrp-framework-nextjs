---
"@igrp/igrp-framework-react-design-system": patch
---

charts: migrate to recharts 3. The chart primitives (`ChartContainer`/`ChartTooltipContent`/`ChartLegendContent`) are re-synced with upstream shadcn for the recharts 3 type surface (`DefaultTooltipContentProps`/`DefaultLegendContentProps`, `ResponsiveContainer` `initialDimension`). Horizon chart fixes for recharts 3 breaking changes: pie drops the removed `Pie.activeIndex` prop (interactive active segment is now driven by hover/tooltip state); pie and radial manual legends move from the removed `<Legend payload>` prop to the `content` render prop via a shared `ChartCustomLegend`; radial `LabelList.formatter` is rewritten for the new `(value) => …` signature (previously received `{ payload }`). `recharts` peer dependency is now `3.8.1`.
