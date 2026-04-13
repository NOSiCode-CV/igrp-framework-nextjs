/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React from "react"
import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
  LabelList,
  Legend,
  Cell,
  type LegendType,
} from "recharts"

import { cn } from "../../../../lib/utils"
import { ChartContainer, ChartTooltip } from "../../../primitives/chart"
import {
  createChartConfig,
  formatChartValue,
  getChartHeight,
  getChartWidth,
  getLegendHorizontalAlign,
  getLegendLayout,
  getLegendVerticalAlign,
} from "../lib"
import { type IGRPChartProps, type RadialBarConfig } from "../types"

/**
 * Props for the IGRPRadialBarChart component.
 * @see IGRPRadialBarChart
 */
export interface IGRPRadialBarChartProps extends IGRPChartProps {
  /** Radial bar series configurations. */
  bars: RadialBarConfig[]
  /** Key in data for bar labels. */
  nameKey: string
  /** Start angle (degrees). */
  startAngle?: number
  /** End angle (degrees). */
  endAngle?: number
  /** Inner radius. */
  innerRadius?: number | string
  /** Outer radius. */
  outerRadius?: number | string
  /** Bar thickness. */
  barSize?: number
  /** Show polar grid. */
  showGrid?: boolean
  /** Grid type. */
  gridType?: "polygon" | "circle"
  /** Show bar background. */
  showBackground?: boolean
  /** Show radius axis. */
  showRadiusAxis?: boolean
  /** Center text config (e.g. total value). */
  centerText?: {
    show: boolean
    value?: string | number
    label?: string
    formatter?: (value: number) => string
  }
}

function RadialChartHeader({ title, description }: { title?: string; description?: string }) {
  if (!title && !description) return null
  return (
    <div className={cn("pb-3")}>
      {title && <div className={cn("text-xl font-semibold")}>{title}</div>}
      {description && <div className={cn("text-sm text-muted-foreground")}>{description}</div>}
    </div>
  )
}

function CenterLabelContent({
  formattedTotal,
  label,
  viewBox,
}: {
  formattedTotal: string
  label?: string
  viewBox?: Record<string, unknown>
}) {
  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null
  const cx = viewBox.cx as number
  const cy = viewBox.cy as number
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} y={cy} className={cn("fill-foreground text-3xl font-bold")}>
        {formattedTotal}
      </tspan>
      {label && (
        <tspan x={cx} y={cy + 24} className={cn("fill-muted-foreground")}>
          {label}
        </tspan>
      )}
    </text>
  )
}

function RadialChartTooltipContent({
  payload,
  nameKey,
  formatValue,
}: {
  payload: Array<{ payload?: any; value?: unknown }>
  nameKey: string
  formatValue: (v: number) => string
}) {
  if (!payload?.length) return null
  const item = payload[0]?.payload
  const value = payload[0]?.value
  if (!item) return null
  const name = item[nameKey]
  const fill = item._fill
  return (
    <div className={cn("rounded-lg border bg-background p-2 shadow-md")}>
      <div className={cn("flex flex-col gap-1")}>
        <div className={cn("text-sm font-medium")}>{name}</div>
        <div className={cn("flex items-center gap-2")}>
          <div className={cn("h-3 w-3 rounded-full")} style={{ backgroundColor: fill }} />
          <span className={cn("text-sm")}>{formatValue(Number(value))}</span>
        </div>
      </div>
    </div>
  )
}

function RadialChartFooter({ description }: { description?: string }) {
  if (!description) return null
  return (
    <div className={cn("flex-col items-start gap-2 text-sm pt-4")}>
      <div className={cn("leading-none text-muted-foreground")}>{description}</div>
    </div>
  )
}

/**
 * Radial bar chart with optional center text and polar grid.
 * Loaded dynamically for code splitting (recharts is heavy).
 */
function IGRPRadialBarChartInner({
  data,
  bars,
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
  gridColor = "#e5e7eb",
  backgroundColor,
  footer,
  startAngle = 0,
  endAngle = 360,
  innerRadius = "30%",
  outerRadius = "100%",
  barSize,
  showGrid = false,
  gridType = "circle",
  showBackground = false,
  showRadiusAxis = false,
  centerText = { show: false },
}: IGRPRadialBarChartProps) {
  const chartHeight = getChartHeight(size, data, height)
  const chartWidth = getChartWidth(width)
  const formatValue = React.useCallback((value: number) => formatChartValue(value, valueFormatter), [valueFormatter])
  const chartConfig = createChartConfig(bars)

  const calculateTotal = () => {
    if (!centerText.show || data.length === 0 || bars.length === 0) return 0

    if (centerText.value !== undefined) {
      return Number(centerText.value)
    }

    const firstRow = data[0]
    if (!firstRow) return 0

    if (bars.length === 1) {
      const key = bars[0]?.dataKey
      return Number(firstRow?.[key ?? ""] ?? 0)
    }

    return bars.reduce((sum, bar) => {
      const key = bar?.dataKey
      return sum + Number(firstRow?.[key ?? ""] ?? 0)
    }, 0)
  }

  const totalValue = calculateTotal()
  const formattedTotal = centerText.formatter ? centerText.formatter(totalValue) : formatValue(totalValue)

  const computePercent = (entry: any, dataKey: string, data: any[]): string => {
    const total = data.reduce((sum, item) => sum + Number(item[dataKey] || 0), 0)
    if (total === 0) return "0%"
    const percent = ((Number(entry[dataKey] || 0) / total) * 100).toFixed(0)
    return `${percent}%`
  }

  const formatLabel = (entry: any, dataKey: string, type: "value" | "name" | "percent" = "value") => {
    if (!entry) return ""

    switch (type) {
      case "name":
        return entry[nameKey] || ""
      case "percent":
        try {
          return computePercent(entry, dataKey, data)
        } catch {
          return "0%"
        }
      case "value":
      default:
        return formatValue(Number(entry[dataKey] || 0))
    }
  }

  const legendPayload = React.useMemo(() => {
    if (legendPosition === "none" || !bars.length || !data.length) return []

    if (bars.length === 1 && data.length > 1) {
      return data.map((entry, index) => ({
        value: entry[nameKey] || `Item ${index + 1}`,
        type: "square" as LegendType,
        color: `var(--chart-${(index % 8) + 1})`,
        payload: { ...entry, strokeDasharray: "" },
      }))
    }

    return bars.map((bar, index) => ({
      value: bar.name || bar.dataKey || `Series ${index + 1}`,
      type: "square" as LegendType,
      color: bar.color || `var(--chart-${(index % 8) + 1})`,
      payload: { dataKey: bar.dataKey, strokeDasharray: "" },
    }))
  }, [bars, data, nameKey, legendPosition])

  const enhancedData = React.useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      _fill: bars[0]?.color || `var(--chart-${(index % 8) + 1})`,
    }))
  }, [data, bars])

  const tooltipContent = React.useCallback(
    (props: { active?: boolean; payload?: Array<{ payload?: any; value?: unknown }> }) => {
      if (!props.active || !props.payload || !props.payload.length) return null
      return <RadialChartTooltipContent payload={props.payload} nameKey={nameKey} formatValue={formatValue} />
    },
    [nameKey, formatValue],
  )

  const centerLabelContent = React.useCallback(
    (props: any) =>
      props?.viewBox ? (
        <CenterLabelContent formattedTotal={formattedTotal} label={centerText.label} viewBox={props.viewBox} />
      ) : null,
    [formattedTotal, centerText.label],
  )

  return (
    <div
      className={`w-full overflow-hidden ${className || ""}`}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <RadialChartHeader title={title} description={description} />

      <div className={cn("overflow-hidden")}>
        <div style={{ height: chartHeight, width: chartWidth }} className={cn("w-full overflow-hidden")}>
          <ChartContainer className={cn("h-full w-full")} config={chartConfig}>
            <RadialBarChart
              data={enhancedData}
              startAngle={startAngle}
              endAngle={endAngle}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              barSize={barSize}
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
              }}
            >
              {showTooltip && <ChartTooltip cursor={false} content={tooltipContent} />}

              {showGrid && <PolarGrid gridType={gridType} stroke={gridColor} />}

              {showRadiusAxis && (
                <PolarRadiusAxis tick tickFormatter={formatValue} stroke={gridColor}>
                  {centerText.show && <Label content={centerLabelContent} />}
                </PolarRadiusAxis>
              )}

              {!showRadiusAxis && centerText.show && (
                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                  <Label content={centerLabelContent} />
                </PolarRadiusAxis>
              )}

              {bars[0] && (
                <RadialBar
                  dataKey={bars[0].dataKey}
                  background={showBackground}
                  cornerRadius={bars[0].cornerRadius}
                  stackId={bars[0].stackId}
                  className={cn("stroke-transparent stroke-2")}
                  name={bars[0].name || bars[0].dataKey}
                >
                  {data.map((item, index) => {
                    const cellKey =
                      (item as Record<string, unknown>).id ??
                      (item as Record<string, unknown>)[nameKey] ??
                      `cell-${index}`
                    return <Cell key={String(cellKey)} fill={bars[0]?.color || `var(--chart-${(index % 8) + 1})`} />
                  })}

                  {bars[0].showLabels && (
                    <LabelList
                      dataKey={bars[0].labelType === "name" ? nameKey : bars[0].dataKey}
                      position={bars[0].labelPosition || "insideStart"}
                      className={cn("fill-white capitalize mix-blend-luminosity")}
                      fontSize={11}
                      style={bars[0].labelStyle}
                      formatter={(entry: { payload: any }) => {
                        if (!entry?.payload) return ""
                        return formatLabel(entry.payload, bars[0]!.dataKey, bars[0]?.labelType)
                      }}
                    />
                  )}
                </RadialBar>
              )}

              {bars.slice(1).map((bar, secondaryIndex) => (
                <RadialBar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  name={bar.name || bar.dataKey}
                  fill={bar.color || `var(--chart-${((secondaryIndex + 1) % 8) + 1})`}
                  background={showBackground}
                  cornerRadius={bar.cornerRadius}
                  stackId={bar.stackId}
                  className={cn("stroke-transparent stroke-2")}
                >
                  {bar.showLabels && (
                    <LabelList
                      dataKey={bar.labelType === "name" ? nameKey : bar.dataKey}
                      position={bar.labelPosition || "insideStart"}
                      className={cn("fill-white capitalize mix-blend-luminosity")}
                      fontSize={11}
                      style={bar.labelStyle}
                      formatter={(entry: { payload: any }) => {
                        if (!entry || !entry.payload) return ""
                        return formatLabel(entry.payload, bar.dataKey, bar.labelType)
                      }}
                    />
                  )}
                </RadialBar>
              ))}

              {legendPosition !== "none" && (
                <Legend
                  verticalAlign={getLegendVerticalAlign(legendPosition)}
                  align={getLegendHorizontalAlign(legendPosition)}
                  layout={getLegendLayout(legendPosition)}
                  payload={legendPayload}
                  iconSize={10}
                  iconType="square"
                  wrapperStyle={{ paddingTop: 10 }}
                  className={cn("text-xs fill-foreground")}
                />
              )}
            </RadialBarChart>
          </ChartContainer>
        </div>
      </div>

      <RadialChartFooter description={footer?.description} />
    </div>
  )
}

export default IGRPRadialBarChartInner
