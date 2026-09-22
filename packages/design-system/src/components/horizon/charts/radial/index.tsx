"use client"

import { Suspense, lazy } from "react"

import { cn } from "../../cn.js"
import { Skeleton } from "../../../primitives/skeleton.js"
import type { IGRPRadialBarChartProps } from "./radial-chart-inner.js"

const IGRPRadialBarChartLazy = lazy(() => import("./radial-chart-inner.js").then((m) => ({ default: m.default })))

/**
 * Radial bar chart with optional center text and polar grid.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPRadialBarChart(props: IGRPRadialBarChartProps) {
  return (
    <Suspense fallback={<Skeleton className={cn("aspect-video min-h-[200px] w-full rounded-lg", props.className)} />}>
      <IGRPRadialBarChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPRadialBarChart, type IGRPRadialBarChartProps }
