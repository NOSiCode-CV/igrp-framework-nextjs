/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactElement, ReactNode } from "react"

/** Chart data item (key-value pairs). */
export type IGRPChartDataItem = Record<string, string | number>
/** Chart size preset. */
export type IGRPChartSize = "sm" | "md" | "lg" | "xl" | "auto"
/** Legend position. */
export type IGRPChartLegendPosition = "top" | "right" | "bottom" | "left" | "none"
/** Tooltip indicator style. */
export type IGRPTooltipIndicator = "line" | "dot"

/** Base series configuration for charts. */
export interface IGRPSeriesConfig {
  /** Key in data for this series. */
  dataKey: string
  /** Display name. */
  name?: string
  /** Color (hex or CSS var). */
  color?: string
  /** Stack id for stacked charts. */
  stackId?: string
  /** Custom render function. */
  render?: (props: any) => React.ReactNode
}

/** Area chart series config. */
export interface IGRPAreaConfig extends IGRPSeriesConfig {
  /** Curve type. */
  type?: "linear" | "monotone" | "step" | "basis" | "natural"
  /** Fill opacity. */
  fillOpacity?: number
  /** Use gradient fill. */
  gradient?: boolean
}

/** Bar chart series config. */
export interface IGRPBarConfig extends IGRPSeriesConfig {
  /** Bar corner radius. */
  radius?: number
}

/** Chart footer config. */
export interface IGRPChartFooter {
  /** Footer description text. */
  description?: string
}

/** Base props shared by all chart components. */
export interface IGRPChartProps {
  data: IGRPChartDataItem[]
  categoryKey: string
  title?: string
  description?: string
  showGrid?: boolean
  legendPosition?: IGRPChartLegendPosition
  customLegend?: ReactElement | ((props: any) => ReactNode)
  showTooltip?: boolean
  hideAxis?: boolean
  hideXAxis?: boolean
  hideYAxis?: boolean
  showReferenceZero?: boolean
  valueDomain?: [number, number]
  size?: IGRPChartSize
  height?: number | string
  width?: number | string
  stacked?: boolean
  className?: string
  valueFormatter?: (value: number) => string
  labelFormatter?: (value: string) => string
  gridColor?: string
  backgroundColor?: string
  referenceLineColor?: string
  axisColor?: string
  /** Tooltip indicator style. */
  tooltipIndicator?: IGRPTooltipIndicator
  /** Footer config. */
  footer?: IGRPChartFooter
}

/** Pie chart series config. */
export interface PieConfig extends IGRPSeriesConfig {
  innerRadius?: number
  outerRadius?: number
  paddingAngle?: number
  cornerRadius?: number
  startAngle?: number
  endAngle?: number
  cx?: number | string
  cy?: number | string
  showLabels?: boolean
  labelType?: "value" | "name" | "percent"
  labelPosition?: "inside" | "outside" | "insideLeft" | "insideRight" | "center"
  labelLine?: boolean
  activeIndex?: number
  /** Custom active shape on hover. */
  activeShape?: boolean
}

/** Radar chart series config. */
export interface IGRPRadarConfig extends IGRPSeriesConfig {
  fill?: string
  fillOpacity?: number
  strokeWidth?: number
  dot?: boolean | object
  activeDot?: object
  /** Enable animation. */
  isAnimationActive?: boolean
}

/** Radial bar chart series config. */
export interface RadialBarConfig extends IGRPSeriesConfig {
  cornerRadius?: number
  minAngle?: number
  background?: boolean
  clockWise?: boolean
  stackId?: string
  showLabels?: boolean
  labelType?: "value" | "name" | "percent"
  labelPosition?: "inside" | "outside" | "insideStart" | "insideEnd"
  labelStyle?: React.CSSProperties
}
