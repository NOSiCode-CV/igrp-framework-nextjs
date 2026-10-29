import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { IGRPHeadline } from "./headline.js"

describe("IGRPHeadline", () => {
  it("accepts deprecated color props without leaking them to the DOM or warning", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      const { container } = render(<IGRPHeadline title="Education area" roleColor="solid" color="success" />)

      expect(container.querySelector("[rolecolor], [color]")).toBeNull()
      expect(consoleError).not.toHaveBeenCalled()
    } finally {
      consoleError.mockRestore()
    }
  })

  it("styles the wrapper and content with classes while forwarding native attributes", () => {
    render(
      <IGRPHeadline
        id="education-headline"
        title="Education area"
        description="Manage education areas"
        variant="h2"
        className="text-success"
        headlineContentClassName="gap-2 text-info"
        aria-label="Education area heading"
        data-testid="headline"
        showIcon
        iconName="Info"
      />
    )

    const wrapper = screen.getByTestId("headline")
    const heading = screen.getByRole("heading", { level: 2, name: "Education area" })
    expect(wrapper).toHaveAttribute("id", "education-headline")
    expect(wrapper).toHaveAttribute("aria-label", "Education area heading")
    expect(wrapper).toHaveClass("text-success")
    expect(wrapper).not.toHaveClass("text-primary")
    expect(heading.parentElement).toHaveClass("gap-2", "text-info")
    expect(screen.getByText("Manage education areas")).toBeInTheDocument()
    expect(wrapper.querySelector("svg")).toBeInTheDocument()
  })
})
