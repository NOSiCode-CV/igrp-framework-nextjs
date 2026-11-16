"use client"

import { Suspense, lazy } from "react"

import { cn } from "../../cn.js"
import { Skeleton } from "../../../primitives/skeleton.js"
import { getChartHeight, getChartWidth } from "../lib.js"
import type { IGRPHorizontalBarChartProps } from "./horizontal-chart-inner.js"

const IGRPHorizontalBarChartLazy = lazy(() =>
  import("./horizontal-chart-inner.js").then((m) => ({ default: m.default }))
)

/**
 * Horizontal bar chart with optional stacking and grid.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPHorizontalBarChart(props: IGRPHorizontalBarChartProps) {
  return (
    <Suspense
      fallback={
        <Skeleton
          className={cn("w-full rounded-lg", props.className)}
          // Same box as the loaded chart, so swapping it in shifts nothing.
          style={{
            height: getChartHeight(props.size ?? "md", props.data, props.height),
            width: getChartWidth(props.width),
          }}
        />
      }
    >
      <IGRPHorizontalBarChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPHorizontalBarChart, type IGRPHorizontalBarChartProps }
