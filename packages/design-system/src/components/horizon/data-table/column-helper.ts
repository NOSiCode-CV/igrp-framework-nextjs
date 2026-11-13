import { createColumnHelper } from "@tanstack/react-table"
import type { ColumnDef, ColumnHelper } from "@tanstack/react-table"
import type { IGRPDataTableFilterDescriptor } from "./types.js"

// ─── Extended column definition ──────────────────────────────────────────────

/** Column definition for `createIGRPColumnHelper`: a TanStack `ColumnDef` plus the IGRP `filter` descriptor. */
export type IGRPAccessorColumnDef<TData, TValue = unknown> = Omit<ColumnDef<TData, TValue>, "cell"> & {
  filter?: IGRPDataTableFilterDescriptor
  cell?: ColumnDef<TData, TValue>["cell"]
}

// ─── Column helper ───────────────────────────────────────────────────────────

export interface IGRPColumnHelper<TData> {
  /** Returns a real `ColumnDef` (plus the IGRP fields), so the result is assignable to `IGRPDataTable`'s `columns`. */
  accessor: <TValue>(
    accessor: keyof TData & string,
    column: IGRPAccessorColumnDef<TData, TValue>
  ) => ColumnDef<TData, TValue> & Pick<IGRPAccessorColumnDef<TData, TValue>, "filter">
  display: ColumnHelper<TData>["display"]
  group: ColumnHelper<TData>["group"]
}

export function createIGRPColumnHelper<TData>(): IGRPColumnHelper<TData> {
  const tanstackHelper = createColumnHelper<TData>()

  return {
    // The input type is `Omit` over TanStack's `ColumnDef` union, which collapses it; re-assert the union on the way out.
    accessor: <TValue>(accessor: keyof TData & string, column: IGRPAccessorColumnDef<TData, TValue>) =>
      ({ accessorKey: accessor, ...column }) as ColumnDef<TData, TValue> &
        Pick<IGRPAccessorColumnDef<TData, TValue>, "filter">,
    display: tanstackHelper.display.bind(tanstackHelper),
    group: tanstackHelper.group.bind(tanstackHelper),
  }
}
