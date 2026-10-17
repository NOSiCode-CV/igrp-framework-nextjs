import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { IGRPModalDialog, IGRPModalDialogContent, IGRPModalDialogTitle } from "../../modal-dialog.js"
import { IGRPCombobox } from "../combobox.js"

const options = Array.from({ length: 40 }, (_, index) => ({
  value: String(2090 - index),
  label: String(2090 - index),
}))

describe("IGRPCombobox scrolling inside a modal dialog", () => {
  it("allows native wheel scrolling in the portaled list while preserving the dialog scroll lock", async () => {
    const user = userEvent.setup()
    render(
      <IGRPModalDialog defaultOpen>
        <IGRPModalDialogContent aria-describedby={undefined}>
          <IGRPModalDialogTitle>Add DUC</IGRPModalDialogTitle>
          <IGRPCombobox name="year" options={options} showSearch />
        </IGRPModalDialogContent>
      </IGRPModalDialog>
    )
    await user.click(screen.getByRole("combobox"))
    const list = screen.getByRole("listbox")
    const dialog = screen.getByRole("dialog", { name: "Add DUC" })
    expect(dialog).not.toContainElement(list)
    Object.defineProperties(list, {
      scrollHeight: { configurable: true, value: 1200 },
      clientHeight: { configurable: true, value: 300 },
      scrollTop: { configurable: true, writable: true, value: 200 },
    })

    for (const deltaY of [100, -100]) {
      const wheel = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY })
      act(() => {
        list.dispatchEvent(wheel)
      })
      // jsdom cannot scroll, but cancellation prevents the browser's native scrolling.
      expect(wheel.defaultPrevented).toBe(false)
    }

    const backgroundWheel = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 100 })
    act(() => {
      document.body.dispatchEvent(backgroundWheel)
    })
    expect(backgroundWheel.defaultPrevented).toBe(true)
    expect(document.body).toHaveAttribute("data-scroll-locked")
    await user.click(screen.getByRole("option", { name: "2090", exact: true }))
    expect(screen.getByRole("combobox")).toHaveTextContent("2090")
    expect(screen.getByRole("dialog", { name: "Add DUC" })).toBeInTheDocument()
  })
})
