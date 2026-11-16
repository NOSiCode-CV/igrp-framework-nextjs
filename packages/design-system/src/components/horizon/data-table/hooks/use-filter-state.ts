"use client"
// `table` keeps its identity across renders, so compiler memoization would freeze `getState()`.
"use no memo"

import { useCallback } from "react"
import { type Table } from "@tanstack/react-table"

function useFilterState<TData>(
  table: Table<TData>,
  onFiltersCleared?: () => void
): { isFiltered: boolean; handleClear: () => void } {
  const isFiltered = table.getState().columnFilters.length > 0

  const handleClear = useCallback(() => {
    table.resetColumnFilters()
    onFiltersCleared?.()
  }, [table, onFiltersCleared])

  return { isFiltered, handleClear }
}

export { useFilterState }
