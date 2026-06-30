import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useReactTable, getCoreRowModel, getFilteredRowModel, type ColumnDef } from "@tanstack/react-table"
import { useFilterState } from "../hooks/use-filter-state"

type Row = { id: number; name: string }
const columns: ColumnDef<Row>[] = [{ accessorKey: "name", id: "name" }]
const data: Row[] = [
  { id: 1, name: "alpha" },
  { id: 2, name: "beta" },
]

function useHarness() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })
  return { table, ...useFilterState(table) }
}

describe("useFilterState.isFiltered", () => {
  it("becomes true after a column filter is applied", () => {
    const { result } = renderHook(() => useHarness())
    expect(result.current.isFiltered).toBe(false)
    act(() => result.current.table.getColumn("name")!.setFilterValue("al"))
    expect(result.current.isFiltered).toBe(true) // FAILS while memo deps are [table]
  })

  it("returns to false after handleClear", () => {
    const { result } = renderHook(() => useHarness())
    act(() => result.current.table.getColumn("name")!.setFilterValue("al"))
    act(() => result.current.handleClear())
    expect(result.current.isFiltered).toBe(false)
  })
})
