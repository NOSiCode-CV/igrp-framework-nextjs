import { describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPAlertDialog } from "../alert-dialog.js"

function deferred() {
  let resolve!: () => void
  let reject!: (e: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const open = () => userEvent.click(screen.getByRole("button", { name: "Apagar" }))

describe("IGRPAlertDialog", () => {
  it("opens from the trigger slot and closes on a sync action", async () => {
    const onAction = vi.fn()
    render(<IGRPAlertDialog title="Confirmar" trigger={<button>Apagar</button>} onAction={onAction} />)
    expect(screen.queryByRole("alertdialog")).toBeNull()
    await open()
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }))
    expect(onAction).toHaveBeenCalledOnce()
    expect(screen.queryByRole("alertdialog")).toBeNull()
  })

  it("stays open and loading while an async action runs, then closes on resolve", async () => {
    const d = deferred()
    render(<IGRPAlertDialog title="Confirmar" trigger={<button>Apagar</button>} onAction={() => d.promise} />)
    await open()
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }))
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /A carregar/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled()
    await act(async () => d.resolve())
    expect(screen.queryByRole("alertdialog")).toBeNull()
  })

  it("stays open when the async action rejects", async () => {
    const d = deferred()
    render(<IGRPAlertDialog title="Confirmar" trigger={<button>Apagar</button>} onAction={() => d.promise} />)
    await open()
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }))
    await act(async () => d.reject(new Error("x")))
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled()
  })

  it('renders the deprecated iconPlacement="end" as "start" (icon still shown)', () => {
    render(<IGRPAlertDialog open title="Confirmar" iconPlacement="end" iconName="Trash" />)
    expect(screen.getByRole("alertdialog").querySelector("svg")).not.toBeNull()
  })
})
