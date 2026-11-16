import { render, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// lucide-react 1.x icon modules export `__iconData` ({ node }) instead of 0.x's `__iconNode`.
vi.mock("lucide-react/dynamicIconImports", () => ({
  default: {
    house: async () => ({
      __iconData: { name: "house", node: [["path", { d: "M3 10h18", key: "a" }]] },
      default: { displayName: "House" },
    }),
  },
}))

const { IGRPIcon } = await import("../index.js")

describe("IGRPIcon with lucide-react 1.x icon modules", () => {
  it("renders the icon's node from __iconData", async () => {
    const { container } = render(<IGRPIcon iconName="House" />)
    await waitFor(() => expect(container.querySelector("svg.lucide path")).not.toBeNull())
    expect(container.querySelector("path")?.getAttribute("d")).toBe("M3 10h18")
    expect(container.querySelector("svg")?.getAttribute("class")).toContain("lucide-house")
  })
})
