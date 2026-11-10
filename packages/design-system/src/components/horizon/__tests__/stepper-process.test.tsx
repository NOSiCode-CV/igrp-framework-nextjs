import { describe, expect, it } from "vitest"
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
