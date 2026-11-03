import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTrigger } from "../stepper.js"

function renderStep(variant: "number" | "ring" | undefined, active = 2) {
  return render(
    <Stepper value={active}>
      {[1, 2].map((s) => (
        <StepperItem key={s} step={s}>
          <StepperTrigger>
            <StepperIndicator variant={variant} />
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
      ))}
    </Stepper>
  )
}
const indicators = (c: HTMLElement) => c.querySelectorAll('[data-slot="stepper-indicator"]')

describe("Stepper indicator and separator", () => {
  it("without a variant keeps today's indicator and shows the step number", () => {
    const { container } = renderStep(undefined)
    expect(indicators(container)[1]).not.toHaveAttribute("data-variant")
    expect(indicators(container)[1]!.className).toContain("size-6")
    expect(indicators(container)[1]).toHaveTextContent("2")
  })

  it("ring variant renders no step number", () => {
    const { container } = renderStep("ring")
    expect(indicators(container)[1]).toHaveAttribute("data-variant", "ring")
    expect(indicators(container)[1]).not.toHaveTextContent("2")
  })

  it("active indicator uses the step-active tokens, not text-muted-foreground", () => {
    const cls = indicators(renderStep("number").container)[1]!.className
    expect(cls).toContain("data-[state=active]:bg-step-active")
    expect(cls).toContain("data-[state=active]:text-step-active-foreground")
    expect(cls).not.toContain("data-[state=active]:text-muted-foreground")
  })

  it("completed indicator and separators use the step tokens", () => {
    const { container } = renderStep("number")
    expect(indicators(container)[0]!.className).toContain("data-[state=completed]:bg-step-complete")
    const sep = container.querySelector('[data-slot="stepper-separator"]')!.className
    expect(sep).toContain("group-data-[state=completed]/step:bg-step-complete")
    expect(sep).toContain("group-data-[state=active]/step:bg-step-active")
  })

  it.each([
    ["number", "left-[calc(50%+1rem)]", "right-[calc(-50%+1rem)]", "top-[0.9375rem]"],
    ["ring", "left-[calc(50%+0.625rem)]", "right-[calc(-50%+0.625rem)]", "top-[0.5625rem]"],
  ])("separator derives its %s offsets from the item's indicator", (variant, left, right, top) => {
    const sep = renderStep(variant as "number" | "ring").container.querySelector(
      '[data-slot="stepper-separator"]'
    )!.className
    for (const c of [left, right, top]) expect(sep).toContain(`group-has-[[data-variant=${variant}]]/step:${c}`)
  })
})
