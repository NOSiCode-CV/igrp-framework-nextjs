# Charts

Recharts-based and themed from tokens. Use the `IGRP*Chart` components; drop to the `Chart*` primitives (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent` (takes an IGRP `valueFormatter`), `ChartLegend`, `ChartLegendContent`, `ChartStyle`) plus raw Recharts only for a chart type the kit lacks.

Six charts lazy-load Recharts behind a `Skeleton` fallback (`aspect-video min-h-[200px]`). `IGRPAreaChart` is the exception: it renders eagerly.

| Component | Series prop | Keyed by | Use when |
| --- | --- | --- | --- |
| `IGRPAreaChart` | `areas: IGRPAreaConfig[]` | `categoryKey` | Volume over time, stacked or single. `expanded` = 100% stacked. |
| `IGRPLineChart` | `lines: LineConfig[]` | `categoryKey` | Time series / comparing trends. |
| `IGRPVerticalBarChart` | `bars: IGRPBarConfig[]` | `categoryKey` | Standard column chart. |
| `IGRPHorizontalBarChart` | `bars: IGRPBarConfig[]` | `categoryKey` | Long category labels, rankings. |
| `IGRPPieChart` | `pies: PieConfig[]` | **`nameKey`** (required) | Part-of-whole, ≤6 slices. Otherwise use a bar chart. |
| `IGRPRadarChart` | `radars: IGRPRadarConfig[]` | **`angleAxisKey`** (required) | Multi-axis scores. |
| `IGRPRadialBarChart` | `bars: RadialBarConfig[]` | **`nameKey`** (required) | Progress / goal gauge. |

`categoryKey` is required on the cartesian charts (area, line, bars). It's optional on Pie, Radar and RadialBar, which key off `nameKey` / `angleAxisKey`.

Prop types are exported as `IGRP<Name>ChartProps` (e.g. `IGRPVerticalBarChartProps`), along with `IGRPChartSize`, `IGRPChartLegendPosition`, `IGRPTooltipIndicator`, `IGRPChartFooter` and `LineConfig`.

## Shared props (`IGRPChartProps`)

| Prop | Type / default | Notes |
| --- | --- | --- |
| `data` | `IGRPChartDataItem[]` (`Record<string, string \| number>`) | |
| `categoryKey` | `string` | The X-axis category. Required on cartesian charts. |
| `title`, `description`, `footer` | `string`, `string`, `{ description?: string }` | |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "auto"` = `"md"` | Sets a minimum height (sm 200, md 280, lg 400, xl 500; `auto` is the same as `md`). Height grows by 40px per row, except the vertical bar chart, which stays at the minimum. |
| `height`, `width` | `number \| string` | `height` overrides the size logic. `width` defaults to `"100%"`. |
| `showGrid` | `false` | |
| `showTooltip` | `true` | |
| `tooltipIndicator` | `"line" \| "dot"` = `"line"` | RadialBar ignores it. |
| `legendPosition` | `"top" \| "right" \| "bottom" \| "left" \| "none"` = `"none"` | |
| `customLegend` | `ReactElement \| (props) => ReactNode` | Rendered only when `legendPosition` isn't `"none"`. Pie and RadialBar ignore it. |
| `hideAxis` / `hideXAxis` / `hideYAxis` | `boolean` | Cartesian charts only. |
| `showReferenceZero` | `boolean` | Draws a line at 0 only when the data has negatives. |
| `valueDomain` | `[number, number]` | Default is `[0, "auto"]`, or `["auto", "auto"]` when the data has negatives. |
| `stacked` | `boolean` | Area and the bar charts only. Line ignores it. |
| `valueFormatter` | `(value: number) => string` | **A function, not a preset string.** See "Number formatting". |
| `labelFormatter` | `(value: string) => string` | Formats category ticks. **The vertical bar chart truncates labels to 3 chars by default.** Pass `labelFormatter={(v) => v}` to keep them whole. |
| `gridColor`, `referenceLineColor`, `axisColor`, `backgroundColor` | CSS colour; defaults are `var(--border)`, `var(--border)`, `var(--muted-foreground)` | Pass a token `var(...)` only. |
| `className` | `string` | |

## Series configs

All series extend `IGRPSeriesConfig`: `dataKey` (required), `name?` (legend/tooltip label), `color?`, `stackId?`, `render?`.

- **Colour:** leave `color` out. Series get `IGRP_CHART_COLORS[i % 8]` by position, and those colours are themed for light and dark. When you do pass one, use `IGRP_CHART_COLORS[n]` or a `var(--chart-n)` token, never a hex.
- **Pie / RadialBar:** a `color` on the series paints **every slice** that colour. Leave it out to get per-slice colours.
- **Stacking:** with `stacked` (or Area's `expanded`), series share one stack unless they set `stackId`. Give series different `stackId`s to get side-by-side stacks.
- **Bar radius:** a series' `radius` overrides the chart-level `barRadius`.
- **Keep `dataKey` a plain identifier** (`revenue`, not `"total revenue"` or `a.b`). Area and bar colours resolve through `var(--color-<dataKey>)`.

Per-chart extras:

- **Area:** `expanded?: boolean`. `IGRPAreaConfig` adds `type?: "linear" | "monotone" | "step" | "basis" | "natural"`, `fillOpacity?` (0.4) and `gradient?`.
- **Vertical / horizontal bar:** `barRadius = 5`, `barGap = 8`, `barCategoryGap = "30%"`. The horizontal chart also has `showXAxis = false`, so its value axis is hidden by default.
- **Line:** `LineConfig` adds `type?`, `strokeWidth?` (2), `strokeDasharray?`, `dot?`, `activeDot?` (`{ r: 6 }`), `showLabels?`, `labelPosition?`, `labelOffset?` (12).
- **Pie:** `centerLabel?: { show: boolean; text?: string }` (the centre total sums `pies[0].dataKey` over all rows) and `interactive?`. `PieConfig` adds `innerRadius`, `outerRadius`, `paddingAngle`, `cornerRadius`, `startAngle`, `endAngle`, `cx`, `cy`, `showLabels`, `labelType: "value" | "name" | "percent"`, `labelPosition`, `labelLine` and `activeShape`. Set `innerRadius` for a donut.
- **Radar:** `polarGridType?: "polygon" | "circle"`, `polarGridLineType?`, `showPolarGrid = true`, `showRadiusAxis = false`, `radiusAxisDomain?`, `radiusAxisAngle = 30`, `showRadiusLines = true` and `gridFilled` (tints the grid with `--chart-1`). `IGRPRadarConfig` adds `fill`, `fillOpacity` (0.6), `strokeWidth`, `dot`, `activeDot` and `isAnimationActive`.
- **RadialBar:** `startAngle = 0`, `endAngle = 360`, `innerRadius = "30%"`, `outerRadius = "100%"`, `barSize?`, `gridType = "circle"`, `showBackground?`, `showRadiusAxis?` and `centerText?: { show; value?; label?; formatter? }`. Without `centerText.value`, the centre shows the **first row's** value, not a sum. Pass `value` explicitly. `showGrid` draws the polar grid. `RadialBarConfig` adds `cornerRadius`, `showLabels`, `labelType`, `labelPosition` and `labelStyle`.

Pie, Radar and RadialBar ignore `hideAxis*`, `showReferenceZero`, `valueDomain` and `labelFormatter`.

## Number formatting

- **`valueFormatter` formats everything:** axis ticks, the tooltip, pie/radial labels and centre labels.
- **Without `valueFormatter`:**
  - The tooltip uses `toLocaleString` at the `IGRPI18nProvider` locale (default `pt-PT`).
  - Axis ticks and labels fall back to `formatChartValue`, which is locale-free: `12500 → "12.5K"`, `1_200_000 → "1.2M"`, `1000 → "1.0K"`, below 1000 → `String(value)`.
- So for currency or locale-aware axes, pass a `valueFormatter` built on `Intl.NumberFormat` with an explicit locale. Don't rely on the runtime default locale, because it hydrates mismatched under SSR.

`formatChartValue(value, valueFormatter?)` is exported for reuse. The other exported helpers (`getChartHeight`, `getChartWidth`, `getLegend*`, `hasNegativeValues`, `createChartConfig`) are internals you rarely need.

## Example: dashboard card with a bar chart

The card sub-components are **separate named exports** (`IGRPCardHeader`, `IGRPCardTitle`, `IGRPCardDescription`, `IGRPCardAction`, `IGRPCardContent`, `IGRPCardFooter`). There is no `IGRPCard.Header`.

```tsx
"use client"

import {
  IGRPCard,
  IGRPCardContent,
  IGRPCardDescription,
  IGRPCardHeader,
  IGRPCardTitle,
  IGRPVerticalBarChart,
} from "@igrp/igrp-framework-react-design-system"

const currency = new Intl.NumberFormat("pt-CV", { style: "currency", currency: "CVE", maximumFractionDigits: 0 })

const data = [
  { month: "Janeiro", revenue: 12000, cost: 8000 },
  { month: "Fevereiro", revenue: 18000, cost: 9000 },
]

export function RevenueCard() {
  return (
    <IGRPCard>
      <IGRPCardHeader>
        <IGRPCardTitle>Receita mensal</IGRPCardTitle>
        <IGRPCardDescription>Últimos 6 meses</IGRPCardDescription>
      </IGRPCardHeader>
      <IGRPCardContent>
        <IGRPVerticalBarChart
          data={data}
          categoryKey="month"
          bars={[
            { dataKey: "revenue", name: "Receita" },
            { dataKey: "cost", name: "Custo" },
          ]}
          showGrid
          legendPosition="top"
          valueFormatter={(v) => currency.format(v)}
        />
      </IGRPCardContent>
    </IGRPCard>
  )
}
```

The labels show as `Jan` / `Fev` because of the default 3-char truncation. The colours come from `IGRP_CHART_COLORS` by position.

## Example: donut

```tsx
<IGRPPieChart
  data={[{ estado: "Aprovado", total: 42 }, { estado: "Pendente", total: 12 }, { estado: "Rejeitado", total: 5 }]}
  categoryKey="estado"
  nameKey="estado"
  pies={[{ dataKey: "total", innerRadius: 60 }]}
  centerLabel={{ show: true, text: "Pedidos" }}
  legendPosition="bottom"
/>
```
