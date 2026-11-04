import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPDataTable } from "../index.js"
import { createIGRPColumnHelper } from "../column-helper.js"
import { IGRPDataTableCellExpander } from "../cell.js"
import { IGRPDataTableHeaderSortToggle } from "../header.js"

type Row = { id: string; name: string }

const col = createIGRPColumnHelper<Row>()
const columns = [
  col.display({ id: "expander", cell: ({ row }) => <IGRPDataTableCellExpander row={row} /> }),
  col.accessor("name", {
    header: ({ column }) => <IGRPDataTableHeaderSortToggle column={column} title="Nome" />,
  }),
]
const data: Row[] = [
  { id: "b", name: "Bruno" },
  { id: "a", name: "Ana" },
]

// Pins IGRPDataTable's header/body rendering so the move into table-rows.tsx cannot change it.
describe("IGRPDataTable header and body rows", () => {
  it("renders one empty cell spanning every column, including the actions column", () => {
    render(<IGRPDataTable columns={columns} data={[]} actions={[{ type: "link", label: "Ver", href: () => "/x" }]} />)
    const cell = screen.getByText("Nenhum registo encontrado.")
    expect(cell.tagName).toBe("TD")
    expect(cell).toHaveAttribute("colspan", "3")
  })

  it("renders the N/D block in a full-width row when expanded without renderSubComponent", async () => {
    render(<IGRPDataTable columns={columns} data={data} getRowCanExpand={() => true} getRowId={(r) => r.id} />)
    await userEvent.click(screen.getAllByRole("button", { name: "Expandir detalhes" })[0]!)
    expect(screen.getByText("N/D").closest("td")).toHaveAttribute("colspan", "2")
  })

  it("sets aria-sort on a sortable column header", async () => {
    render(<IGRPDataTable columns={columns} data={data} />)
    const th = screen.getByRole("columnheader", { name: /Nome/ })
    expect(th).toHaveAttribute("aria-sort", "none")
    await userEvent.click(screen.getByRole("button", { name: /Nome/ }))
    expect(th).toHaveAttribute("aria-sort", "ascending")
  })
})
