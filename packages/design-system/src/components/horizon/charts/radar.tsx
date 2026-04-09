"use client"

import { Suspense, lazy } from "react"

import { cn } from "../../../lib/utils"
import type { IGRPRadarChartProps } from "./radar-chart-inner"

const IGRPRadarChartLazy = lazy(() => import("./radar-chart-inner").then((m) => ({ default: m.default })))

/**
 * Radar/spider chart with polar grid and configurable axes.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPRadarChart(props: IGRPRadarChartProps) {
  return (
    <Suspense
      fallback={
        <div className={cn("w-full overflow-hidden animate-pulse rounded-lg bg-muted min-h-[200px] aspect-video")} />
      }
    >
      <IGRPRadarChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPRadarChart, type IGRPRadarChartProps }
