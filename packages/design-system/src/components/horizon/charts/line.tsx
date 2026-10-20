"use client"

import { Suspense, lazy } from "react"

import { cn } from "../cn.js"
import { Skeleton } from "../../primitives/skeleton.js"
import type { IGRPLineChartProps, LineConfig } from "./line-chart-inner.js"

const IGRPLineChartLazy = lazy(() => import("./line-chart-inner.js").then((m) => ({ default: m.default })))

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
