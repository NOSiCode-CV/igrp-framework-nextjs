import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { DropdownMenu } from "radix-ui"
import userEvent from "@testing-library/user-event"

import { IGRPDataTableButtonAlert } from "../data-table/action-button-icon.js"
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

  it("describes the focused enabled control by the tooltip", async () => {
    render(
      <IGRPTooltip label="Editar">
        <button type="button">E</button>
      </IGRPTooltip>
    )
    await userEvent.tab()
    const button = screen.getByRole("button", { name: "E" })
    expect(button).toHaveFocus()
    const tooltip = await screen.findByRole("tooltip")
    expect(button.getAttribute("aria-describedby")).toBe(tooltip.id)
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

  it("opens on keyboard focus for a disabled alert row action", async () => {
    render(<IGRPDataTableButtonAlert labelTrigger="Eliminar" modalTitle="Eliminar?" disabled />)
    await userEvent.tab()
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Eliminar")
  })

  it("keeps the focusable wrapper under a DropdownMenu trigger, which passes disabled={false}", () => {
    render(
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <IGRPTooltip label="Sem permissão">
            <button type="button" disabled>
              E
            </button>
          </IGRPTooltip>
        </DropdownMenu.Trigger>
      </DropdownMenu.Root>
    )
    const wrapper = screen.getByRole("button", { name: "E" }).closest("[data-slot='tooltip-trigger-wrapper']")
    expect(wrapper).toHaveAttribute("tabindex", "0")
  })

  it("does not remount the child when forwarded props appear", () => {
    const { rerender } = render(
      <IGRPTooltip label="Editar">
        <button type="button">E</button>
      </IGRPTooltip>
    )
    const before = screen.getByRole("button", { name: "E" })
    rerender(
      <IGRPTooltip label="Editar" onClick={() => {}}>
        <button type="button">E</button>
      </IGRPTooltip>
    )
    expect(screen.getByRole("button", { name: "E" })).toBe(before)
  })
})
