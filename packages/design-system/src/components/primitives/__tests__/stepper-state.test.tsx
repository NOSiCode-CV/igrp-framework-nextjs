import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { Stepper, StepperItem, StepperTitle, StepperTrigger } from "../stepper.js"

function Steps({ disabled, ...props }: React.ComponentProps<typeof Stepper> & { disabled?: number }) {
  return (
    <Stepper {...props}>
      {[1, 2, 3].map((step) => (
        <StepperItem key={step} step={step} disabled={step === disabled} data-testid={`step-${step}`}>
          <StepperTrigger>
            <StepperTitle>Passo {step}</StepperTitle>
          </StepperTrigger>
        </StepperItem>
      ))}
    </Stepper>
  )
}

const stateOf = (step: number) => screen.getByTestId(`step-${step}`).getAttribute("data-state")

describe("Stepper active step", () => {
  it("moves the active step on click when uncontrolled", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Steps defaultValue={1} onValueChange={onValueChange} />)
    expect(stateOf(1)).toBe("active")

    await user.click(screen.getByRole("button", { name: "Passo 3" }))
    expect(onValueChange).toHaveBeenCalledWith(3)
    expect([stateOf(1), stateOf(2), stateOf(3)]).toEqual(["completed", "completed", "active"])
  })

  it("only reports the change when controlled", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Steps value={1} onValueChange={onValueChange} />)
    await user.click(screen.getByRole("button", { name: "Passo 2" }))
    expect(onValueChange).toHaveBeenCalledWith(2)
    expect(stateOf(1)).toBe("active")
  })

  it("disables the trigger of a disabled step", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Steps defaultValue={1} disabled={2} onValueChange={onValueChange} />)
    const trigger = screen.getByRole("button", { name: "Passo 2" })
    expect(trigger).toBeDisabled()
    await user.click(trigger)
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
