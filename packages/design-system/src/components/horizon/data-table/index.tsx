"use client"
"use no memo"

import { useCallback, useEffect, useId, useMemo, useReducer, useRef } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  createColumnHelper,
  type ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
  useReactTable,
  type Row,
  type TableOptions,
} from "@tanstack/react-table"

import { useIGRPi18n } from "../../../i18n/index.js"
import { cn } from "../cn.js"
import { Table, TableBody, TableHeader } from "../../primitives/table.js"
import { type IGRPDataTableClientFilterListProps, IGRPDataTableClientFilter } from "./client-filter.js"
import type { IGRPAccessorColumnDef } from "./column-helper.js"
import {
  IGRPDataTableFilterDate,
  IGRPDataTableFilterDropdown,
  IGRPDataTableFilterFaceted,
  IGRPDataTableFilterInput,
  IGRPDataTableFilterMinMax,
  IGRPDataTableFilterSelect,
} from "./filter.js"
import { IGRPDataTablePagination, IGRPDataTablePaginationNumeric } from "./pagination.js"
import { IGRPDataTableCellCheckbox, IGRPDataTableCellSwitch } from "./cell.js"
import { IGRPDataTableHeaderRowsSelect } from "./header.js"
import { IGRPDataTableRowActionsCell } from "./row-actions-cell.js"
import { IGRPDataTableBodyRows, IGRPDataTableHeaderRows, useIGRPDataTableRowIdWarning } from "./table-rows.js"
import { IGRPDataTableToggleVisibility } from "./toggle-visibility.js"
import { igrpDataTableTableClassName } from "./layout.js"
import { IGRPDataTableDateRangeFilterFn, IGRPDataTableFacetedFilterFn } from "./lib/filters-utils.js"
import type {
  IGRPDataTableAction,
  IGRPDataTableFilterType,
  IGRPDataTableLayout,
  IGRPDataTablePaginationConfig,
  IGRPDataTableQuery,
} from "./types.js"

/** Default `filterFn` per descriptor type; a column's own `filterFn` wins. */
const DESCRIPTOR_FILTER_FNS: Partial<Record<IGRPDataTableFilterType, typeof IGRPDataTableFacetedFilterFn>> = {
  faceted: IGRPDataTableFacetedFilterFn,
  date: IGRPDataTableDateRangeFilterFn,
}

/**
 * Props for the IGRPDataTable component.
 * @see IGRPDataTable
 */
interface IGRPDataTableProps<TData, TValue> {
  /**
   * TanStack Table column definitions.
   *
   * @remarks This component opts out of the React Compiler (`"use no memo"`,
   * required by `useReactTable`). The table memoizes everything it derives from
   * `columns`, but the array identity is the caller's responsibility: define it
   * at module scope or wrap it in `useMemo`, otherwise a new array on every
   * parent render rebuilds the column model and resets per-column caches.
   */
  columns: ColumnDef<TData, TValue>[]
  /**
   * Table data rows.
   *
   * @remarks Like `columns`, `data` must be referentially stable across renders
   * (module scope or `useMemo`) — a fresh array each render makes TanStack
   * recompute its row models. The compiler is off here, so the caller owns this.
   */
  data: TData[]
  /**
   * Show pagination controls. Without them every row renders (no client-side paging);
   * above 500 client-side rows a dev warning says so.
   */
  showPagination?: boolean
  /**
   * Use numeric page selector instead of prev/next.
   * @deprecated Use `pagination={{ type: "numeric" }}`.
   */
  isNumericPagination?: boolean
  /**
   * Available page size options.
   * @deprecated Use `pagination={{ pageSizeOptions }}`.
   */
  pageSizePagination?: number[]
  /**
   * Swaps the client filters for `serverFilterComponent`. It does not page, sort or
   * filter on the server — that is `onQueryChange`.
   * @deprecated For server mode use `IGRPServerDataTable` (or `onQueryChange` here); for custom filter UI use `toolbar`.
   */
  isServerSide?: boolean
  /** Show filter UI. */
  showFilter?: boolean
  /** Client-side filter configurations. */
  clientFilters?: IGRPDataTableClientFilterListProps<TData>[]
  /** Label for clear filters button. */
  clientClearLabel?: string
  /** Show column visibility toggle. */
  showToggleColumn?: boolean
  /** Label for column visibility toggle button. */
  toggleLabel?: string
  /** Label for column visibility dropdown. */
  toggleOptionsLabel?: string
  /** CSS classes for the wrapper. */
  className?: string
  /** CSS classes for the filter wrapper. */
  filterClassName?: string
  /** CSS classes for the table element. */
  tableClassName?: string
  /** CSS classes for the table header. */
  tableHeaderClassName?: string
  /** CSS classes for the table body. */
  tableBodyClassName?: string
  /** CSS classes for pagination. */
  paginationClassName?: string
  /**
   * Custom filter component for server-side mode (only with `isServerSide`).
   * @deprecated Use `toolbar`.
   */
  serverFilterComponent?: React.ReactNode
  /**
   * Extra controls rendered in the toolbar row next to the filters (search box,
   * custom filters, buttons). Shown with or without `showFilter`.
   */
  toolbar?: React.ReactNode
  /** Message when no rows match. */
  notFoundLabel?: string
  /** Whether a row can be expanded. */
  getRowCanExpand?: TableOptions<TData>["getRowCanExpand"]
  /** Render expanded row content. */
  renderSubComponent?: (row: Row<TData>) => React.ReactElement | undefined
  /** Stable row id. Needed for expansion to survive `data` being reordered or replaced, e.g. server-side sorting/paging or a refetch (default: row index). */
  getRowId?: TableOptions<TData>["getRowId"]
  /** HTML id attribute. */
  id?: string
  /** Called after all client-side column filters are cleared via the clear button. */
  onFiltersCleared?: () => void
  /**
   * Row actions. ≤2 actions render as inline icon buttons; >2 render as a dropdown menu.
   * Use `hidden` / `disabled` per-action callbacks to control visibility per row.
   *
   * @remarks Keep the array referentially stable, like `columns` (module scope or
   * `useMemo`): a new array rebuilds the column model on every parent render.
   */
  actions?: IGRPDataTableAction<TData>[]
  /** Total row count for server-side pagination display (use with onQueryChange). */
  rowCount?: number
  /** Called whenever pagination, sorting, or filters change. Enables server-side mode. The latest callback is used, so an inline function does not refire it. */
  onQueryChange?: (query: IGRPDataTableQuery) => void
  /** Pagination display configuration. */
  pagination?: IGRPDataTablePaginationConfig
  /** Column sizing. "auto" fits content; "fixed" honours ColumnDef.size. Default "auto". */
  layout?: IGRPDataTableLayout
  /**
   * Selected rows, keyed by row id (TanStack's `RowSelectionState`). Pass it with
   * `onRowSelectionChange` to control the selection. Pair it with `getRowId` so the
   * keys survive `data` being reordered or replaced.
   */
  rowSelection?: RowSelectionState
  /** Called with TanStack's updater when the selection changes, controlled or not. */
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  /**
   * Called with the selected rows' data whenever the selection changes. The latest
   * callback is used, so an inline function does not refire it.
   */
  onSelectionChange?: (rows: TData[]) => void
  /**
   * Adds a row-selection column before `columns`: a checkbox or a switch per row, with a
   * select-all checkbox in the header (current page only). Leave unset if `columns`
   * already has its own selection column.
   */
  selection?: "checkbox" | "switch"
}

type TableState = {
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
  pagination: PaginationState
  sorting: SortingState
  expanded: ExpandedState
  rowSelection: RowSelectionState
}

type TableAction =
  | { type: "columnFilters"; payload: ColumnFiltersState }
  | { type: "columnVisibility"; payload: VisibilityState }
  | { type: "pagination"; payload: PaginationState }
  | { type: "sorting"; payload: SortingState }
  | { type: "expanded"; payload: ExpandedState }
  | { type: "rowSelection"; payload: RowSelectionState }

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case "columnFilters":
      return {
        ...state,
        columnFilters: action.payload,
        pagination: { ...state.pagination, pageIndex: 0 },
      }
    case "columnVisibility":
      return { ...state, columnVisibility: action.payload }
    case "pagination":
      return { ...state, pagination: action.payload }
    case "sorting":
      return {
        ...state,
        sorting: action.payload,
        pagination: { ...state.pagination, pageIndex: 0 },
      }
    case "expanded":
      return { ...state, expanded: action.payload }
    case "rowSelection":
      return { ...state, rowSelection: action.payload }
    default:
      return state
  }
}

/**
 * Data table with sorting, filtering, pagination, and expandable rows.
 * Built on TanStack Table. Use IGRPDataTableHeader*, IGRPDataTableCell*, etc. for column setup.
 */
function IGRPDataTable<TData, TValue>({
  columns,
  data,
  showPagination = false,
  isNumericPagination = false,
  pageSizePagination = [50, 100, 150, 200],
  isServerSide = false,
  showFilter = false,
  clientFilters,
  clientClearLabel,
  showToggleColumn = false,
  toggleLabel,
  toggleOptionsLabel,
  className,
  filterClassName,
  tableClassName,
  layout = "auto",
  tableHeaderClassName,
  tableBodyClassName,
  paginationClassName,
  serverFilterComponent,
  toolbar,
  notFoundLabel,
  rowSelection: rowSelectionProp,
  onRowSelectionChange,
  onSelectionChange,
  selection,
  getRowCanExpand = () => false,
  renderSubComponent,
  getRowId,
  id,
  onFiltersCleared,
  actions,
  rowCount,
  onQueryChange,
  pagination,
}: IGRPDataTableProps<TData, TValue>) {
  const i18n = useIGRPi18n()
  const resolvedClearLabel = clientClearLabel ?? i18n.dataTable.clearFilters
  const resolvedNotFoundLabel = notFoundLabel ?? i18n.dataTable.notFound

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !isServerSide || onQueryChange) return
    console.warn(
      "IGRPDataTable: isServerSide only swaps in serverFilterComponent; without onQueryChange the rows are still paged, sorted and filtered on the client. Use IGRPServerDataTable or pass onQueryChange."
    )
  }, [isServerSide, onQueryChange])

  // Client mode without pagination renders every row; `content-visibility` can't help
  // here (containment doesn't apply to table rows), so say it instead.
  const rendersEveryRow = !onQueryChange && !showPagination && data.length > 500
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !rendersEveryRow) return
    console.warn(
      "IGRPDataTable: showPagination is off, so every row renders (more than 500). Turn on showPagination or page on the server with onQueryChange."
    )
  }, [rendersEveryRow])

  const [state, dispatch] = useReducer(tableReducer, {
    columnFilters: [],
    columnVisibility: {},
    pagination: {
      pageIndex: 0,
      pageSize: pagination?.defaultPageSize ?? pagination?.pageSizeOptions?.[0] ?? pageSizePagination?.[0] ?? 50,
    },
    sorting: [],
    expanded: {},
    rowSelection: {},
  })

  const setColumnFilters = useCallback(
    (updater: Updater<ColumnFiltersState>) =>
      dispatch({
        type: "columnFilters",
        payload: typeof updater === "function" ? updater(state.columnFilters) : updater,
      }),
    [state.columnFilters]
  )
  const setColumnVisibility = useCallback(
    (updater: Updater<VisibilityState>) =>
      dispatch({
        type: "columnVisibility",
        payload: typeof updater === "function" ? updater(state.columnVisibility) : updater,
      }),
    [state.columnVisibility]
  )
  const setPagination = useCallback(
    (updater: Updater<PaginationState>) =>
      dispatch({
        type: "pagination",
        payload: typeof updater === "function" ? updater(state.pagination) : updater,
      }),
    [state.pagination]
  )
  const setSorting = useCallback(
    (updater: Updater<SortingState>) =>
      dispatch({
        type: "sorting",
        payload: typeof updater === "function" ? updater(state.sorting) : updater,
      }),
    [state.sorting]
  )
  const setExpanded = useCallback(
    (updater: Updater<ExpandedState>) =>
      dispatch({
        type: "expanded",
        payload: typeof updater === "function" ? updater(state.expanded) : updater,
      }),
    [state.expanded]
  )
  const controlledSelection = rowSelectionProp !== undefined
  const rowSelection = rowSelectionProp ?? state.rowSelection
  const setRowSelection = useCallback(
    (updater: Updater<RowSelectionState>) => {
      if (!controlledSelection) {
        dispatch({
          type: "rowSelection",
          payload: typeof updater === "function" ? updater(state.rowSelection) : updater,
        })
      }
      onRowSelectionChange?.(updater)
    },
    [controlledSelection, state.rowSelection, onRowSelectionChange]
  )

  const _id = useId()
  const ref = id ?? _id

  // Column helper is identity-stable per instance (the compiler is off here via
  // "use no memo", so React's own useMemo owns stabilization).
  const tableHelper = useMemo(() => createColumnHelper<TData>(), [])

  // allColumns is rebuilt only when the caller's columns or actions change.
  // Re-running this every render forces useReactTable to reset its column model
  // (and every faceted/grouped/sorted cache) on any unrelated parent re-render.
  const allColumns = useMemo(() => {
    const actionColumn =
      actions && actions.length > 0
        ? [
            tableHelper.display({
              id: "__igrp_actions__",
              header: "",
              cell: ({ row }) => <IGRPDataTableRowActionsCell row={row} actions={actions} />,
              enableSorting: false,
              enableHiding: false,
              meta: { isActionsColumn: true },
              size: actions.length <= 2 ? actions.length * 44 : 44,
            }),
          ]
        : []
    const selectionColumn = selection
      ? [
          tableHelper.display({
            id: "__igrp_select__",
            header: ({ table }) => <IGRPDataTableHeaderRowsSelect table={table} />,
            cell: ({ row }) =>
              selection === "switch" ? <IGRPDataTableCellSwitch row={row} /> : <IGRPDataTableCellCheckbox row={row} />,
            enableSorting: false,
            enableHiding: false,
            // Same shrink-to-fit sizing as the actions column.
            meta: { isActionsColumn: true },
            size: selection === "switch" ? 56 : 40,
          }),
        ]
      : []
    // Faceted and date filters set an array / a { from, to } value, which TanStack's "auto" filterFn can't match.
    const withFilterFns = (columns as IGRPAccessorColumnDef<TData>[]).map((col) => {
      const filterFn = col.filter && !col.filterFn ? DESCRIPTOR_FILTER_FNS[col.filter.type] : undefined
      return filterFn ? { ...col, filterFn } : col
    })
    return [...selectionColumn, ...withFilterFns, ...actionColumn] as ColumnDef<TData, TValue>[]
  }, [columns, actions, selection, tableHelper])

  useIGRPDataTableRowIdWarning("IGRPDataTable", !!renderSubComponent, !!getRowId)

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: allColumns,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowCanExpand: getRowCanExpand,
    getRowId,

    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,

    state: {
      sorting: state.sorting,
      columnVisibility: state.columnVisibility,
      rowSelection,
      columnFilters: state.columnFilters,
      pagination: state.pagination,
      expanded: state.expanded,
    },

    enableRowSelection: true,
    enableSortingRemoval: false,

    // TanStack's auto-reset queues a setPagination/setExpanded in a microtask,
    // which fires before mount under React 19 concurrent rendering and triggers
    // "Can't perform a React state update on a component that hasn't mounted yet".
    // Page-index reset on filter/sort changes is handled in tableReducer instead.
    autoResetPageIndex: false,
    autoResetExpanded: false,

    // No pagination UI means no way past page 1, so client-side mode renders every row.
    manualPagination: !!onQueryChange || !showPagination,
    manualSorting: !!onQueryChange,
    manualFiltering: !!onQueryChange,
    rowCount: onQueryChange ? (rowCount ?? 0) : undefined,
  })

  const { pageIndex, pageSize } = table.getState().pagination
  // `data` shrinking (a refetch, a delete) can leave the page past the end, with
  // an empty body. Clamp during render; dispatching here re-renders before commit.
  // Server-side waits for a known `rowCount`: a loading `undefined` (or the usual `data?.total ?? 0`) must not reset it.
  const pageCount = table.getPageCount()
  if (pageIndex > 0 && pageIndex >= pageCount && (!onQueryChange || rowCount)) {
    dispatch({ type: "pagination", payload: { pageIndex: Math.max(0, pageCount - 1), pageSize } })
  }
  const pageSizeOptions = pagination?.pageSizeOptions ?? pageSizePagination
  const sorting = table.getState().sorting
  const columnFilters = table.getState().columnFilters

  // Selected rows' data for onSelectionChange, only when the selection actually changed
  // (not on mount, and not on StrictMode's second effect run).
  const onSelectionChangeRef = useRef(onSelectionChange)
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  })
  const lastSelection = useRef(rowSelection)
  useEffect(() => {
    if (lastSelection.current === rowSelection) return
    lastSelection.current = rowSelection
    onSelectionChangeRef.current?.(table.getSelectedRowModel().flatRows.map((row) => row.original))
  }, [rowSelection, table])

  // Latest callback in a ref: an inline consumer callback must not refire the query.
  const onQueryChangeRef = useRef(onQueryChange)
  useEffect(() => {
    onQueryChangeRef.current = onQueryChange
  })
  useEffect(() => {
    const onQuery = onQueryChangeRef.current
    if (!onQuery) return
    onQuery({
      page: pageIndex,
      pageSize,
      sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
      filters: columnFilters.map((f) => ({ id: f.id, value: f.value })),
    })
  }, [pageIndex, pageSize, sorting, columnFilters])

  const filterDescriptors = useMemo(
    () =>
      (columns as IGRPAccessorColumnDef<TData>[])
        .filter(
          (col): col is IGRPAccessorColumnDef<TData> & { accessorKey: string } =>
            "filter" in col &&
            !!col.filter &&
            "accessorKey" in col &&
            typeof (col as { accessorKey?: unknown }).accessorKey === "string"
        )
        .map((col) => ({ columnId: col.accessorKey, descriptor: col.filter! })),
    [columns]
  )

  // The filter block has always rendered whenever the toolbar row did (showFilter or showToggleColumn).
  const showFilters = showFilter || showToggleColumn

  return (
    <div className={cn("flex flex-col gap-4", className)} id={ref}>
      {showFilters || toolbar ? (
        <div
          className={cn(
            "flex flex-col gap-3 md:flex-1 md:flex-row md:items-center md:justify-between",
            filterClassName
          )}
        >
          <div className="flex flex-col gap-2 md:flex-row">
            {showFilters &&
              (isServerSide ? (
                serverFilterComponent
              ) : (
                <IGRPDataTableClientFilter
                  table={table}
                  filterList={clientFilters || []}
                  filterLabel={resolvedClearLabel}
                  onFiltersCleared={onFiltersCleared}
                />
              ))}
            {showFilters && filterDescriptors.length > 0 && (
              <div className={cn("flex flex-col gap-2 md:flex-row md:items-center")}>
                {filterDescriptors.map(({ columnId, descriptor }) => {
                  const column = table.getColumn(columnId)
                  if (!column) return null

                  switch (descriptor.type) {
                    case "input":
                      return (
                        <IGRPDataTableFilterInput
                          key={columnId}
                          column={column}
                          placeholder={descriptor.placeholder}
                          ariaLabel={descriptor.ariaLabel}
                        />
                      )
                    case "select":
                      return (
                        <IGRPDataTableFilterSelect
                          key={columnId}
                          column={column}
                          placeholder={descriptor.placeholder}
                          options={descriptor.options ?? []}
                        />
                      )
                    case "faceted":
                      return (
                        <IGRPDataTableFilterFaceted
                          key={columnId}
                          column={column}
                          placeholder={descriptor.placeholder}
                          options={descriptor.options ?? []}
                        />
                      )
                    case "date":
                      return (
                        <IGRPDataTableFilterDate key={columnId} column={column} placeholder={descriptor.placeholder} />
                      )
                    case "range":
                      return <IGRPDataTableFilterMinMax key={columnId} column={column} />
                    case "dropdown":
                      return (
                        <IGRPDataTableFilterDropdown
                          key={columnId}
                          column={column}
                          placeholder={descriptor.placeholder}
                          options={descriptor.options ?? []}
                        />
                      )
                    default:
                      return descriptor.render?.(column) ?? null
                  }
                })}
              </div>
            )}
            {toolbar}
          </div>

          {showToggleColumn && (
            <IGRPDataTableToggleVisibility table={table} label={toggleLabel} optionsLabel={toggleOptionsLabel} />
          )}
        </div>
      ) : null}

      <div className={cn("overflow-hidden rounded-md border")}>
        <Table className={cn(igrpDataTableTableClassName(layout), tableClassName)}>
          <TableHeader className={tableHeaderClassName}>
            <IGRPDataTableHeaderRows table={table} layout={layout} />
          </TableHeader>

          <TableBody className={cn(tableBodyClassName)}>
            <IGRPDataTableBodyRows
              table={table}
              layout={layout}
              emptyColSpan={allColumns.length}
              notFoundLabel={resolvedNotFoundLabel}
              renderSubComponent={renderSubComponent}
            />
          </TableBody>
          <tbody aria-hidden="true">
            <tr className={cn("h-1")} />
          </tbody>
        </Table>
      </div>

      {/* Against the smallest of the options and the current size: picking a size >= the row
          count must not hide the selector that would undo it, and a default size below every
          option must still page. */}
      {table.getRowCount() > Math.min(pageSize, ...pageSizeOptions) &&
        showPagination &&
        (isNumericPagination || pagination?.type === "numeric" ? (
          <IGRPDataTablePaginationNumeric table={table} pageSize={pageSizeOptions} className={paginationClassName} />
        ) : (
          <IGRPDataTablePagination table={table} pageSize={pageSizeOptions} className={paginationClassName} />
        ))}
    </div>
  )
}

export { IGRPDataTable, type IGRPDataTableProps }
