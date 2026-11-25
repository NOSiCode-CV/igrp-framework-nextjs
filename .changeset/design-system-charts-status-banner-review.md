---
"@igrp/igrp-framework-react-design-system": patch
---

Charts and `IGRPStatusBanner` fixes:

- `IGRPStatusBanner` shows the badge beside the text. Before, the badge sat on its own line below the text.
- `IGRPPieChart` colours slices per row in every ring, and the legend lists the rows with the same colours. Before, a pie with `color` painted every slice the same colour, and a pie with several rings had a legend per series that matched no slice. `PieConfig.color` is now ignored and marked `@deprecated`.
- `IGRPRadialBarChart`: the legend uses `bars[0].color` when it is set, like the bars do. The centre total adds up every row and every bar. Before, it read only the first row. The tooltip lists every bar, not only the first.
- `IGRPLineChart` formats point labels with `valueFormatter` and the IGRP locale.
- `IGRPAreaChart` uses the same default `fillOpacity` (0.4) with and without `render`.
- `IGRPRadarChart` sets `accessibilityLayer`, like the other charts.
- Props that no chart reads are marked `@deprecated`: `PieConfig.activeIndex`, `RadialBarConfig.minAngle`, `RadialBarConfig.clockWise` and `IGRPRadarChartProps.showGridLines`. The docs for `render` say that pie, radar and radial ignore it.
