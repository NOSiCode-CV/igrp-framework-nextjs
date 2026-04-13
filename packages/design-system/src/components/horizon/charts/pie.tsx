"use client"

import { Suspense, lazy } from "react"

import { cn } from "../../../lib/utils"
import type { IGRPPieChartProps } from "./pie-chart-inner"

const IGRPPieChartLazy = lazy(() => import("./pie-chart-inner").then((m) => ({ default: m.default })))

/**
 * Pie chart with optional center label, labels, and interactive hover.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPPieChart(props: IGRPPieChartProps) {
  return (
    <Suspense
      fallback={
        <div className={cn("w-full overflow-hidden animate-pulse rounded-lg bg-muted min-h-[200px] aspect-video")} />
      }
    >
      <IGRPPieChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPPieChart, type IGRPPieChartProps }
