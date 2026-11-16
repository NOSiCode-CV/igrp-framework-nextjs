"use client"

import { Suspense, lazy } from "react"

import { cn } from "../../cn.js"
import { Skeleton } from "../../../primitives/skeleton.js"
import { getChartHeight, getChartWidth } from "../lib.js"
import type { IGRPRadialBarChartProps } from "./radial-chart-inner.js"

const IGRPRadialBarChartLazy = lazy(() => import("./radial-chart-inner.js").then((m) => ({ default: m.default })))

/**
 * Radial bar chart with optional center text and polar grid.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPRadialBarChart(props: IGRPRadialBarChartProps) {
  return (
    <Suspense
      fallback={
        <Skeleton
          className={cn("w-full rounded-lg", props.className)}
          // Same box as the loaded chart, so swapping it in shifts nothing.
          style={{ height: getChartHeight(props.size ?? "md", [], props.height), width: getChartWidth(props.width) }}
        />
      }
    >
      <IGRPRadialBarChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPRadialBarChart, type IGRPRadialBarChartProps }
