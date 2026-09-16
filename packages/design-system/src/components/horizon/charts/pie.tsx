"use client"

import { Suspense, lazy } from "react"

import { cn } from "../cn"
import { Skeleton } from "../../primitives/skeleton"
import type { IGRPPieChartProps } from "./pie-chart-inner"

const IGRPPieChartLazy = lazy(() => import("./pie-chart-inner").then((m) => ({ default: m.default })))

/**
 * Pie chart with optional center label, labels, and interactive hover.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPPieChart(props: IGRPPieChartProps) {
  return (
    <Suspense fallback={<Skeleton className={cn("aspect-video min-h-[200px] w-full rounded-lg", props.className)} />}>
      <IGRPPieChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPPieChart, type IGRPPieChartProps }
