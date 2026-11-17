import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { render, screen } from "@testing-library/react"

import { IGRPStepperProcess } from "../process/stepper.js"

describe("IGRPStepperProcess", () => {
  // Regression: a raw <Tooltip> threw "Tooltip must be used within TooltipProvider"
  // when no app-level provider from the same radix-ui copy was in the tree.
  it("renders without an app-level TooltipProvider", () => {
    render(
      <IGRPStepperProcess
        currentStep={1}
        steps={[
          { step: 1, stepKey: "a", title: "Pedido", isCompleted: true, isActive: false },
          { step: 2, stepKey: "b", title: "Análise", isCompleted: false, isActive: true },
        ]}
      >
        {(step) => <p>conteúdo {step}</p>}
      </IGRPStepperProcess>
    )
    expect(screen.getByText("Análise")).toBeInTheDocument()
    expect(screen.getByText("conteúdo 1")).toBeInTheDocument()
  })
})

describe("IGRPStepperProcess step status", () => {
  const steps = [
    { step: 1, stepKey: "a", title: "Pedido", status: "completed" as const },
    { step: 2, stepKey: "b", title: "Análise" },
    { step: 3, stepKey: "c", title: "Decisão", disabled: true },
  ]

  it("derives aria-current from currentStep only and accepts node children", () => {
    const { container } = render(
      <IGRPStepperProcess currentStep={2} steps={steps}>
        <p>conteúdo fixo</p>
      </IGRPStepperProcess>
    )
    const current = container.querySelectorAll('[aria-current="step"]')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent("Análise")
    expect(screen.getByText("conteúdo fixo")).toBeInTheDocument()
  })

  it("maps status and disabled onto the step state", async () => {
    const onStepChange = vi.fn()
    const { container } = render(
      <IGRPStepperProcess currentStep={2} steps={steps} onStepChange={onStepChange}>
        {null}
      </IGRPStepperProcess>
    )
    const items = container.querySelectorAll('[data-slot="stepper-item"]')
    expect(items[0]).toHaveAttribute("data-state", "completed")
    await userEvent.click(screen.getByRole("button", { name: "Decisão" }))
    expect(onStepChange).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole("button", { name: /^Pedido/ }))
    expect(onStepChange).toHaveBeenCalledWith(1, steps[0])
  })
})
