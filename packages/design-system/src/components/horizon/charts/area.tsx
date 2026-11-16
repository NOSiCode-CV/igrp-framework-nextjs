"use client"

import { Suspense, lazy } from "react"

import { ChartFallback } from "./chart-fallback.js"
import type { IGRPAreaChartProps } from "./area-chart-inner.js"

const IGRPAreaChartLazy = lazy(() => import("./area-chart-inner.js").then((m) => ({ default: m.default })))

/**
 * Area chart with optional stacking, gradient fill, and reference line.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPAreaChart(props: IGRPAreaChartProps) {
  return (
    <Suspense fallback={<ChartFallback {...props} />}>
      <IGRPAreaChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPAreaChart, type IGRPAreaChartProps }
