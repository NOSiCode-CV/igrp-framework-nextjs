import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"

import { IGRPDataTable } from "../index.js"
import { IGRPDataTableCellCheckbox } from "../cell.js"
import { IGRPDataTableHeaderRowsSelect } from "../header.js"

type Person = { id: string; name: string }

const data: Person[] = Array.from({ length: 4 }, (_, i) => ({ id: `p${i}`, name: `Pessoa ${i}` }))
const columns: ColumnDef<Person>[] = [
  {
    id: "select",
    header: ({ table }) => <IGRPDataTableHeaderRowsSelect table={table} />,
    cell: ({ row }) => <IGRPDataTableCellCheckbox row={row} />,
  },
  { accessorKey: "name", header: "Nome" },
]
const getRowId = (row: Person) => row.id

const rowBoxes = () => screen.getAllByRole("checkbox").slice(1)
const selectAll = () => screen.getAllByRole("checkbox")[0]!

describe("IGRPDataTable row selection", () => {
  it("reports the selected rows' data, not on mount", async () => {
    const onSelectionChange = vi.fn()
    render(<IGRPDataTable columns={columns} data={data} getRowId={getRowId} onSelectionChange={onSelectionChange} />)
    expect(onSelectionChange).not.toHaveBeenCalled()

    await userEvent.click(rowBoxes()[1]!)
    expect(onSelectionChange).toHaveBeenLastCalledWith([data[1]])
  })

  it("is controlled by rowSelection + onRowSelectionChange", async () => {
    function Controlled() {
      const [selection, setSelection] = useState<RowSelectionState>({ p2: true })
      return (
        <>
          <output data-testid="selected">{Object.keys(selection).join(",")}</output>
          <IGRPDataTable
            columns={columns}
            data={data}
            getRowId={getRowId}
            rowSelection={selection}
            onRowSelectionChange={setSelection}
          />
          <button type="button" onClick={() => setSelection({})}>
            limpar
          </button>
        </>
      )
    }
    render(<Controlled />)
    expect(rowBoxes()[2]).toBeChecked()

    await userEvent.click(rowBoxes()[0]!)
    expect(screen.getByTestId("selected")).toHaveTextContent("p2,p0")

    await act(() => userEvent.click(screen.getByRole("button", { name: "limpar" })))
    expect(rowBoxes().some((box) => box.getAttribute("data-state") === "checked")).toBe(false)
  })

  it("select-all selects the current page only", async () => {
    const onSelectionChange = vi.fn()
    render(
      <IGRPDataTable
        columns={columns}
        data={data}
        getRowId={getRowId}
        showPagination
        pagination={{ defaultPageSize: 2 }}
        onSelectionChange={onSelectionChange}
      />
    )
    await userEvent.click(selectAll())
    expect(onSelectionChange).toHaveBeenLastCalledWith([data[0], data[1]])
  })
})
