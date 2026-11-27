import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { type ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table"

import { IGRPDataTable } from "../index.js"
import { IGRPDataTableFilterDropdown, IGRPDataTableFilterFaceted, IGRPDataTableFilterSelect } from "../filter.js"
import { IGRPDataTablePagination } from "../pagination.js"

const mockColumn = (setFilterValue = vi.fn()) =>
  ({ getFacetedUniqueValues: () => new Map(), getFilterValue: () => undefined, setFilterValue }) as never

describe("IGRPDataTableFilterSelect", () => {
  it("shows the placeholder when no filter is set", () => {
    render(
      <IGRPDataTableFilterSelect column={mockColumn()} placeholder="Todos" options={[{ value: "a", label: "A" }]} />
    )
    expect(screen.getByRole("combobox")).toHaveTextContent("Todos")
  })
})

describe("IGRPDataTableFilterFaceted", () => {
  it("toggles once per click and exposes the checked state on the option", async () => {
    const setFilterValue = vi.fn()
    render(
      <IGRPDataTableFilterFaceted
        column={mockColumn(setFilterValue)}
        placeholder="Estado"
        options={[{ value: "a", label: "Ativo" }]}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: "Estado" }))
    const option = screen.getByRole("option", { name: /Ativo/ })
    await userEvent.click(option)
    expect(setFilterValue).toHaveBeenCalledTimes(1)
    expect(setFilterValue).toHaveBeenCalledWith(["a"])
    expect(option).toHaveAttribute("aria-checked", "false")
  })

  it("searches by label, not only by value", async () => {
    render(
      <IGRPDataTableFilterFaceted
        column={mockColumn()}
        placeholder="Estado"
        options={[
          { value: "s1", label: "Ativo" },
          { value: "s2", label: "Inativo" },
        ]}
        showFilter
      />
    )
    await userEvent.click(screen.getByRole("button", { name: "Estado" }))
    await userEvent.type(screen.getByPlaceholderText("Estado"), "inat")
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Inativo0"])
  })
})

type Row = { id: string; status: string; createdAt: string }
const data: Row[] = [
  { id: "1", status: "open", createdAt: "2026-01-10" },
  { id: "2", status: "closed", createdAt: "2026-03-10" },
  { id: "3", status: "open", createdAt: "2026-05-10" },
]

describe("IGRPDataTable filter descriptors", () => {
  it("filters a faceted descriptor column without a filterFn on the column", async () => {
    const columns = [
      { accessorKey: "id", header: "Id" },
      {
        accessorKey: "status",
        header: "Estado",
        filter: {
          type: "faceted",
          placeholder: "Filtrar estado",
          options: [
            { value: "open", label: "Aberto" },
            { value: "closed", label: "Fechado" },
          ],
        },
      },
    ] as ColumnDef<Row>[]
    render(<IGRPDataTable columns={columns} data={data} showFilter />)

    await userEvent.click(screen.getByRole("button", { name: "Filtrar estado" }))
    await userEvent.click(screen.getByRole("option", { name: /Fechado/ }))

    const body = screen.getAllByRole("rowgroup")[1]!
    expect(within(body).getAllByRole("row")).toHaveLength(1)
    expect(within(body).getByText("closed")).toBeInTheDocument()
  })

  it("passes the descriptor placeholder to the select filter", () => {
    const columns = [
      {
        accessorKey: "status",
        header: "Estado",
        filter: { type: "select", placeholder: "Qualquer estado", options: [{ value: "open", label: "Aberto" }] },
      },
    ] as ColumnDef<Row>[]
    render(<IGRPDataTable columns={columns} data={data} showFilter />)
    expect(screen.getByRole("combobox")).toHaveTextContent("Qualquer estado")
  })
})

function EmptyPagination() {
  const table = useReactTable<Row>({
    data: [],
    columns: [{ accessorKey: "id" }],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
  return <IGRPDataTablePagination table={table} />
}

describe("IGRPDataTablePagination", () => {
  it("shows 0-0 for an empty table", () => {
    render(<EmptyPagination />)
    expect(screen.getByText("0-0")).toBeInTheDocument()
  })
})

describe("IGRPDataTableFilterDropdown", () => {
  it("offers a clear item once a value is set", async () => {
    const setFilterValue = vi.fn()
    const column = { getFilterValue: () => "a", setFilterValue } as never
    render(<IGRPDataTableFilterDropdown column={column} options={[{ value: "a", label: "A" }]} />)
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: /Limpar/ }))
    expect(setFilterValue).toHaveBeenCalledWith(undefined)
  })
})

describe("IGRPDataTable selection", () => {
  const columns = [{ accessorKey: "status", header: "Estado" }] as ColumnDef<Row>[]

  it("adds a checkbox column with select-all", async () => {
    const onSelectionChange = vi.fn()
    render(<IGRPDataTable columns={columns} data={data} selection="checkbox" onSelectionChange={onSelectionChange} />)
    const boxes = screen.getAllByRole("checkbox")
    expect(boxes).toHaveLength(4)
    await userEvent.click(boxes[0]!)
    expect(onSelectionChange).toHaveBeenLastCalledWith(data)
  })

  it("adds a switch per row when selection is switch", async () => {
    const onSelectionChange = vi.fn()
    render(<IGRPDataTable columns={columns} data={data} selection="switch" onSelectionChange={onSelectionChange} />)
    const switches = screen.getAllByRole("switch")
    expect(switches).toHaveLength(3)
    await userEvent.click(switches[1]!)
    expect(onSelectionChange).toHaveBeenLastCalledWith([data[1]])
  })
})
