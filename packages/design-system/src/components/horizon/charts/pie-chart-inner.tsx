"use client"

import {
  Pie,
  PieChart,
  Sector,
  Cell,
  Label,
  Legend,
  type LabelProps,
  type LegendType,
  type PieLabelRenderProps,
} from "recharts"
import { IGRPChartDataTable } from "./data-table-sr.js"
import type { PieSectorDataItem } from "recharts/types/polar/Pie"
import React, { useState, type SVGAttributes, useId } from "react"

import { cn } from "../cn.js"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../primitives/chart.js"
import { ChartCustomLegend } from "./custom-legend.js"
import type { IGRPChartProps, PieConfig } from "./types.js"
import {
  createChartConfig,
  formatChartValue,
  getChartHeight,
  getChartWidth,
  getLegendHorizontalAlign,
  getLegendLayout,
  getLegendVerticalAlign,
  chartFigureA11y,
  IGRP_CHART_COLORS,
} from "./lib.js"
import { igrpFormatMessage, useIGRPi18n, useIGRPLocale } from "../../../i18n/index.js"

const sliceColor = (index: number) => IGRP_CHART_COLORS[index % IGRP_CHART_COLORS.length]

/**
 * Props for the IGRPPieChart component.
 * @see IGRPPieChart
 */
export interface IGRPPieChartProps extends Omit<IGRPChartProps, "categoryKey"> {
  /** Unused by polar charts; kept optional for call sites that already pass it. */
  categoryKey?: string
  pies: PieConfig[]
  nameKey: string
  centerLabel?: {
    show: boolean
    text?: string
  }
  interactive?: boolean
}

/**
 * Pie chart with optional center label, labels, and interactive hover.
 * Loaded dynamically for code splitting (recharts is heavy).
 */
function IGRPPieChartInner({
  data,
  pies,
  nameKey,
  title,
  description,
  legendPosition = "none",
  showTooltip = true,
  size = "md",
  height,
  width,
  className,
  valueFormatter,
  backgroundColor,
  tooltipIndicator = "line",
  footer,
  centerLabel = { show: false, text: "" },
  interactive = false,
}: IGRPPieChartProps) {
  const [activeIndex, setActiveIndex] = useState(-1)

  const chartHeight = getChartHeight(size, [], height)
  const chartWidth = getChartWidth(width)
  const locale = useIGRPLocale()
  const i18n = useIGRPi18n()
  const formatValue = (value: number) => formatChartValue(value, valueFormatter, locale)
  const chartConfig = createChartConfig(pies)

  const totalValue = React.useMemo(() => {
    if (!centerLabel.show || !pies.length || !data.length) return 0

    return data.reduce((sum, entry) => {
      const key = pies[0]?.dataKey
      if (!key) return 0
      return sum + Number(entry[key] ?? 0)
    }, 0)
  }, [centerLabel.show, data, pies])

  const legendPayload = React.useMemo(() => {
    if (legendPosition === "none" || !pies.length || !data.length) return []

    // Slices are coloured per row in every ring, so the legend lists rows, not series.
    return data.map((entry, index) => ({
      value: entry[nameKey] || igrpFormatMessage(i18n.charts.itemFallback, { index: index + 1 }),
      type: "square" as LegendType,
      color: sliceColor(index),
      payload: { ...entry, strokeDasharray: "" },
    }))
  }, [pies.length, data, nameKey, legendPosition, i18n])

  const renderActiveShape = (props: PieSectorDataItem) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={(outerRadius as number) + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={(outerRadius as number) + 10}
          outerRadius={(outerRadius as number) + 20}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.4}
        />
      </g>
    )
  }

  const renderCustomLabel = (props: PieLabelRenderProps & Pick<PieConfig, "labelType" | "labelPosition">) => {
    const { cx, cy, midAngle = 0, innerRadius, outerRadius, value, name, percent, labelType, labelPosition } = props

    if (!cx || !cy) return null

    const RADIAN = Math.PI / 180

    const isOutside = labelPosition === "outside"
    const radius = isOutside
      ? (outerRadius || 0) + 30
      : innerRadius && outerRadius
        ? innerRadius + (outerRadius - innerRadius) / 2
        : (outerRadius || 0) * 0.7
    const textAnchor: SVGAttributes<SVGTextElement>["textAnchor"] = isOutside
      ? midAngle > 270 || midAngle < 90
        ? "start"
        : "end"
      : "middle"

    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    let content: string
    switch (labelType) {
      case "name":
        content = name || ""
        break
      case "percent":
        content = percent ? `${(percent * 100).toFixed(0)}%` : "0%"
        break
      case "value":
      default:
        content = value !== undefined ? formatValue(value) : ""
    }

    return (
      <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" className={cn("fill-foreground text-xs")}>
        {content}
      </text>
    )
  }

  const renderCenterLabel = ({ viewBox }: LabelProps) => {
    if (!centerLabel.show || !viewBox || !("cx" in viewBox)) return null

    return (
      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
        <tspan x={viewBox.cx} y={viewBox.cy} className={cn("fill-foreground text-3xl font-bold")}>
          {formatValue(
            interactive && activeIndex >= 0 && activeIndex < data.length && pies[0]?.dataKey
              ? Number(data[activeIndex]?.[pies[0].dataKey] ?? 0)
              : totalValue
          )}
        </tspan>
        {centerLabel.text && (
          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className={cn("fill-muted-foreground")}>
            {centerLabel.text}
          </tspan>
        )}
      </text>
    )
  }

  const a11y = chartFigureA11y(useId(), title, description)

  return (
    <div
      className={cn("w-full overflow-hidden", className)}
      style={backgroundColor ? { backgroundColor } : undefined}
      {...a11y.figure}
    >
      {(title || description) && (
        <div className={cn("pb-3")}>
          {title && (
            <div id={a11y.titleId} className={cn("text-xl font-semibold")}>
              {title}
            </div>
          )}
          {description && (
            <div id={a11y.descriptionId} className={cn("text-sm text-muted-foreground")}>
              {description}
            </div>
          )}
        </div>
      )}

      <div className={cn("overflow-hidden")}>
        <div style={{ height: chartHeight, width: chartWidth }} className={cn("w-full overflow-hidden")}>
          <IGRPChartDataTable data={data} rowKey={nameKey} series={pies} />
          <ChartContainer className={cn("h-full w-full")} config={chartConfig}>
            <PieChart
              accessibilityLayer
              margin={{
                top: 20,
                right: 12,
                left: 12,
                bottom: 5,
              }}
            >
              {showTooltip && (
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator={tooltipIndicator} valueFormatter={valueFormatter} />}
                />
              )}

              {legendPosition !== "none" && (
                <Legend
                  verticalAlign={getLegendVerticalAlign(legendPosition)}
                  align={getLegendHorizontalAlign(legendPosition)}
                  layout={getLegendLayout(legendPosition)}
                  wrapperStyle={{ paddingTop: 10 }}
                  content={() => <ChartCustomLegend payload={legendPayload} />}
                />
              )}

              {pies.map((pie, pieIndex) => (
                <Pie
                  key={pie.dataKey}
                  data={data}
                  dataKey={pie.dataKey}
                  nameKey={nameKey}
                  cx={pie.cx ?? "50%"}
                  cy={pie.cy ?? "50%"}
                  innerRadius={pie.innerRadius || 0}
                  outerRadius={pie.outerRadius}
                  paddingAngle={pie.paddingAngle || 0}
                  cornerRadius={pie.cornerRadius || 0}
                  startAngle={pie.startAngle ?? 0}
                  endAngle={pie.endAngle ?? 360}
                  activeShape={pie.activeShape ? renderActiveShape : undefined}
                  onMouseEnter={interactive ? (_, index) => setActiveIndex(index) : undefined}
                  onMouseLeave={interactive ? () => setActiveIndex(-1) : undefined}
                  label={
                    pie.showLabels
                      ? (props) =>
                          renderCustomLabel({
                            ...props,
                            labelType: pie.labelType,
                            labelPosition: pie.labelPosition,
                          })
                      : false
                  }
                  labelLine={pie.labelLine}
                >
                  {data.map((item, index) => {
                    const cellKey =
                      (item as Record<string, unknown>).id ??
                      (item as Record<string, unknown>)[nameKey] ??
                      `cell-${index}`
                    return <Cell key={String(cellKey)} fill={sliceColor(index)} />
                  })}

                  {pieIndex === 0 && centerLabel.show && <Label content={renderCenterLabel} />}
                </Pie>
              ))}
            </PieChart>
          </ChartContainer>
        </div>
      </div>

      {footer && (
        <div className={cn("flex-col items-start gap-2 pt-4 text-sm")}>
          {footer.description && <div className={cn("leading-none text-muted-foreground")}>{footer.description}</div>}
        </div>
      )}
    </div>
  )
}

export default IGRPPieChartInner
