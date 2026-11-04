"use client"
// `table` keeps its identity across renders, so compiler memoization would freeze the rows.
"use no memo"

import { type ReactElement, useState } from "react"
import {
  type ColumnDef,
  type ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  type PaginationState,
  type Row,
  type SortingState,
  type TableOptions,
  type Updater,
  useReactTable,
} from "@tanstack/react-table"

import { useIGRPi18n } from "../../../i18n/index.js"
import { cn } from "../cn.js"
import { Table, TableBody, TableHeader } from "../../primitives/table.js"
import { igrpDataTableTableClassName } from "./layout.js"
import { IGRPDataTablePagination } from "./pagination.js"
import { IGRPDataTableBodyRows, IGRPDataTableHeaderRows, useIGRPDataTableRowIdWarning } from "./table-rows.js"
import type { IGRPDataTableLayout, IGRPServerPaginationState } from "./types.js"

/**
 * Props for the IGRPServerDataTable component.
 * @see IGRPServerDataTable
 */
interface IGRPServerDataTableProps<TData, TValue> {
  /** TanStack column definitions. Keep the array referentially stable (module scope or `useMemo`). */
  columns: ColumnDef<TData, TValue>[]
  /** The current page's rows. Keep it referentially stable. */
  data: TData[]
  /** Pagination state, owned by the parent. */
  pagination: IGRPServerPaginationState
  /** Called with the requested page; the table does not move until `pagination` changes. */
  onPaginationChange: (pageIndex: number, pageSize: number) => void
  /** Page-size choices. */
  pageSizeOptions?: number[]
  /** Show the pagination bar. */
  enablePagination?: boolean
  /** Controlled sorting; together with `onSortingChange` the rows are not sorted here. */
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  layout?: IGRPDataTableLayout
  /** Row identity. Pass it with `renderSubComponent`, or expansion follows the index. */
  getRowId?: TableOptions<TData>["getRowId"]
  getRowCanExpand?: TableOptions<TData>["getRowCanExpand"]
  renderSubComponent?: (row: Row<TData>) => ReactElement | undefined
  /** Empty-state text. Defaults to the catalog string. */
  notFoundLabel?: string
  id?: string
  className?: string
  tableClassName?: string
  tableHeaderClassName?: string
  tableBodyClassName?: string
  paginationClassName?: string
}

const noExpand = () => false

/** Table whose pagination (and optionally sorting) is controlled by the parent. */
function IGRPServerDataTable<TData, TValue>({
  columns,
  data,
  pagination,
  onPaginationChange,
  pageSizeOptions = [5, 10, 30, 50],
  enablePagination = true,
  sorting,
  onSortingChange,
  layout = "auto",
  getRowId,
  getRowCanExpand = noExpand,
  renderSubComponent,
  notFoundLabel,
  id,
  className,
  tableClassName,
  tableHeaderClassName,
  tableBodyClassName,
  paginationClassName,
}: IGRPServerDataTableProps<TData, TValue>): ReactElement {
  const i18n = useIGRPi18n()
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const manualSorting = !!(sorting && onSortingChange)

  useIGRPDataTableRowIdWarning("IGRPServerDataTable", !!renderSubComponent, !!getRowId)

  const paginationState: PaginationState = { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand,
    getRowId,

    manualPagination: true,
    pageCount: pagination.totalPages,
    rowCount: pagination.totalElements,
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const next = typeof updater === "function" ? updater(paginationState) : updater
      onPaginationChange(next.pageIndex, next.pageSize)
    },

    manualSorting,
    enableSortingRemoval: false,
    ...(manualSorting
      ? {
          onSortingChange: (updater: Updater<SortingState>) =>
            onSortingChange(typeof updater === "function" ? updater(sorting) : updater),
        }
      : { getSortedRowModel: getSortedRowModel() }),

    onExpandedChange: setExpanded,
    // TanStack's auto-reset queues a state update in a microtask that fires before mount
    // under React 19 concurrent rendering; a page change keeps expansion keyed by getRowId.
    autoResetExpanded: false,

    state: { pagination: paginationState, expanded, ...(manualSorting ? { sorting } : {}) },
  })

  return (
    <div id={id} className={cn("flex flex-col gap-4", className)}>
      <div className="relative overflow-hidden rounded-md border">
        <Table className={cn(igrpDataTableTableClassName(layout), tableClassName)}>
          <TableHeader className={tableHeaderClassName}>
            <IGRPDataTableHeaderRows table={table} layout={layout} />
          </TableHeader>

          <TableBody className={cn(tableBodyClassName)}>
            <IGRPDataTableBodyRows
              table={table}
              layout={layout}
              emptyColSpan={columns.length}
              notFoundLabel={notFoundLabel ?? i18n.dataTable.notFound}
              renderSubComponent={renderSubComponent}
              expandedCellClassName="p-0"
            />
          </TableBody>
          <tbody aria-hidden="true">
            <tr className={cn("h-1")} />
          </tbody>
        </Table>
      </div>

      {enablePagination && data.length > 0 && (
        <IGRPDataTablePagination
          table={table}
          pageSize={pageSizeOptions}
          className={cn("justify-between max-sm:flex-col max-sm:items-stretch", paginationClassName)}
        />
      )}
    </div>
  )
}

export { IGRPServerDataTable, type IGRPServerDataTableProps }
