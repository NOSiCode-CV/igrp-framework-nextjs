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
    // aria-disabled, not native disabled: the button keeps keyboard focus while pending.
    const action = screen.getByRole("button", { name: /A carregar/ })
    expect(action).toHaveAttribute("aria-disabled", "true")
    expect(action).not.toBeDisabled()
    expect(action).toHaveFocus()
    const cancel = screen.getByRole("button", { name: "Cancelar" })
    expect(cancel).toHaveAttribute("aria-disabled", "true")
    expect(cancel).not.toBeDisabled()
    await act(async () => d.resolve())
    expect(screen.queryByRole("alertdialog")).toBeNull()
  })

  it("ignores cancel, Escape and repeat action clicks while pending", async () => {
    const d = deferred()
    const onAction = vi.fn(() => d.promise)
    const onCancel = vi.fn()
    render(
      <IGRPAlertDialog title="Confirmar" trigger={<button>Apagar</button>} onAction={onAction} onCancel={onCancel} />
    )
    await open()
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }))
    await userEvent.click(screen.getByRole("button", { name: /A carregar/ }))
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))
    await userEvent.keyboard("{Escape}")
    expect(onAction).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    await act(async () => d.resolve())
  })

  it("stays open when the async action rejects, and rethrows the rejection", async () => {
    // Swap Vitest's own handler out so the expected unhandled rejection is observed, not reported.
    const saved = process.listeners("unhandledRejection")
    process.removeAllListeners("unhandledRejection")
    const seen: unknown[] = []
    process.on("unhandledRejection", (reason) => seen.push(reason))
    try {
      const d = deferred()
      const error = new Error("x")
      render(<IGRPAlertDialog title="Confirmar" trigger={<button>Apagar</button>} onAction={() => d.promise} />)
      await open()
      await userEvent.click(screen.getByRole("button", { name: "Continuar" }))
      await act(async () => d.reject(error))
      expect(screen.getByRole("alertdialog")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Continuar" })).not.toHaveAttribute("aria-disabled")
      await vi.waitFor(() => expect(seen).toEqual([error]))
    } finally {
      process.removeAllListeners("unhandledRejection")
      for (const l of saved) process.on("unhandledRejection", l)
    }
  })

  it('renders the deprecated iconPlacement="end" as "start" (icon still shown)', () => {
    render(<IGRPAlertDialog open title="Confirmar" iconPlacement="end" iconName="Trash" />)
    expect(screen.getByRole("alertdialog").querySelector("svg")).not.toBeNull()
  })
})
