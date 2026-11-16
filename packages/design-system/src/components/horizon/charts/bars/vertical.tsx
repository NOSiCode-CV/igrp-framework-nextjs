"use client"

import { Suspense, lazy } from "react"

import { cn } from "../../cn.js"
import { Skeleton } from "../../../primitives/skeleton.js"
import { getChartHeight, getChartWidth } from "../lib.js"
import type { IGRPVerticalBarChartProps } from "./vertical-chart-inner.js"

const IGRPVerticalBarChartLazy = lazy(() => import("./vertical-chart-inner.js").then((m) => ({ default: m.default })))

/**
 * Vertical bar chart with optional stacking and grid.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPVerticalBarChart(props: IGRPVerticalBarChartProps) {
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
      <IGRPVerticalBarChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPVerticalBarChart, type IGRPVerticalBarChartProps }
