"use client"

import { Suspense, lazy } from "react"

import { cn } from "../cn.js"
import { Skeleton } from "../../primitives/skeleton.js"
import { getChartHeight, getChartWidth } from "./lib.js"
import type { IGRPAreaChartProps } from "./area-chart-inner.js"

const IGRPAreaChartLazy = lazy(() => import("./area-chart-inner.js").then((m) => ({ default: m.default })))

/**
 * Area chart with optional stacking, gradient fill, and reference line.
 * Uses React.lazy for code splitting — recharts is loaded only when the chart is rendered.
 */
function IGRPAreaChart(props: IGRPAreaChartProps) {
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
      <IGRPAreaChartLazy {...props} />
    </Suspense>
  )
}

export { IGRPAreaChart, type IGRPAreaChartProps }
