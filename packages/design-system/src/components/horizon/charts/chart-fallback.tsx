import { cn } from "../cn.js"
import { Skeleton } from "../../primitives/skeleton.js"
import { getChartHeight, getChartWidth } from "./lib.js"
import type { IGRPChartDataItem, IGRPChartSize } from "./types.js"

type ChartFallbackProps = {
  size?: IGRPChartSize
  height?: number | string
  width?: number | string
  className?: string
  /** Rows, for a chart whose loaded height grows with them. Not `data`, so spreading chart props leaves it out. */
  rows?: IGRPChartDataItem[]
}

/** Lazy-chart placeholder sized like the loaded chart, so swapping it in shifts nothing. */
function ChartFallback({ size = "md", height, width, className, rows }: ChartFallbackProps) {
  return (
    <Skeleton
      className={cn("w-full rounded-lg", className)}
      style={{ height: getChartHeight(size, rows, height), width: getChartWidth(width) }}
    />
  )
}

export { ChartFallback }
