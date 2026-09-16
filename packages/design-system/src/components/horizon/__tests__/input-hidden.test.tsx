/**
 * A hidden input must contribute nothing to layout.
 *
 * In form mode this component went through `IGRPFormField`, which is a *layout*
 * wrapper: it emits an outer div, a `FormItem` div (`flex flex-col gap-2`) and an
 * inner flex div around the control. The input itself is `display:none`, but the
 * wrappers are not — inside a form using `gap-*`, every hidden field consumed a
 * gap and left a visible blank band.
 */
import { useRef } from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../form"
import { IGRPInputHidden } from "../input/hidden"

const schema = z.object({ token: z.string().optional() })

function FormHarness() {
  const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null)
  return (
    <IGRPForm schema={schema} formRef={formRef} onSubmit={() => {}} defaultValues={{ token: "abc" }}>
      <div data-testid="slot">
        <IGRPInputHidden name="token" />
      </div>
    </IGRPForm>
  )
}

describe("IGRPInputHidden renders no layout", () => {
  it("emits only the input when standalone", () => {
    const { container } = render(
      <div data-testid="slot">
        <IGRPInputHidden name="token" />
      </div>
    )

    const slot = container.querySelector('[data-testid="slot"]') as HTMLElement
    expect(slot.children).toHaveLength(1)
    expect(slot.children[0]?.tagName).toBe("INPUT")
    expect(slot.querySelectorAll("div, p, span, label")).toHaveLength(0)
  })

  it("emits only the input inside a form", () => {
    render(<FormHarness />)

    const slot = screen.getByTestId("slot")
    expect(slot.querySelectorAll("div, p, span, label")).toHaveLength(0)
    expect(slot.children).toHaveLength(1)
    expect(slot.children[0]?.tagName).toBe("INPUT")
  })

  it("still carries the form value", () => {
    render(<FormHarness />)

    const input = screen.getByTestId("slot").querySelector("input") as HTMLInputElement
    expect(input.type).toBe("hidden")
    expect(input.name).toBe("token")
    expect(input.value).toBe("abc")
  })

  it("carries no presentational classes", () => {
    const { container } = render(<IGRPInputHidden name="token" />)

    const input = container.querySelector("input") as HTMLInputElement
    expect(input.getAttribute("class")).toBeNull()
    expect(input.getAttribute("data-slot")).toBe("input")
  })

  it("does not emit `required`, which is not valid on a hidden input", () => {
    const { container } = render(<IGRPInputHidden name="token" required />)

    const input = container.querySelector("input") as HTMLInputElement
    expect(input.hasAttribute("required")).toBe(false)
  })
})
