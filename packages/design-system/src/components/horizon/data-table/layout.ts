import type { CSSProperties } from "react"
import type { Column } from "@tanstack/react-table"

import type { IGRPDataTableColumnMeta, IGRPDataTableLayout } from "./types.js"

const actionsClassName = (layout: IGRPDataTableLayout): string =>
  layout === "auto" ? "w-px whitespace-nowrap" : "whitespace-nowrap"

export function igrpDataTableCellClassName(
  meta: IGRPDataTableColumnMeta | undefined,
  layout: IGRPDataTableLayout
): string {
  if (meta?.cellClassName) return meta.cellClassName
  if (meta?.isActionsColumn) return actionsClassName(layout)
  return "truncate lg:overflow-visible lg:text-clip lg:whitespace-normal lg:wrap-anywhere"
}

export function igrpDataTableHeadClassName(
  meta: IGRPDataTableColumnMeta | undefined,
  layout: IGRPDataTableLayout
): string {
  if (meta?.isActionsColumn) return actionsClassName(layout)
  return layout === "fixed" ? "" : "lg:whitespace-normal"
}

export function igrpDataTableHeadStyle(
  column: Column<unknown, unknown>,
  layout: IGRPDataTableLayout
): CSSProperties | undefined {
  // No width here, so `w-px` on the actions column is not overridden.
  if (layout === "auto" && column.columnDef.meta?.isActionsColumn) return undefined
  return { width: `${column.getSize()}px` }
}

export function igrpDataTableTableClassName(layout: IGRPDataTableLayout): string {
  return layout === "fixed" ? "table-fixed" : ""
}
