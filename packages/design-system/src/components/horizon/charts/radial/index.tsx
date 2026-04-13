"use client"

import { Suspense, lazy } from "react"

import { cn } from "../../../../lib/utils"
import type { IGRPRadialBarChartProps } from "./radial-chart-inner"

const IGRPRadialBarChartLazy = lazy(() => import("./radial-chart-inner").then((m) => ({ default: m.default })))

/**
 * Radial bar chart with optional center text and polar grid.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPRadialBarChart(props: IGRPRadialBarChartProps) {
  return (
    <Suspense
      fallback={
        <div className={cn("w-full overflow-hidden animate-pulse rounded-lg bg-muted min-h-[200px] aspect-video")} />
      }
    >
      <IGRPRadialBarChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPRadialBarChart, type IGRPRadialBarChartProps }
