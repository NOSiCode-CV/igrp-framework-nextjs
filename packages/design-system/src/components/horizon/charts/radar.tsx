"use client"

import { Suspense, lazy } from "react"

import { ChartFallback } from "./chart-fallback.js"
import type { IGRPRadarChartProps } from "./radar-chart-inner.js"

const IGRPRadarChartLazy = lazy(() => import("./radar-chart-inner.js").then((m) => ({ default: m.default })))

/**
 * Radar/spider chart with polar grid and configurable axes.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPRadarChart(props: IGRPRadarChartProps) {
  return (
    <Suspense fallback={<ChartFallback {...props} />}>
      <IGRPRadarChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPRadarChart, type IGRPRadarChartProps }
