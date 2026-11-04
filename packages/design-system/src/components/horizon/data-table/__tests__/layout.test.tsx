import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { IGRPDataTable } from "../index.js"
import { createIGRPColumnHelper } from "../column-helper.js"

type Row = { id: string; name: string }

const col = createIGRPColumnHelper<Row>()
const data: Row[] = [{ id: "a", name: "Ana" }]
const columns = [col.accessor("name", { header: "Nome" })]
const columnsWithOps = [
  col.accessor("name", { header: "Nome", size: 200, meta: { cellClassName: "text-center tabular-nums" } }),
  col.display({ id: "ops", header: "", meta: { isActionsColumn: true }, cell: () => "Editar" }),
]
// Type-level (tsc): the global ColumnMeta augmentation must keep consumers' own meta keys legal.
col.accessor("name", { meta: { align: "right", cellClassName: "x" } })

describe("IGRPDataTable column layout", () => {
  it("truncates ordinary cells below lg and wraps them from lg", () => {
    render(<IGRPDataTable columns={columns} data={data} />)
    expect(screen.getByText("Ana").closest("td")).toHaveClass("truncate", "lg:whitespace-normal", "lg:wrap-anywhere")
  })

  it("makes a meta.isActionsColumn column nowrap and shrink-to-fit under layout auto", () => {
    render(<IGRPDataTable columns={columnsWithOps} data={data} />)
    const td = screen.getByText("Editar").closest("td")!
    expect(td).toHaveClass("w-px", "whitespace-nowrap")
    expect(td).not.toHaveClass("truncate")
    expect(screen.getAllByRole("columnheader").at(-1)).not.toHaveAttribute("style")
  })

  it("marks the generated actions column as the actions column", () => {
    render(<IGRPDataTable columns={columns} data={data} actions={[{ type: "link", label: "Ver", href: () => "/x" }]} />)
    expect(screen.getByRole("link", { name: "Ver" }).closest("td")).toHaveClass("w-px", "whitespace-nowrap")
  })

  it("lets meta.cellClassName win over truncate and over the actions classes", () => {
    const cols = [
      columnsWithOps[0]!,
      col.display({
        id: "ops",
        header: "",
        meta: { isActionsColumn: true, cellClassName: "text-right" },
        cell: () => "Editar",
      }),
    ]
    render(<IGRPDataTable columns={cols} data={data} />)
    const nameTd = screen.getByText("Ana").closest("td")!
    expect(nameTd).toHaveClass("text-center", "tabular-nums")
    expect(nameTd).not.toHaveClass("truncate")
    const opsTd = screen.getByText("Editar").closest("td")!
    expect(opsTd).toHaveClass("text-right")
    expect(opsTd).not.toHaveClass("w-px")
  })

  it("layout fixed sets table-fixed and keeps every header width", () => {
    render(<IGRPDataTable columns={columnsWithOps} data={data} layout="fixed" />)
    expect(screen.getByRole("table")).toHaveClass("table-fixed")
    for (const th of screen.getAllByRole("columnheader")) expect(th.style.width).toMatch(/px$/)
  })
})
