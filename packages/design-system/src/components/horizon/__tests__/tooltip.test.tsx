import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPTooltip, IGRPTooltipProvider } from "../tooltip.js"

const providerSpy = vi.hoisted(() => vi.fn())

vi.mock("../../primitives/tooltip.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../primitives/tooltip.js")>()
  return {
    ...actual,
    TooltipProvider: (props: React.ComponentProps<typeof actual.TooltipProvider>) => {
      providerSpy()
      return actual.TooltipProvider(props)
    },
  }
})

describe("IGRPTooltip", () => {
  beforeEach(() => providerSpy.mockClear())

  it("opens on hover over an enabled trigger", async () => {
    render(
      <IGRPTooltip label="Editar">
        <button type="button">E</button>
      </IGRPTooltip>
    )
    await userEvent.hover(screen.getByRole("button", { name: "E" }))
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Editar")
  })

  it("opens over a disabled trigger on hover and on keyboard focus", async () => {
    render(
      <IGRPTooltip label="Sem permissão">
        <button type="button" disabled>
          E
        </button>
      </IGRPTooltip>
    )
    await userEvent.tab() // focus lands on the wrapper because the button cannot take focus
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Sem permissão")
  })

  it("renders the child unchanged without a label", () => {
    const { container } = render(
      <IGRPTooltip>
        <button type="button">E</button>
      </IGRPTooltip>
    )
    expect(container.firstElementChild?.tagName).toBe("BUTTON")
  })

  it("does not mount a second provider inside IGRPTooltipProvider", () => {
    render(
      <IGRPTooltipProvider>
        <IGRPTooltip label="a">
          <button type="button" />
        </IGRPTooltip>
      </IGRPTooltipProvider>
    )
    expect(providerSpy).toHaveBeenCalledTimes(1)
  })
})
