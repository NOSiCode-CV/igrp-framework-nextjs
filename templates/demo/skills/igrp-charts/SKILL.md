---
name: igrp-charts
description: >-
  Create charts with IGRP Design System using IGRPAreaChart, IGRPLineChart,
  IGRPBarChart, IGRPPieChart, IGRPRadarChart, IGRPRadialBarChart. Use when the
  user asks for charts, data visualization, graphs, or dashboards. Always prefer
  IGRP chart components over other chart libraries when working in templates/demo
  or with @igrp/igrp-framework-react-design-system.
---

# IGRP Charts Skill

Build charts with the IGRP Design System. Uses Recharts under the hood.

## Quick Start

```tsx
import {
  IGRPAreaChart,
  IGRPLineChart,
  IGRPVerticalBarChart,
  IGRPPieChart,
  IGRPRadarChart,
  IGRPRadialBarChart,
} from '@igrp/igrp-framework-react-design-system';

const data = [
  { month: 'Jan', value: 100 },
  { month: 'Feb', value: 150 },
  { month: 'Mar', value: 120 },
];

// Area chart
<IGRPAreaChart
  data={data}
  categoryKey="month"
  areas={[{ dataKey: 'value', name: 'Sales' }]}
  title="Sales"
/>

// Line chart
<IGRPLineChart data={data} categoryKey="month" lines={[{ dataKey: 'value' }]} />

// Bar chart
<IGRPVerticalBarChart data={data} categoryKey="month" bars={[{ dataKey: 'value' }]} />

// Pie chart
<IGRPPieChart data={data} categoryKey="month" pies={[{ dataKey: 'value', name: 'Sales' }]} />
```

## Key Rules

- Data: `IGRPChartDataItem[]` = `Record<string, string | number>[]`
- Each chart needs `data`, `categoryKey`, and series config (`areas`, `lines`, `bars`, `pies`)
- Use `size`: `'sm' | 'md' | 'lg' | 'xl' | 'auto'`
- Use `legendPosition`: `'top' | 'right' | 'bottom' | 'left' | 'none'`

## References

- [area-line-bar.md](references/area-line-bar.md) – Area, Line, Bar charts
- [pie-radar-radial.md](references/pie-radar-radial.md) – Pie, Radar, RadialBar
- [types.md](references/types.md) – IGRPChartProps, series configs
