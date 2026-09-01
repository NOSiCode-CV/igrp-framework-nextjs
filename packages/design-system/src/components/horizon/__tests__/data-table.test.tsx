import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ColumnDef } from "@tanstack/react-table"

import { IGRPDataTable } from "../data-table"

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
