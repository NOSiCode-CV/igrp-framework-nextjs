import { act } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { IGRPDataTable } from "../index.js"
import { IGRPServerDataTable } from "../server.js"
import { createIGRPColumnHelper } from "../column-helper.js"
import type { IGRPDataTableAction, IGRPServerPaginationState } from "../types.js"

type R = { id: string; name: string }

const col = createIGRPColumnHelper<R>()
const columns = [col.accessor("name", { header: "Nome" })]
const data: R[] = Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, name: `Nome ${i}` }))
const actions: IGRPDataTableAction<R>[] = [
  { type: "alert", label: "Eliminar", title: "Eliminar?", onConfirm: () => {} },
]
const pagination: IGRPServerPaginationState = { pageIndex: 0, pageSize: 10, totalElements: 25, totalPages: 3 }

// Guards request §1.6.5: the requester defers its first render one frame behind a skeleton.
describe("data table hydration", () => {
  // Hydrating outside @testing-library/react: tell React that act() is available.
  beforeAll(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })
  afterEach(() => {
    document.body.innerHTML = ""
    vi.restoreAllMocks()
  })

  it.each([
    ["IGRPDataTable", () => <IGRPDataTable columns={columns} data={data} showPagination actions={actions} />],
    [
      "IGRPServerDataTable",
      () => <IGRPServerDataTable columns={columns} data={data} pagination={pagination} onPaginationChange={() => {}} />,
    ],
  ])("%s hydrates without a mismatch", async (_, ui) => {
    const container = document.createElement("div")
    container.innerHTML = renderToString(ui())
    document.body.append(container)
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    const onRecoverableError = vi.fn()
    await act(async () => {
      hydrateRoot(container, ui(), { onRecoverableError })
    })
    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(errors).not.toHaveBeenCalled()
  })
})
