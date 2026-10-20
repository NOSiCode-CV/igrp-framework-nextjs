"use client"

import { Suspense, lazy } from "react"

import { cn } from "../cn.js"
import { Skeleton } from "../../primitives/skeleton.js"
import type { IGRPRadarChartProps } from "./radar-chart-inner.js"

const IGRPRadarChartLazy = lazy(() => import("./radar-chart-inner.js").then((m) => ({ default: m.default })))

/**
 * Radar/spider chart with polar grid and configurable axes.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPRadarChart(props: IGRPRadarChartProps) {
  return (
    <Suspense fallback={<Skeleton className={cn("aspect-video min-h-[200px] w-full rounded-lg", props.className)} />}>
      <IGRPRadarChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPRadarChart, type IGRPRadarChartProps }
