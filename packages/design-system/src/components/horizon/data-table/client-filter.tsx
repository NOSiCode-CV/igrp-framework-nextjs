"use client"
"use no memo"

import { type Column, type Table } from "@tanstack/react-table"
import { Fragment, type JSX } from "react"

import { cn } from "../../../lib/utils"
import { useFilterState } from "./hooks/use-filter-state"
import { IGRPButton } from "../button"

/**
 * Single filter config for client-side filtering.
 * @see IGRPDataTableClientFilter
 */
interface IGRPDataTableClientFilterListProps<TData> {
  /** Column id to filter. */
  columnId: keyof TData
  /** Filter component receiving the column. */
  component: (props: { column: Column<TData, unknown> }) => JSX.Element
}

/**
 * Props for the IGRPDataTableClientFilter component.
 * @see IGRPDataTableClientFilter
 */
interface IGRPDataTableFilterClientProps<TData> {
  /** TanStack Table instance. */
  table: Table<TData>
  /** Filter configurations. */
  filterList: IGRPDataTableClientFilterListProps<TData>[]
  /** Label for clear filters button. */
  filterLabel: string
  /** Optional callback invoked after all filters are cleared. */
  onFiltersCleared?: () => void
}

/**
 * Renders client-side filter components for each configured column.
 */
function IGRPDataTableClientFilter<TData>({
  table,
  filterList,
  filterLabel,
  onFiltersCleared,
}: IGRPDataTableFilterClientProps<TData>) {
  const { isFiltered, handleClear } = useFilterState(table, onFiltersCleared)

  return (
    <div className={cn("flex md:items-center gap-2 flex-col md:flex-row")}>
      {filterList.map(({ columnId, component }) => {
        const column = table.getColumn(columnId as string)
        return column && <Fragment key={columnId as string}>{component({ column })}</Fragment>
      })}

      {isFiltered && (
        <IGRPButton onClick={handleClear} variant="ghost" showIcon iconName="X">
          {filterLabel}
        </IGRPButton>
      )}
    </div>
  )
}

export { IGRPDataTableClientFilter, type IGRPDataTableFilterClientProps, type IGRPDataTableClientFilterListProps }
