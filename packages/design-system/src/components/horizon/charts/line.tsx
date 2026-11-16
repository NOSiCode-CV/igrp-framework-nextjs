"use client"

import { Suspense, lazy } from "react"

import { ChartFallback } from "./chart-fallback.js"
import type { IGRPLineChartProps, LineConfig } from "./line-chart-inner.js"

const IGRPLineChartLazy = lazy(() => import("./line-chart-inner.js").then((m) => ({ default: m.default })))

/**
 * Line chart with optional grid, tooltip, and legend.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPLineChart(props: IGRPLineChartProps) {
  return (
    <Suspense fallback={<ChartFallback {...props} />}>
      <IGRPLineChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPLineChart, type LineConfig, type IGRPLineChartProps }
