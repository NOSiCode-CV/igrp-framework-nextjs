import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { IGRPButtonLink } from "../button-link.js"
import { IGRPTooltipProvider } from "../tooltip.js"

const providerSpy = vi.hoisted(() => vi.fn())
vi.mock("../../primitives/tooltip.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../primitives/tooltip.js")>()
  return {
    ...actual,
    TooltipProvider: (p: React.ComponentProps<typeof actual.TooltipProvider>) => {
      providerSpy()
      return <actual.TooltipProvider {...p} />
    },
  }
})

beforeEach(() => providerSpy.mockClear())

describe("IGRPButtonLink tooltip", () => {
  it.each(["icon", "icon-xs", "icon-sm", "icon-lg"])(
    "size=%s: no visible text, tooltip and accessible name from label",
    async (size) => {
      render(<IGRPButtonLink href="/x" label="Editar" iconName="Pencil" size={size as never} />)
      const link = screen.getByRole("link", { name: "Editar" })
      expect(link).not.toHaveTextContent("Editar")
      await userEvent.hover(link)
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Editar")
    }
  )

  it("a disabled icon-only link opens its tooltip on hover and on focus", async () => {
    const { unmount } = render(<IGRPButtonLink href="/x" label="Editar" iconName="Pencil" size="icon" disabled />)
    await userEvent.hover(screen.getByRole("button", { name: "Editar" }))
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Editar")
    unmount()
    render(<IGRPButtonLink href="/x" label="Editar" iconName="Pencil" size="icon" disabled />)
    await userEvent.tab()
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Editar")
  })

  it("does not mount a second provider inside IGRPTooltipProvider", () => {
    render(
      <IGRPTooltipProvider>
        <IGRPButtonLink href="/x" label="Editar" size="icon" />
      </IGRPTooltipProvider>
    )
    expect(providerSpy).toHaveBeenCalledTimes(1)
  })

  it("non-icon size: label in the button, tooltip shows the tooltip text", async () => {
    render(<IGRPButtonLink href="/x" label="Abrir" tooltip="Abre o processo" />)
    const link = screen.getByRole("link", { name: "Abrir" })
    expect(link).toHaveTextContent("Abrir")
    await userEvent.hover(link)
    const tip = await screen.findByRole("tooltip")
    expect(tip).toHaveTextContent("Abre o processo")
    expect(tip).not.toHaveTextContent("Abrir")
  })

  it("no tooltip, no wrapper", () => {
    const { container } = render(<IGRPButtonLink href="/x" label="Abrir" />)
    expect(container.firstElementChild?.tagName).toBe("A")
  })

  it("tooltip alone names an icon-only link", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<IGRPButtonLink href="/x" tooltip="Editar" size="icon" iconName="Pencil" />)
    expect(screen.getByRole("link", { name: "Editar" })).toBeInTheDocument()
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it("warns in development when icon-only has neither label nor tooltip", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<IGRPButtonLink href="/x" size="icon" iconName="Pencil" />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("IGRPButtonLink: icon-only link"))
    warn.mockRestore()
  })
})
