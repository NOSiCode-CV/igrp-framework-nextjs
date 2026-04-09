import type { ChartConfig as ShadCNChartConfig } from "../../primitives/chart"
import {
  type IGRPChartDataItem,
  type IGRPChartLegendPosition,
  type IGRPChartSize,
  type IGRPSeriesConfig,
} from "./types"

export const formatChartValue = (value: number, valueFormatter?: (value: number) => string): string => {
  if (valueFormatter) {
    return valueFormatter(value)
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

export const getChartHeight = (
  size: IGRPChartSize,
  data: IGRPChartDataItem[] = [],
  height?: number | string,
): number | string => {
  if (height) return typeof height === "number" ? height : height

  const baseHeight = 40
  const headerHeight = 30
  const calculatedHeight = data.length * baseHeight + headerHeight

  const minHeight = size === "sm" ? 200 : size === "md" ? 280 : size === "lg" ? 400 : size === "xl" ? 500 : 280

  return Math.max(calculatedHeight, minHeight)
}

export const getChartWidth = (width?: number | string): number | string => {
  if (width) return typeof width === "number" ? width : width
  return "100%"
}

export const getLegendLayout = (legendPosition: IGRPChartLegendPosition) => {
  return legendPosition === "left" || legendPosition === "right" ? "vertical" : "horizontal"
}

export const getLegendVerticalAlign = (legendPosition: IGRPChartLegendPosition) => {
  return legendPosition === "top" ? "top" : legendPosition === "bottom" ? "bottom" : "middle"
}

export const getLegendHorizontalAlign = (legendPosition: IGRPChartLegendPosition) => {
  return legendPosition === "left" ? "left" : legendPosition === "right" ? "right" : "center"
}

export const hasNegativeValues = (data: IGRPChartDataItem[], dataKeys: string[]): boolean => {
  return data.some((item) => {
    return dataKeys.some((key) => {
      const value = item[key]
      return typeof value === "number" && value < 0
    })
  })
}

export const createChartConfig = (series: IGRPSeriesConfig[]): ShadCNChartConfig => {
  const config = {} as ShadCNChartConfig

  series.forEach((item, index) => {
    config[item.dataKey] = {
      label: item.name || item.dataKey,
      color: item.color || IGRP_CHART_COLORS[index % IGRP_CHART_COLORS.length],
    }
  })

  return config
}

export const IGRP_CHART_COLORS = [
  "var(--chart-1)", // Azul (equivalente ao #3b82f6)
  "var(--chart-2)", // Verde (equivalente ao #10b981)
  "var(--chart-3)", // Laranja (equivalente ao #f59e0b)
  "var(--chart-4)", // Roxo (equivalente ao #6366f1)
  "var(--chart-5)", // Rosa (equivalente ao #ec4899)
  "var(--chart-6)", // Violeta (equivalente ao #8b5cf6)
  "var(--chart-7)", // Vermelho (equivalente ao #ef4444)
  "var(--chart-8)", // Lima (equivalente ao #84cc16)
]
