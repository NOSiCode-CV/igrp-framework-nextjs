import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPTabs, type IGRPTabItem } from "../tabs.js"

const items: IGRPTabItem[] = [
  { value: "a", label: "Alpha", content: <p>alpha panel</p> },
  { value: "b", label: "Beta", content: <p>beta panel</p> },
  { value: "c", label: "Gamma", content: <p>gamma panel</p> },
]

describe("IGRPTabs", () => {
  it("selects the first tab by default and switches on click", async () => {
    const onValueChange = vi.fn()
    render(<IGRPTabs items={items} onValueChange={onValueChange} />)

    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("alpha panel")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("tab", { name: "Beta" }))
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("beta panel")).toBeInTheDocument()
    expect(onValueChange).toHaveBeenCalledWith("b")
  })

  it("skips a disabled first tab when choosing the default", () => {
    render(<IGRPTabs items={[{ ...items[0], disabled: true }, items[1], items[2]]} />)

    expect(screen.getByRole("tab", { name: "Beta" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("beta panel")).toBeInTheDocument()
  })

  it("falls back to the first enabled tab when the active tab is removed from items", () => {
    const { rerender } = render(<IGRPTabs items={items} defaultValue="c" />)
    expect(screen.getByRole("tab", { name: "Gamma" })).toHaveAttribute("aria-selected", "true")

    rerender(<IGRPTabs items={items.slice(0, 2)} defaultValue="c" />)
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true")
  })

  it("selects a default that arrives after the first render", () => {
    const { rerender } = render(<IGRPTabs items={[]} />)
    rerender(<IGRPTabs items={items} />)

    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true")
  })

  it("follows a controlled value and does not switch on its own", async () => {
    const onValueChange = vi.fn()
    render(<IGRPTabs items={items} value="b" onValueChange={onValueChange} />)

    await userEvent.click(screen.getByRole("tab", { name: "Gamma" }))
    expect(onValueChange).toHaveBeenCalledWith("c")
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveAttribute("aria-selected", "true")
  })

  it("applies the per-item className to the trigger", () => {
    render(<IGRPTabs items={[{ ...items[0], className: "custom-trigger" }, items[1]]} />)

    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveClass("custom-trigger")
    expect(screen.getByRole("tab", { name: "Beta" })).not.toHaveClass("custom-trigger")
  })

  it("names an icon-only tab through ariaLabel", () => {
    render(<IGRPTabs items={[{ ...items[0], label: "", ariaLabel: "Settings", icon: "Settings" }]} showIcon />)

    expect(screen.getByRole("tab", { name: "Settings" })).toBeInTheDocument()
  })

  it("keeps a keepMounted panel in the DOM, hidden by CSS, while inactive", async () => {
    render(<IGRPTabs items={[items[0], { ...items[1], keepMounted: true }]} />)

    // Radix does not set `hidden` on a force-mounted panel; the state-scoped class hides it.
    const panel = screen.getByText("beta panel").closest("[role=tabpanel]")
    expect(panel).toHaveAttribute("data-state", "inactive")
    expect(panel).toHaveClass("data-[state=inactive]:hidden")

    await userEvent.click(screen.getByRole("tab", { name: "Beta" }))
    expect(panel).toHaveAttribute("data-state", "active")
    // Unmounted panels stay unmounted.
    expect(screen.queryByText("alpha panel")).not.toBeInTheDocument()
  })

  it("prefers id over name for the root id, and uses name when there is no id", () => {
    const { container, rerender } = render(<IGRPTabs items={items} id="by-id" name="by-name" />)
    expect(container.firstElementChild).toHaveAttribute("id", "by-id")

    rerender(<IGRPTabs items={items} name="by-name" />)
    expect(container.firstElementChild).toHaveAttribute("id", "by-name")
  })

  it("renders nothing without items", () => {
    const { container } = render(<IGRPTabs items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("does not force smooth scrolling through CSS, which would override reduced motion", () => {
    render(<IGRPTabs items={items} />)

    const scroller = screen.getByRole("tablist").parentElement
    expect(scroller?.className).not.toMatch(/(^|\s)scroll-smooth(\s|$)/)
  })

  it("renders the active-surface overrides that pills needs in both themes", () => {
    render(<IGRPTabs items={items} variant="pills" />)

    const trigger = screen.getByRole("tab", { name: "Alpha" })
    expect(trigger).toHaveClass("data-active:text-primary-foreground!")
    expect(trigger.className).not.toContain("data-active:text-muted-foreground")
  })

  it("renders underline on the primitive's line variant", () => {
    render(<IGRPTabs items={items} variant="underline" />)

    expect(screen.getByRole("tablist")).toHaveAttribute("data-variant", "line")
  })

  it("lets the list grow past its container so the tabs scroll", () => {
    const { rerender } = render(<IGRPTabs items={items} />)
    expect(screen.getByRole("tablist")).toHaveClass("w-max")
    expect(screen.getByRole("tablist")).not.toHaveClass("w-fit")

    rerender(<IGRPTabs items={items} fullWidth />)
    expect(screen.getByRole("tablist")).toHaveClass("w-full", "min-w-max")
  })

  it("tells Radix about a vertical orientation, so aria-orientation and arrow keys follow it", async () => {
    render(<IGRPTabs items={items} orientation="vertical" />)

    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical")

    screen.getByRole("tab", { name: "Alpha" }).focus()
    await userEvent.keyboard("{ArrowDown}")
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveFocus()
  })
})
