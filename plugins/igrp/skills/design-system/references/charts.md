# Charts

Recharts-based, token-themed, lazy-loaded (recharts is heavy — each `IGRP*Chart` wraps a `Suspense` + `React.lazy`). Always use the `IGRP*Chart` components — never instantiate Recharts directly in app code.

## Components

| Component | Use when |
| --- | --- |
| `IGRPAreaChart` | Stacked or single-series area over time. |
| `IGRPLineChart` | Time series or comparison lines; `LineConfig[]` for multi-series. |
| `IGRPHorizontalBarChart` | Bars when category labels are long. |
| `IGRPVerticalBarChart` | Standard column chart. |
| `IGRPPieChart` | Part-of-whole when ≤6 slices. Avoid for >6 — use a bar chart. |
| `IGRPRadarChart` | Multi-axis comparison (skills, scores). |
| `IGRPRadialBarChart` | Goal/progress in a circular gauge form. |

## Shared props (`IGRPChartProps`)

Every chart extends this base. The series-specific props (`bars`, `areas`, `lines`, etc.) are per-chart.

| Prop | Type | Notes |
| --- | --- | --- |
| `data` | `IGRPChartDataItem[]` (`Record<string, string \| number>`) | Series points. |
| `categoryKey` | `string` | The key in `data` that names the X-axis category (e.g. `"month"`). |
| `title`, `description` | `string` | Optional in-chart title/description. |
| `showGrid` | `boolean` | Default `false`. |
| `showTooltip` | `boolean` | Default `true`. |
| `legendPosition` | `"top" \| "right" \| "bottom" \| "left" \| "none"` | Default `"none"`. |
| `customLegend` | `ReactElement \| ((props) => ReactNode)` | Override the legend. |
| `hideAxis` / `hideXAxis` / `hideYAxis` | `boolean` | |
| `showReferenceZero` | `boolean` | Reference line at y=0 for charts with negative values. |
| `valueDomain` | `[number, number]` | Force y-axis range. |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "auto"` | Default `"md"`. |
| `height`, `width` | `number \| string` | Override responsive defaults. |
| `stacked` | `boolean` | Stack series instead of grouping. |
| `valueFormatter` | `(value: number) => string` | **A function**, not a preset string. Use `formatChartValue` as a helper. |
| `labelFormatter` | `(value: string) => string` | Customize category labels (e.g. truncate month names). |
| `tooltipIndicator` | `"line" \| "dot"` | Default `"line"`. |
| `footer` | `{ description?: string }` | Footer slot. |
| `className` | `string` | |

## Series configs

Each chart takes an array of series under its own prop name:

- `IGRPVerticalBarChart` / `IGRPHorizontalBarChart`: `bars: IGRPBarConfig[]`
- `IGRPAreaChart`: `areas: IGRPAreaConfig[]`
- `IGRPLineChart`: `lines: LineConfig[]`
- `IGRPRadarChart`: `radars: IGRPRadarConfig[]`
- `IGRPRadialBarChart`: `bars: RadialBarConfig[]`
- `IGRPPieChart`: see component for its `PieConfig` (single-series).

Every series config extends `IGRPSeriesConfig`:

```ts
interface IGRPSeriesConfig {
  dataKey: string        // key in data for this series
  name?: string          // display label (defaults to dataKey)
  color?: string         // hex or CSS var; default picks from IGRP_CHART_COLORS
  stackId?: string       // for stacked charts
  render?: (props) => ReactNode  // custom render
}
```

`IGRPBarConfig` adds `radius?: number`. `IGRPAreaConfig` adds curve `type`, `fillOpacity`, `gradient`. See `packages/design-system/src/components/horizon/charts/types.ts` for the rest.

## Colors — `IGRP_CHART_COLORS`

An array of CSS-variable strings (`var(--chart-1)` … `var(--chart-8)`), themed for light + dark.

```ts
import { IGRP_CHART_COLORS } from "@igrp/igrp-framework-react-design-system"

bars={[
  { dataKey: "revenue", name: "Receita", color: IGRP_CHART_COLORS[0] },
  { dataKey: "cost",    name: "Custo",   color: IGRP_CHART_COLORS[1] },
]}
```

**Never hand-pick hex codes** — the colors are themed for both light and dark mode.

You can also omit `color` entirely; `createChartConfig` (called internally) will assign `IGRP_CHART_COLORS[i]` by position. Only pass `color` when you want a non-default assignment.

## Helpers

- `formatChartValue(value, valueFormatter?)` — fallback formatter. If `valueFormatter` is provided it's called; otherwise compacts thousands/millions (`12500 → "12.5K"`, `1_200_000 → "1.2M"`). Use this *inside* a custom `valueFormatter` if you want to layer formatting.
- `getChartHeight(size, data?, height?)` / `getChartWidth(width?)` — height defaults per `size` preset, with override.
- `getLegendLayout(position)` / `getLegendVerticalAlign(position)` / `getLegendHorizontalAlign(position)` — legend layout helpers (used internally; rarely needed in app code).
- `createChartConfig(series)` — produces a shadcn `ChartConfig` from an `IGRPSeriesConfig[]` (called internally; rarely needed in app code).
- `hasNegativeValues(data, dataKeys)` — utility for axis logic.

## Example: vertical bar chart

```tsx
"use client"
import {
  IGRPVerticalBarChart,
  IGRP_CHART_COLORS,
} from "@igrp/igrp-framework-react-design-system"

const data = [
  { month: "Jan", revenue: 12000, cost: 8000 },
  { month: "Fev", revenue: 18000, cost: 9000 },
  // …
]

<IGRPVerticalBarChart
  data={data}
  categoryKey="month"
  bars={[
    { dataKey: "revenue", name: "Receita", color: IGRP_CHART_COLORS[0] },
    { dataKey: "cost",    name: "Custo",   color: IGRP_CHART_COLORS[1] },
  ]}
  showGrid
  legendPosition="top"
  valueFormatter={(v) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "CVE", maximumFractionDigits: 0 }).format(v)
  }
/>
```

## Charts inside an `IGRPCard`

Standard pattern for dashboards. **Card sub-components are separate exports, not dot-notation properties:**

```tsx
"use client"
import {
  IGRPCard,
  IGRPCardHeader,
  IGRPCardTitle,
  IGRPCardDescription,
  IGRPCardContent,
  IGRPVerticalBarChart,
  IGRP_CHART_COLORS,
} from "@igrp/igrp-framework-react-design-system"

<IGRPCard>
  <IGRPCardHeader>
    <IGRPCardTitle>Receita mensal</IGRPCardTitle>
    <IGRPCardDescription>Últimos 12 meses</IGRPCardDescription>
  </IGRPCardHeader>
  <IGRPCardContent>
    <IGRPVerticalBarChart
      data={data}
      categoryKey="month"
      bars={[{ dataKey: "revenue", name: "Receita", color: IGRP_CHART_COLORS[0] }]}
    />
  </IGRPCardContent>
</IGRPCard>
```

> `IGRPCard.Header`, `IGRPCard.Content` etc. **do not exist** — the card sub-components are top-level exports. Always import them by name.
