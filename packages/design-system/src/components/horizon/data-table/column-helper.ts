import { createColumnHelper } from "@tanstack/react-table"
import type { ColumnDef, ColumnHelper } from "@tanstack/react-table"
import type { IGRPDataTableFilterDescriptor } from "./types"

// ─── Cell type shortcuts ─────────────────────────────────────────────────────

export type IGRPCellType =
  | "text"
  | "badge"
  | "date"
  | "amount"
  | "link"
  | "tooltip"
  | "switch"
  | "checkbox"

export interface IGRPCellBadgeConfig {
  cellType: "badge"
  variants?: Record<string, string>
}

export interface IGRPCellDateConfig {
  cellType: "date"
  format?: string
}

export interface IGRPCellAmountConfig {
  cellType: "amount"
  currency?: string
}

export interface IGRPCellLinkConfig {
  cellType: "link"
  href: (row: unknown) => string
}

export interface IGRPCellSimpleConfig {
  cellType?: "text" | "tooltip" | "switch" | "checkbox"
}

export type IGRPCellConfig =
  | IGRPCellBadgeConfig
  | IGRPCellDateConfig
  | IGRPCellAmountConfig
  | IGRPCellLinkConfig
  | IGRPCellSimpleConfig

// ─── Extended column definition ──────────────────────────────────────────────

/**
 * Extended column definition for use with `createIGRPColumnHelper`.
 *
 * The `cellType`, `variants`, `format`, `currency`, and `href` fields are
 * type-level scaffolding for upcoming cell-renderer wiring. They are not yet
 * consumed by `IGRPDataTable` — columns render as plain text until that follow-up
 * ships. Use the raw `cell` escape hatch for custom rendering today.
 */
export type IGRPAccessorColumnDef<TData, TValue = unknown> = Omit<
  ColumnDef<TData, TValue>,
  "cell"
> & {
  cellType?: IGRPCellType
  variants?: Record<string, string>
  format?: string
  currency?: string
  href?: (row: unknown) => string
  filter?: IGRPDataTableFilterDescriptor
  cell?: ColumnDef<TData, TValue>["cell"]
}

// ─── Column helper ───────────────────────────────────────────────────────────

export interface IGRPColumnHelper<TData> {
  accessor: <TValue>(
    accessor: keyof TData & string,
    column: IGRPAccessorColumnDef<TData, TValue>,
  ) => IGRPAccessorColumnDef<TData, TValue>
  display: ColumnHelper<TData>["display"]
  group: ColumnHelper<TData>["group"]
}

export function createIGRPColumnHelper<TData>(): IGRPColumnHelper<TData> {
  const tanstackHelper = createColumnHelper<TData>()

  return {
    accessor: (accessor, column) => ({
      accessorKey: accessor,
      ...column,
    }),
    display: tanstackHelper.display.bind(tanstackHelper),
    group: tanstackHelper.group.bind(tanstackHelper),
  }
}
