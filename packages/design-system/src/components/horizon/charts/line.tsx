"use client"

import { Suspense, lazy } from "react"

import { cn } from "../../../lib/utils"
import { Skeleton } from "../../primitives/skeleton"
import type { IGRPLineChartProps, LineConfig } from "./line-chart-inner"

const IGRPLineChartLazy = lazy(() => import("./line-chart-inner").then((m) => ({ default: m.default })))

/**
 * Line chart with optional grid, tooltip, and legend.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPLineChart(props: IGRPLineChartProps) {
  return (
    <Suspense fallback={<Skeleton className={cn("aspect-video min-h-[200px] w-full rounded-lg", props.className)} />}>
      <IGRPLineChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPLineChart, type LineConfig, type IGRPLineChartProps }
