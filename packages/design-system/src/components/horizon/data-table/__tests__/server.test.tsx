import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPServerDataTable } from "../server.js"
import { createIGRPColumnHelper } from "../column-helper.js"
import { IGRPDataTableCellExpander } from "../cell.js"
import { IGRPDataTableHeaderSortToggle } from "../header.js"
import type { IGRPServerPaginationState } from "../types.js"

type R = { id: string; name: string }

const col = createIGRPColumnHelper<R>()
const columns = [
  col.display({ id: "expander", cell: ({ row }) => <IGRPDataTableCellExpander row={row} /> }),
  col.accessor("name", {
    header: ({ column }) => <IGRPDataTableHeaderSortToggle column={column} title="Nome" />,
  }),
]
const page = (n: number): R[] => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, name: `Nome ${i}` }))
const p = (o: Partial<IGRPServerPaginationState> = {}): IGRPServerPaginationState => ({
  pageIndex: 0,
  pageSize: 10,
  totalElements: 25,
  totalPages: 3,
  ...o,
})
const noop = () => {}
const BA: R[] = [
  { id: "b", name: "Bruno" },
  { id: "a", name: "Ana" },
]
const firstBodyCellTexts = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((r) => r.querySelectorAll("td")[1]?.textContent)
const sortButton = () => screen.getByRole("button", { name: /Nome/ })

describe("IGRPServerDataTable", () => {
  it("reports the next page flat and does not move until the parent does", async () => {
    const onPage = vi.fn()
    const { rerender } = render(
      <IGRPServerDataTable columns={columns} data={page(10)} pagination={p()} onPaginationChange={onPage} />
    )
    await userEvent.click(screen.getByRole("button", { name: "Ir para a página seguinte" }))
    expect(onPage).toHaveBeenCalledWith(1, 10)
    expect(screen.getByText("1-10")).toBeInTheDocument()
    rerender(
      <IGRPServerDataTable
        columns={columns}
        data={page(10)}
        pagination={p({ pageIndex: 1 })}
        onPaginationChange={onPage}
      />
    )
    expect(screen.getByText("11-20")).toBeInTheDocument()
  })

  it("reports a page-size change with TanStack's derived page index", async () => {
    const onPage = vi.fn()
    render(
      <IGRPServerDataTable
        columns={columns}
        data={page(10)}
        pagination={p({ pageIndex: 1 })}
        onPaginationChange={onPage}
      />
    )
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "30" }))
    expect(onPage).toHaveBeenCalledWith(0, 30)
  })

  it("never paginates data itself", () => {
    render(<IGRPServerDataTable columns={columns} data={page(12)} pagination={p()} onPaginationChange={noop} />)
    expect(screen.getAllByRole("row")).toHaveLength(13)
  })

  it("sorts the loaded page and fires no callback when sorting props are omitted", async () => {
    render(<IGRPServerDataTable columns={columns} data={BA} pagination={p()} onPaginationChange={noop} />)
    await userEvent.click(sortButton())
    expect(firstBodyCellTexts()).toEqual(["Ana", "Bruno"])
  })

  it("reports SortingState and keeps row order when sorting and onSortingChange are given", async () => {
    const onSort = vi.fn()
    render(
      <IGRPServerDataTable
        columns={columns}
        data={BA}
        pagination={p()}
        onPaginationChange={noop}
        sorting={[]}
        onSortingChange={onSort}
      />
    )
    await userEvent.click(sortButton())
    expect(onSort).toHaveBeenCalledWith([{ id: "name", desc: false }])
    expect(firstBodyCellTexts()).toEqual(["Bruno", "Ana"])
  })

  it("cycles asc and desc only, never back to unsorted", async () => {
    render(<IGRPServerDataTable columns={columns} data={BA} pagination={p()} onPaginationChange={noop} />)
    const seen: (string | null)[] = []
    for (let i = 0; i < 3; i++) {
      await userEvent.click(sortButton())
      seen.push(screen.getByRole("columnheader", { name: /Nome/ }).getAttribute("aria-sort"))
    }
    expect(seen).toEqual(["ascending", "descending", "ascending"])
  })

  it("shows the bar for a single-page result", () => {
    render(
      <IGRPServerDataTable
        columns={columns}
        data={page(2)}
        pagination={p({ totalElements: 2, totalPages: 1 })}
        onPaginationChange={noop}
      />
    )
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })

  it("hides the bar when data is empty and when enablePagination is false", () => {
    const { unmount } = render(
      <IGRPServerDataTable columns={columns} data={[]} pagination={p()} onPaginationChange={noop} />
    )
    expect(screen.queryByRole("combobox")).toBeNull()
    unmount()
    render(
      <IGRPServerDataTable
        columns={columns}
        data={page(3)}
        pagination={p()}
        onPaginationChange={noop}
        enablePagination={false}
      />
    )
    expect(screen.queryByRole("combobox")).toBeNull()
  })

  it("renders the empty row spanning every column with the catalog default", () => {
    render(<IGRPServerDataTable columns={columns} data={[]} pagination={p()} onPaginationChange={noop} />)
    expect(screen.getByText("Nenhum registo encontrado.")).toHaveAttribute("colspan", "2")
  })

  it("uses notFoundLabel when given", () => {
    render(
      <IGRPServerDataTable
        columns={columns}
        data={[]}
        pagination={p()}
        onPaginationChange={noop}
        notFoundLabel="Nenhuma taxa encontrada."
      />
    )
    expect(screen.getByText("Nenhuma taxa encontrada.")).toBeInTheDocument()
  })

  it("renders the expanded row full width with no padding, and N/D without renderSubComponent", async () => {
    render(
      <IGRPServerDataTable
        columns={columns}
        data={BA}
        pagination={p()}
        onPaginationChange={noop}
        getRowCanExpand={() => true}
        getRowId={(r) => r.id}
      />
    )
    await userEvent.click(screen.getAllByRole("button", { name: "Expandir detalhes" })[0]!)
    const td = screen.getByText("N/D").closest("td")!
    expect(td).toHaveAttribute("colspan", "2")
    expect(td).toHaveClass("p-0")
  })

  const expansionUi = (rows: R[], pageIndex: number, withId: boolean) => (
    <IGRPServerDataTable
      columns={columns}
      data={rows}
      pagination={p({ pageIndex })}
      onPaginationChange={noop}
      getRowCanExpand={() => true}
      getRowId={withId ? (r) => r.id : undefined}
      renderSubComponent={(row) => <p>detalhe {row.original.name}</p>}
    />
  )
  const AB: R[] = [BA[1]!, BA[0]!]
  const CB: R[] = [{ id: "c", name: "Carla" }, BA[0]!]

  it("keeps an expanded row bound to its record across a page change and a re-sort with getRowId", async () => {
    const { rerender } = render(expansionUi(BA, 0, true))
    await userEvent.click(screen.getAllByRole("button", { name: "Expandir detalhes" })[0]!) // Bruno
    expect(screen.getByText("detalhe Bruno")).toBeInTheDocument()
    rerender(expansionUi(AB, 0, true)) // a re-sort arrives as new data
    expect(screen.getByText("detalhe Bruno")).toBeInTheDocument()
    expect(screen.queryByText("detalhe Ana")).toBeNull()
    rerender(expansionUi(CB, 1, true))
    expect(screen.getByText("detalhe Bruno")).toBeInTheDocument()
    expect(screen.queryByText("detalhe Carla")).toBeNull()
  })

  it("without getRowId the expansion follows the index (the regression getRowId fixes)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { rerender } = render(expansionUi(BA, 0, false))
    await userEvent.click(screen.getAllByRole("button", { name: "Expandir detalhes" })[0]!) // index 0 = Bruno
    rerender(expansionUi(AB, 0, false))
    expect(screen.getByText("detalhe Ana")).toBeInTheDocument()
    expect(screen.queryByText("detalhe Bruno")).toBeNull()
    warn.mockRestore()
  })

  it("warns once in development when renderSubComponent is set without getRowId", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { rerender } = render(expansionUi(BA, 0, false))
    rerender(expansionUi(BA, 0, false))
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toMatch(/^IGRPServerDataTable:.*getRowId/)
    warn.mockRestore()
  })
})
