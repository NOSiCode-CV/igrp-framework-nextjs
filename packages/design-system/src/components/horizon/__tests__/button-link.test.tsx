import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { IGRPButtonLink, IGRPLinkPendingIcon } from "../button-link.js"

describe("IGRPButtonLink", () => {
  it("renders an <a> carrying the button classes", async () => {
    render(<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" />)
    const link = screen.getByRole("link", { name: "Abrir" })
    expect(link).toHaveAttribute("href", "/x")
    expect(link).toHaveAttribute("data-slot", "button")
    expect(link).toHaveClass("bg-primary") // variant default
    await waitFor(() => expect(link.querySelector("svg.lucide-eye")).not.toBeNull())
  })

  it("renders a disabled <button> and no <a> when disabled", async () => {
    const onClick = vi.fn()
    render(<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" disabled onClick={onClick} />)
    expect(screen.queryByRole("link")).toBeNull()
    const button = screen.getByRole("button", { name: "Abrir" })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("type", "button")
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("drops link props when disabled", () => {
    render(<IGRPButtonLink href="/x" label="Abrir" disabled target="_blank" prefetch={false} replace />)
    const button = screen.getByRole("button", { name: "Abrir" })
    expect(button).not.toHaveAttribute("target")
    expect(button).not.toHaveAttribute("href")
  })

  it("does not throw outside a Next.js app router", () => {
    // jsdom render with no router context is the "outside the app router" case
    expect(() => render(<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" />)).not.toThrow()
    expect(() => render(<IGRPLinkPendingIcon iconName="Eye" />)).not.toThrow() // outside a Link: idle
  })

  it("passes variant, size and className to the anchor", () => {
    render(<IGRPButtonLink href="/x" label="Abrir" variant="outline" size="sm" className="w-full" />)
    const link = screen.getByRole("link", { name: "Abrir" })
    expect(link).toHaveAttribute("data-variant", "outline")
    expect(link).toHaveAttribute("data-size", "sm")
    expect(link).toHaveClass("w-full")
  })
})
