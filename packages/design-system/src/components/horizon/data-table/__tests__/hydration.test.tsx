import type { ReactElement } from "react"
import { act } from "react"
import { hydrateRoot, type Root } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, afterAll, beforeAll, describe, expect, it, vi } from "vitest"

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

type Env = { IS_REACT_ACT_ENVIRONMENT?: boolean }

// Hydrates server markup of `ui` and returns what React reported.
async function hydrate(ui: () => ReactElement) {
  const container = document.createElement("div")
  container.innerHTML = renderToString(ui())
  document.body.append(container)
  const errors = vi.spyOn(console, "error").mockImplementation(() => {})
  const onRecoverableError = vi.fn()
  let root!: Root
  await act(async () => {
    root = hydrateRoot(container, ui(), { onRecoverableError })
  })
  roots.push(root)
  return { errors, onRecoverableError }
}

const roots: Root[] = []
let previousActEnv: boolean | undefined

// Guards request §1.6.5: the requester defers its first render one frame behind a skeleton.
describe("data table hydration", () => {
  // Hydrating outside @testing-library/react: tell React that act() is available.
  beforeAll(() => {
    previousActEnv = (globalThis as Env).IS_REACT_ACT_ENVIRONMENT
    ;(globalThis as Env).IS_REACT_ACT_ENVIRONMENT = true
  })
  afterAll(() => {
    ;(globalThis as Env).IS_REACT_ACT_ENVIRONMENT = previousActEnv
  })
  afterEach(async () => {
    await act(async () => {
      roots.splice(0).forEach((r) => r.unmount())
    })
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
    const { errors, onRecoverableError } = await hydrate(ui)
    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(errors).not.toHaveBeenCalled()
  })

  // Negative control: proves the assertions above can fire (and survive a React upgrade).
  it("reports a mismatch when server and client markup differ", async () => {
    let renders = 0
    const Differs = () => <span>{++renders === 1 ? "server" : "client"}</span>
    const { onRecoverableError } = await hydrate(() => <Differs />)
    expect(onRecoverableError).toHaveBeenCalled()
  })
})
