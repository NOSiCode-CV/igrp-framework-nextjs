"use client"

import { useCallback, useMemo } from "react"
import { type Table } from "@tanstack/react-table"

function useFilterState<TData>(
  table: Table<TData>,
  onFiltersCleared?: () => void,
): { isFiltered: boolean; handleClear: () => void } {
  const isFiltered = useMemo(() => table.getState().columnFilters.length > 0, [table])

  const handleClear = useCallback(() => {
    table.resetColumnFilters()
    onFiltersCleared?.()
  }, [table, onFiltersCleared])

  return { isFiltered, handleClear }
}

export { useFilterState }
