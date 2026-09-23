import { act, render, waitFor } from "@testing-library/react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { IGRPIcon } from "../index.js"

/**
 * IGRPIcon loads icons one at a time instead of bundling lucide's whole catalogue
 * (~146 KB gzipped on every page). These pin the behaviour that swap must keep:
 * the same rendered SVG and classes, both name spellings, synchronous renders
 * once loaded, and an immediate glyph for an unknown name.
 */
describe("IGRPIcon", () => {
  it("loads a PascalCase icon and renders it with lucide's classes", async () => {
    const { container } = render(<IGRPIcon iconName="LayoutDashboard" className="size-4" />)

    await waitFor(() => expect(container.querySelector("svg.lucide")).not.toBeNull())
    const svg = container.querySelector("svg")!
    expect(svg.getAttribute("class")).toBe("lucide lucide-layout-dashboard size-4")
    expect(svg.getAttribute("aria-hidden")).toBe("true")
    expect(svg.getAttribute("width")).toBe("16")
    expect(svg.children.length).toBeGreaterThan(0)
  })

  it("accepts kebab-case and digit-bearing names (Clock1 → clock-1)", async () => {
    const { container } = render(
      <>
        <IGRPIcon iconName="clock-1" />
        <IGRPIcon iconName="Clock1" />
      </>
    )

    await waitFor(() => expect(container.querySelectorAll("svg.lucide")).toHaveLength(2))
    for (const svg of container.querySelectorAll("svg")) {
      expect(svg.getAttribute("class")).toBe("lucide lucide-clock1 lucide-clock-1")
    }
  })

  it("renders an icon synchronously once it has loaded in this session", async () => {
    const first = render(<IGRPIcon iconName="ChartColumn" />)
    await waitFor(() => expect(first.container.querySelector("svg.lucide")).not.toBeNull())
    first.unmount()

    const second = render(<IGRPIcon iconName="ChartColumn" />)
    // No waitFor: a cached icon must not blink through the placeholder on remount
    // (the defect lucide's own DynamicIcon has on every client navigation).
    expect(second.container.querySelector("svg.lucide-chart-column")).not.toBeNull()
  })

  it("server-renders a same-sized placeholder for a valid icon, so hydration matches", () => {
    const html = renderToString(<IGRPIcon iconName="Truck" size={20} className="text-primary" />)
    expect(html).toContain('data-igrp-icon-loading="truck"')
    expect(html).toContain('width="20"')
    expect(html).toContain('class="text-primary"')
  })

  it("hydrates without a mismatch even when the icon loaded before hydration", async () => {
    // Warm the cache the way the sidebar does before a Suspense-streamed header
    // hydrates. Reading the cache directly during hydration rendered the real
    // icon where the server sent a placeholder — React #418 in production.
    const warm = render(<IGRPIcon iconName="Package" />)
    await waitFor(() => expect(warm.container.querySelector("svg.lucide")).not.toBeNull())
    warm.unmount()

    const container = document.createElement("div")
    container.innerHTML = renderToString(<IGRPIcon iconName="Package" id="pkg" />)
    expect(container.querySelector("[data-igrp-icon-loading]")).not.toBeNull()
    document.body.appendChild(container)

    const recoverableErrors: unknown[] = []
    await act(async () => {
      hydrateRoot(container, <IGRPIcon iconName="Package" id="pkg" />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      })
    })

    expect(recoverableErrors).toEqual([])
    await waitFor(() => expect(container.querySelector("svg.lucide-package")).not.toBeNull())
    container.remove()
  })

  it("renders the destructive fallback immediately for an unknown name", () => {
    const { container } = render(<IGRPIcon iconName="DefinitelyNotAnIcon" className="size-4" />)

    const svg = container.querySelector("svg")!
    expect(svg.getAttribute("data-igrp-unknown-icon")).toBe("DefinitelyNotAnIcon")
    expect(svg.getAttribute("class")).toContain("text-destructive")
  })
})
