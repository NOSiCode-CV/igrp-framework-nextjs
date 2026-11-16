"use client"

import { Suspense, lazy } from "react"

import { cn } from "../cn.js"
import { Skeleton } from "../../primitives/skeleton.js"
import { getChartHeight, getChartWidth } from "./lib.js"
import type { IGRPPieChartProps } from "./pie-chart-inner.js"

const IGRPPieChartLazy = lazy(() => import("./pie-chart-inner.js").then((m) => ({ default: m.default })))

/**
 * Pie chart with optional center label, labels, and interactive hover.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPPieChart(props: IGRPPieChartProps) {
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
      <IGRPPieChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPPieChart, type IGRPPieChartProps }
