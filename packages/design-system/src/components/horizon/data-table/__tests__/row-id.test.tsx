import { describe, expect, it, vi } from "vitest"
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

describe("IGRPDataTable getRowId", () => {
  // TanStack's default id is the index in `data`, so a re-sort alone does not move it;
  // the id goes stale when `data` itself is reordered (refetch, server paging/sorting).
  it("keeps an expanded row bound to its record when data is reordered and getRowId is given", async () => {
    const ui = (rows: Row[]) => (
      <IGRPDataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        getRowCanExpand={() => true}
        renderSubComponent={(row) => <p>detalhe {row.original.name}</p>}
      />
    )
    const { rerender } = render(ui(data))
    await userEvent.click(screen.getAllByRole("button", { name: "Expandir detalhes" })[0]!) // Bruno
    expect(screen.getByText("detalhe Bruno")).toBeInTheDocument()
    rerender(ui([...data].reverse())) // Ana first
    expect(screen.getByText("detalhe Bruno")).toBeInTheDocument()
    expect(screen.queryByText("detalhe Ana")).toBeNull()
  })

  it("warns once in development when renderSubComponent is set without getRowId", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { rerender } = render(<IGRPDataTable columns={columns} data={data} renderSubComponent={() => <p />} />)
    rerender(<IGRPDataTable columns={columns} data={data} renderSubComponent={() => <p />} />)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toMatch(/getRowId/)
    warn.mockRestore()
  })

  it("does not warn without renderSubComponent", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<IGRPDataTable columns={columns} data={data} />)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
