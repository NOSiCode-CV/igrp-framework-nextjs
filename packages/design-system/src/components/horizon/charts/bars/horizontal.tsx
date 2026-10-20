"use client"

import { Suspense, lazy } from "react"

import { cn } from "../../cn.js"
import { Skeleton } from "../../../primitives/skeleton.js"
import type { IGRPHorizontalBarChartProps } from "./horizontal-chart-inner.js"

const IGRPHorizontalBarChartLazy = lazy(() =>
  import("./horizontal-chart-inner.js").then((m) => ({ default: m.default }))
)

/**
 * Horizontal bar chart with optional stacking and grid.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPHorizontalBarChart(props: IGRPHorizontalBarChartProps) {
  return (
    <Suspense fallback={<Skeleton className={cn("aspect-video min-h-[200px] w-full rounded-lg", props.className)} />}>
      <IGRPHorizontalBarChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPHorizontalBarChart, type IGRPHorizontalBarChartProps }
