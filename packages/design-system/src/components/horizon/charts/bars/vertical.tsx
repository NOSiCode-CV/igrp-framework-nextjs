"use client"

import { Suspense, lazy } from "react"

import { cn } from "../../../../lib/utils"
import { Skeleton } from "../../../primitives/skeleton"
import type { IGRPVerticalBarChartProps } from "./vertical-chart-inner"

const IGRPVerticalBarChartLazy = lazy(() => import("./vertical-chart-inner").then((m) => ({ default: m.default })))

/**
 * Vertical bar chart with optional stacking and grid.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPVerticalBarChart(props: IGRPVerticalBarChartProps) {
  return (
    <Suspense fallback={<Skeleton className={cn("aspect-video min-h-[200px] w-full rounded-lg", props.className)} />}>
      <IGRPVerticalBarChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPVerticalBarChart, type IGRPVerticalBarChartProps }
