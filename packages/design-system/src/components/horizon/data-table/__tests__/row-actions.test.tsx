import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPDataTable } from "../index.js"
import { createIGRPColumnHelper } from "../column-helper.js"
import type { IGRPDataTableAction } from "../types.js"

type Row = { id: number; name: string }

const col = createIGRPColumnHelper<Row>()
// No cast: the helper's output must be assignable to `columns` (it wasn't before — tsc covers this line).
const columns = [col.accessor("name", { header: "Nome" })]
const data: Row[] = [{ id: 1, name: "Alice" }]

describe("IGRPDataTable row actions", () => {
  it("defaults the inline alert dialog's buttons to the i18n catalog", async () => {
    const actions: IGRPDataTableAction<Row>[] = [
      { type: "alert", label: "Eliminar", title: "Eliminar?", onConfirm: () => {} },
    ]
    render(<IGRPDataTable columns={columns} data={data} actions={actions} />)

    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }))

    expect(await screen.findByRole("button", { name: "Cancelar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument()
  })

  it("opens a modal action from the dropdown and gives render a working close", async () => {
    const actions: IGRPDataTableAction<Row>[] = [
      { type: "link", label: "Ver", href: () => "/x" },
      { type: "alert", label: "Eliminar", title: "Eliminar?", onConfirm: () => {} },
      {
        type: "modal",
        label: "Editar",
        render: (row, close) => (
          <button type="button" onClick={close}>
            Fechar {row.original.name}
          </button>
        ),
      },
    ]
    render(<IGRPDataTable columns={columns} data={data} actions={actions} />)

    await userEvent.click(screen.getByRole("button", { name: "Abrir ações" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: "Editar" }))

    const closeButton = await screen.findByRole("button", { name: "Fechar Alice" })
    await userEvent.click(closeButton)
    expect(screen.queryByRole("button", { name: "Fechar Alice" })).not.toBeInTheDocument()
  })

  it("renders a custom action's element as the dropdown item and runs its onClick", async () => {
    const onArchive = vi.fn()
    const actions: IGRPDataTableAction<Row>[] = [
      { type: "link", label: "Ver", href: () => "/x" },
      { type: "alert", label: "Eliminar", title: "Eliminar?", onConfirm: () => {} },
      {
        type: "custom",
        label: "Arquivar",
        render: (row) => (
          <button type="button" onClick={() => onArchive(row.original.id)}>
            Arquivar
          </button>
        ),
      },
    ]
    render(<IGRPDataTable columns={columns} data={data} actions={actions} />)

    await userEvent.click(screen.getByRole("button", { name: "Abrir ações" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: "Arquivar" }))

    expect(onArchive).toHaveBeenCalledWith(1)
  })
})

describe("IGRPDataTable pagination config", () => {
  it("starts at pagination.defaultPageSize", () => {
    const many: Row[] = Array.from({ length: 12 }, (_, i) => ({ id: i, name: `Linha ${i}` }))
    render(
      <IGRPDataTable
        columns={columns}
        data={many}
        showPagination
        pagination={{ defaultPageSize: 5, pageSizeOptions: [5, 10] }}
      />
    )

    expect(screen.getByText("Linha 4")).toBeInTheDocument()
    expect(screen.queryByText("Linha 5")).not.toBeInTheDocument()
  })
})
