import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { IGRPButtonLink, IGRPLinkPendingIcon } from "../button-link.js"

const linkStatus = vi.hoisted(() => ({ pending: false }))
vi.mock("next/link", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/link")>()
  return { ...actual, useLinkStatus: () => linkStatus }
})
beforeEach(() => {
  linkStatus.pending = false
})

describe("IGRPLinkPendingIcon", () => {
  it("renders the icon when idle", async () => {
    const { container } = render(<IGRPLinkPendingIcon iconName="Eye" />)
    await waitFor(() => expect(container.querySelector("svg.lucide-eye")).not.toBeNull())
    expect(container.querySelector('[data-slot="spinner"]')).toBeNull()
  })

  it("replaces the icon with a spinner while pending", () => {
    linkStatus.pending = true
    const { container } = render(<IGRPLinkPendingIcon iconName="Eye" />)
    expect(container.querySelector('[data-slot="spinner"]')).toHaveAttribute("aria-hidden", "true")
    expect(container.querySelector("svg.lucide-eye")).toBeNull()
  })

  it("shows the spinner while pending even with no icon", () => {
    linkStatus.pending = true
    for (const iconName of ["", null, undefined]) {
      const { container, unmount } = render(<IGRPLinkPendingIcon iconName={iconName} />)
      expect(container.querySelector('[data-slot="spinner"]')).not.toBeNull()
      unmount()
    }
  })

  it("renders nothing with no icon when idle", () => {
    const { container } = render(<IGRPLinkPendingIcon iconName="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it("spinner keeps the icon's slot", () => {
    linkStatus.pending = true
    const { container } = render(<IGRPLinkPendingIcon iconName="Eye" iconPlacement="end" />)
    expect(container.querySelector('[data-slot="spinner"]')).toHaveAttribute("data-icon", "inline-end")
  })

  it.each([
    ["xs", "size-3"],
    ["icon-xs", "size-3"],
    ["sm", "size-3.5"],
  ])("spinner follows the button size (%s)", (size, cls) => {
    linkStatus.pending = true
    const { container } = render(<IGRPLinkPendingIcon iconName="Eye" size={size as never} />)
    expect(container.querySelector('[data-slot="spinner"]')).toHaveClass(cls)
  })

  it("never shows the spinner with showPendingIndicator={false}", async () => {
    linkStatus.pending = true
    const { container } = render(<IGRPLinkPendingIcon iconName="Eye" showPendingIndicator={false} />)
    await waitFor(() => expect(container.querySelector("svg.lucide-eye")).not.toBeNull())
    expect(container.querySelector('[data-slot="spinner"]')).toBeNull()
  })

  it("shows the spinner inside the link while pending, then restores the icon", async () => {
    linkStatus.pending = true
    const { rerender } = render(<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" />)
    const link = screen.getByRole("link", { name: "Abrir" })
    expect(link.querySelector('[data-slot="spinner"]')).not.toBeNull() // inside the <a>, i.e. inside Link
    linkStatus.pending = false
    rerender(<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" />)
    await waitFor(() => expect(link.querySelector("svg.lucide-eye")).not.toBeNull())
    expect(link.querySelector('[data-slot="spinner"]')).toBeNull()
  })

  it("never changes the icon with showPendingIndicator={false}", async () => {
    linkStatus.pending = true
    render(<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" showPendingIndicator={false} />)
    const link = screen.getByRole("link", { name: "Abrir" })
    await waitFor(() => expect(link.querySelector("svg.lucide-eye")).not.toBeNull())
    expect(link.querySelector('[data-slot="spinner"]')).toBeNull()
  })
})
