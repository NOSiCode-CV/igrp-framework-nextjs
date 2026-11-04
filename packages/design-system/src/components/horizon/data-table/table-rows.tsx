"use client"
// `table` keeps its identity across renders, so compiler memoization would freeze these rows.
"use no memo"

import { Fragment, type ReactElement, useEffect, useRef } from "react"
import { flexRender, type Column, type Row, type Table } from "@tanstack/react-table"

import { useIGRPi18n } from "../../../i18n/index.js"
import { cn } from "../cn.js"
import { TableCell, TableHead, TableRow } from "../../primitives/table.js"
import { IGRPIcon } from "../icon/index.js"
import { igrpDataTableCellClassName, igrpDataTableHeadClassName, igrpDataTableHeadStyle } from "./layout.js"
import type { IGRPDataTableLayout } from "./types.js"

interface IGRPDataTableHeaderRowsProps<TData> {
  table: Table<TData>
  layout: IGRPDataTableLayout
}

function IGRPDataTableHeaderRows<TData>({ table, layout }: IGRPDataTableHeaderRowsProps<TData>): ReactElement {
  return (
    <>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id} className={cn("border-b")}>
          {headerGroup.headers.map((header) => {
            // aria-sort is only honoured on the columnheader itself, never on a
            // wrapper inside it — so it is resolved here rather than in header.tsx.
            const sorted = header.column.getIsSorted()
            const ariaSort = !header.column.getCanSort()
              ? undefined
              : sorted === "asc"
                ? "ascending"
                : sorted === "desc"
                  ? "descending"
                  : "none"

            return (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                style={igrpDataTableHeadStyle(header.column as Column<unknown, unknown>, layout)}
                className={cn("px-3 font-semibold", igrpDataTableHeadClassName(header.column.columnDef.meta, layout))}
                aria-sort={ariaSort}
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            )
          })}
        </TableRow>
      ))}
    </>
  )
}

interface IGRPDataTableBodyRowsProps<TData> {
  table: Table<TData>
  layout: IGRPDataTableLayout
  /** colSpan of the empty-state cell. */
  emptyColSpan: number
  notFoundLabel: string
  renderSubComponent?: (row: Row<TData>) => ReactElement | undefined
  /** Classes for the full-width cell of an expanded row. */
  expandedCellClassName?: string
}

function IGRPDataTableBodyRows<TData>({
  table,
  layout,
  emptyColSpan,
  notFoundLabel,
  renderSubComponent,
  expandedCellClassName,
}: IGRPDataTableBodyRowsProps<TData>): ReactElement {
  const i18n = useIGRPi18n()

  const NotFoundRowSubComponent = (
    <div className={cn("flex items-center gap-2 p-3")}>
      <IGRPIcon iconName="OctagonAlert" />
      <span>{i18n.dataTable.notAvailable}</span>
    </div>
  )

  const rows = table.getRowModel().rows

  if (!rows?.length) {
    return (
      <TableRow>
        <TableCell colSpan={emptyColSpan} className={cn("h-24 text-center font-semibold")}>
          {notFoundLabel}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {rows.map((row) => (
        <Fragment key={row.id}>
          <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={cn(
                  "h-[inherit] p-3 [&:has([aria-expanded])]:w-px [&:has([aria-expanded])]:py-0 [&:has([aria-expanded])]:pr-0",
                  igrpDataTableCellClassName(cell.column.columnDef.meta, layout)
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>

          {row.getIsExpanded() && (
            <TableRow key={`${row.id}-expanded`}>
              <TableCell colSpan={row.getVisibleCells().length} className={expandedCellClassName}>
                {renderSubComponent ? renderSubComponent(row) : NotFoundRowSubComponent}
              </TableCell>
            </TableRow>
          )}
        </Fragment>
      ))}
    </>
  )
}

/** Dev-only warning: expansion is keyed by row index unless `getRowId` is given. */
function useIGRPDataTableRowIdWarning(componentName: string, hasSubComponent: boolean, hasRowId: boolean): void {
  const warned = useRef(false)
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || warned.current || !hasSubComponent || hasRowId) return
    warned.current = true
    console.warn(
      `${componentName}: renderSubComponent without getRowId keys expanded rows by index; if data is reordered or replaced (server-side sorting/paging, refetch) a different record opens. Pass getRowId.`
    )
  }, [componentName, hasSubComponent, hasRowId])
}

export {
  IGRPDataTableBodyRows,
  type IGRPDataTableBodyRowsProps,
  IGRPDataTableHeaderRows,
  type IGRPDataTableHeaderRowsProps,
  // eslint-disable-next-line react-refresh/only-export-components
  useIGRPDataTableRowIdWarning,
}
