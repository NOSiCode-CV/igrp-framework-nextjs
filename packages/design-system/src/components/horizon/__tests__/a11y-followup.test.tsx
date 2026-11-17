import { render, screen } from "@testing-library/react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { describe, expect, it } from "vitest"

import { IGRPLabel } from "../label.js"
import { IGRPTextList } from "../typography/list.js"
import { IGRPLink } from "../typography/link.js"
import { IGRPBanner } from "../banner.js"
import { IGRPDataTableCellCheckbox, IGRPDataTableCellExpander } from "../data-table/cell.js"
import { IGRPDataTablePaginationNumeric } from "../data-table/pagination.js"

describe("IGRPLabel required mark", () => {
  it("hides the asterisk and announces 'obrigatório' in the control's name", () => {
    render(
      <>
        <IGRPLabel label="Nome" id="n" required />
        <input id="n" />
      </>
    )
    expect(screen.getByRole("textbox", { name: "Nome obrigatório" })).toBeInTheDocument()
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true")
  })
})

describe("IGRPTextList completed item", () => {
  it("says the item is completed, not only strikes it through", () => {
    render(<IGRPTextList type="checklist" items={[{ id: 1, content: "Rever", completed: true }]} />)
    expect(screen.getByRole("listitem")).toHaveTextContent("Rever concluído")
  })
})

describe("links that open a new tab", () => {
  it("IGRPLink says so for an external link", () => {
    render(<IGRPLink href="https://example.com">Site</IGRPLink>)
    expect(screen.getByRole("link", { name: "Site Abrir num novo separador" })).toHaveAttribute("target", "_blank")
  })

  it("IGRPLink stays quiet for a same-tab internal link", () => {
    render(<IGRPLink href="/a">Interno</IGRPLink>)
    expect(screen.getByRole("link", { name: "Interno" })).toBeInTheDocument()
  })

  it("IGRPBanner's learn-more link says so", () => {
    render(<IGRPBanner variant="announcement" message="Novidade" learnMoreHref="https://example.com" />)
    expect(screen.getByRole("link", { name: "Saber mais Abrir num novo separador" })).toBeInTheDocument()
  })
})

type Row = { id: string; name: string }
const rows: Row[] = Array.from({ length: 30 }, (_, i) => ({ id: String(i), name: `N${i}` }))

function Table({ withPagination = false }: { withPagination?: boolean }) {
  const columns: ColumnDef<Row>[] = [
    {
      id: "select",
      cell: ({ row }) => <IGRPDataTableCellCheckbox row={row} label={`Selecionar ${row.original.name}`} />,
    },
    { id: "expand", cell: ({ row }) => <IGRPDataTableCellExpander row={row} label={row.original.name} /> },
  ]
  const table = useReactTable({
    data: rows.slice(0, withPagination ? 30 : 1),
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowCanExpand: () => true,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  })
  if (withPagination) return <IGRPDataTablePaginationNumeric table={table} />
  const row = table.getRowModel().rows[0]!
  return (
    <>
      {row.getVisibleCells().map((cell) => (
        <div key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
      ))}
    </>
  )
}

describe("data table cells", () => {
  it("names the selection checkbox by the caller's label and the expander by its visible label", () => {
    render(<Table />)
    expect(screen.getByRole("checkbox", { name: "Selecionar N0" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "N0" })).toHaveAttribute("aria-expanded", "false")
  })
})

describe("IGRPDataTablePaginationNumeric", () => {
  it("names numeric page buttons and marks the current one", () => {
    render(<Table withPagination />)
    expect(screen.getByRole("button", { name: "Página 1" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("button", { name: "Página 2" })).not.toHaveAttribute("aria-current")
  })
})
