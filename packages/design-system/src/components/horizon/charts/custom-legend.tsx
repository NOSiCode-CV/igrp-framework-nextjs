"use client"

import type { LegendType } from "recharts"

import { cn } from "../../../lib/utils"

/**
 * Legend entry shape produced by the chart components for manually-built legends.
 *
 * recharts 3 removed the `payload` prop from `<Legend>`; fully custom legends are
 * now supplied via the `content` render prop instead. This component renders our
 * pre-computed payload so pie / radial charts keep their per-slice legends.
 */
export interface ChartLegendEntry {
  value: string | number
  type?: LegendType
  color?: string
  payload?: Record<string, unknown>
}

/**
 * Renders a manually-built legend payload as a horizontal, wrapping list.
 * Used with `<Legend content={() => <ChartCustomLegend payload={...} />} />`.
 */
export function ChartCustomLegend({ payload }: { payload: ChartLegendEntry[] }) {
  if (!payload.length) return null

  return (
    <ul className={cn("flex flex-wrap items-center justify-center gap-3 pt-2 text-xs")}>
      {payload.map((entry, index) => (
        <li key={`${entry.value}-${index}`} className={cn("flex items-center gap-1.5")}>
          <span className={cn("size-2.5 shrink-0 rounded-[2px]")} style={{ backgroundColor: entry.color }} />
          <span className={cn("text-foreground")}>{entry.value}</span>
        </li>
      ))}
    </ul>
  )
}
