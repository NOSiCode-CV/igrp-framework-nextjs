import { IGRP_DEFAULT_LOCALE } from "../../../i18n/strings.js"
import type { ChartConfig as ShadCNChartConfig } from "../../primitives/chart.js"
import {
  type IGRPChartDataItem,
  type IGRPChartLegendPosition,
  type IGRPChartSize,
  type IGRPSeriesConfig,
} from "./types.js"

export const formatChartValue = (
  value: number,
  valueFormatter?: (value: number) => string,
  locale: string = IGRP_DEFAULT_LOCALE
): string => {
  if (valueFormatter) {
    return valueFormatter(value)
  }

  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

export const getChartHeight = (
  size: IGRPChartSize,
  data: IGRPChartDataItem[] = [],
  height?: number | string
): number | string => {
  if (height != null) return height

  const baseHeight = 40
  const headerHeight = 30
  const calculatedHeight = data.length * baseHeight + headerHeight

  const minHeight = size === "sm" ? 200 : size === "md" ? 280 : size === "lg" ? 400 : size === "xl" ? 500 : 280

  return Math.max(calculatedHeight, minHeight)
}

export const getChartWidth = (width?: number | string): number | string => {
  if (width != null) return width
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
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
]
