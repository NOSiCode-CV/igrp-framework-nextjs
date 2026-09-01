import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPInputNumber } from "../input/number"
import { IGRPI18nProvider } from "../../../i18n"

describe("IGRPInputNumber", () => {
  it("renders with role=spinbutton and the pt-PT increment/decrement labels", () => {
    render(<IGRPInputNumber name="qty" label="Quantity" />)
    expect(screen.getByRole("spinbutton", { name: /Quantity/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Incrementar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Decrementar" })).toBeInTheDocument()
  })

  it("increments on stepper click and calls onChange", async () => {
    const onChange = vi.fn()
    render(<IGRPInputNumber name="qty" label="Quantity" defaultValue={5} onChange={onChange} />)

    await userEvent.click(screen.getByRole("button", { name: "Incrementar" }))
    expect(onChange).toHaveBeenCalledWith(6)
  })

  it("clamps to max on increment", async () => {
    const onChange = vi.fn()
    render(<IGRPInputNumber name="qty" label="Quantity" defaultValue={9} max={10} onChange={onChange} />)

    await userEvent.click(screen.getByRole("button", { name: "Incrementar" }))
    expect(onChange).toHaveBeenLastCalledWith(10)
    await userEvent.click(screen.getByRole("button", { name: "Incrementar" }))
    // Button is disabled at max — onChange should not fire again.
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("uses overridden i18n strings", () => {
    render(
      <IGRPI18nProvider strings={{ inputNumber: { incrementLabel: "Up", decrementLabel: "Down" } }}>
        <IGRPInputNumber name="qty" label="Quantity" />
      </IGRPI18nProvider>,
    )
    expect(screen.getByRole("button", { name: "Up" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Down" })).toBeInTheDocument()
  })

  it("exposes aria-valuemin/max for assistive tech", () => {
    render(<IGRPInputNumber name="qty" label="Q" min={0} max={100} defaultValue={50} />)
    const spinbutton = screen.getByRole("spinbutton")
    expect(spinbutton).toHaveAttribute("aria-valuemin", "0")
    expect(spinbutton).toHaveAttribute("aria-valuemax", "100")
    expect(spinbutton).toHaveAttribute("aria-valuenow", "50")
  })
})
