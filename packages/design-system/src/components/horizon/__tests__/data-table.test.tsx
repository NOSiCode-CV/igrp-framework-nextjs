import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { ColumnDef } from "@tanstack/react-table"

import { IGRPDataTable } from "../data-table/index.js"

type Row = { id: number; name: string; status: string }

const data: Row[] = [
  { id: 1, name: "Alice", status: "active" },
  { id: 2, name: "Bob", status: "pending" },
  { id: 3, name: "Carol", status: "active" },
]

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "status", header: "Status" },
]

describe("IGRPDataTable (smoke)", () => {
  it("renders one row per data item with all column headers", () => {
    render(<IGRPDataTable<Row, unknown> columns={columns} data={data} />)

    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
    expect(screen.getByText("Carol")).toBeInTheDocument()
  })

  it("renders the configured notFoundLabel when data is empty", () => {
    render(<IGRPDataTable<Row, unknown> columns={columns} data={[]} notFoundLabel="No rows yet" />)

    expect(screen.getByText("No rows yet")).toBeInTheDocument()
  })

  it("uses the default pt-PT empty label when none is provided", () => {
    render(<IGRPDataTable<Row, unknown> columns={columns} data={[]} />)

    expect(screen.getByText("Nenhum registo encontrado.")).toBeInTheDocument()
  })
})

describe("IGRPDataTable pagination", () => {
  const many = (n: number): Row[] =>
    Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}`, status: "active" }))

  it("clamps back to a real page when data shrinks under the current page", () => {
    const { rerender } = render(
      <IGRPDataTable<Row, unknown> columns={columns} data={many(30)} showPagination pageSizePagination={[10, 50]} />
    )
    fireEvent.click(screen.getByRole("button", { name: "Ir para a última página" }))
    expect(screen.getByText("Row 21")).toBeInTheDocument()

    rerender(
      <IGRPDataTable<Row, unknown> columns={columns} data={many(5)} showPagination pageSizePagination={[10, 50]} />
    )
    expect(screen.getByText("Row 1")).toBeInTheDocument()
  })

  it("keeps the page-size selector when the page size is >= the row count", () => {
    render(
      <IGRPDataTable<Row, unknown>
        columns={columns}
        data={many(30)}
        showPagination
        pagination={{ pageSizeOptions: [10, 50], defaultPageSize: 50 }}
      />
    )
    expect(screen.getByText("Registos por página")).toBeInTheDocument()
  })

  it("pages when the default size is below every option", () => {
    render(
      <IGRPDataTable<Row, unknown>
        columns={columns}
        data={many(30)}
        showPagination
        pagination={{ defaultPageSize: 5 }}
      />
    )
    expect(screen.getByRole("button", { name: "Ir para a página seguinte" })).toBeInTheDocument()
  })

  it("pages with empty page-size options", () => {
    render(
      <IGRPDataTable<Row, unknown>
        columns={columns}
        data={many(30)}
        showPagination
        pagination={{ pageSizeOptions: [], defaultPageSize: 10 }}
      />
    )
    expect(screen.getByRole("button", { name: "Ir para a página seguinte" })).toBeInTheDocument()
  })

  it("server-side keeps the page while rowCount is 0 (loading)", () => {
    const onQueryChange = vi.fn()
    const props = { columns, data: many(10), showPagination: true, pageSizePagination: [10, 50], onQueryChange }
    const { rerender } = render(<IGRPDataTable<Row, unknown> {...props} rowCount={30} />)
    fireEvent.click(screen.getByRole("button", { name: "Ir para a página seguinte" }))
    rerender(<IGRPDataTable<Row, unknown> {...props} rowCount={0} />)
    rerender(<IGRPDataTable<Row, unknown> {...props} rowCount={30} />)
    expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }))
  })

  it("does not submit an enclosing form when paging", () => {
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <IGRPDataTable<Row, unknown> columns={columns} data={many(30)} showPagination pageSizePagination={[10, 50]} />
      </form>
    )
    fireEvent.click(screen.getByRole("button", { name: "Ir para a página seguinte" }))
    expect(screen.getByText("Row 11")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("warns in development when an unpaginated client table renders more than 500 rows", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const many = Array.from({ length: 501 }, (_, i) => ({ id: i, name: `Row ${i}`, status: "active" }))
    const { unmount } = render(<IGRPDataTable<Row, unknown> columns={columns} data={many} showPagination />)
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("every row renders"))
    unmount()
    render(<IGRPDataTable<Row, unknown> columns={columns} data={many} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("every row renders"))
    warn.mockRestore()
  })
})
