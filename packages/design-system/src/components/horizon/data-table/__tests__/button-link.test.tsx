import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IGRPDataTableButtonLink } from "../action-button-icon.js"

describe("IGRPDataTableButtonLink", () => {
  it("renders a link when enabled", () => {
    render(<IGRPDataTableButtonLink href="/x" labelTrigger="Ver" />)
    expect(screen.getByRole("link", { name: "Ver" })).toHaveAttribute("href", "/x")
  })

  it("renders a disabled button and no link when disabled with href", async () => {
    const action = vi.fn()
    render(<IGRPDataTableButtonLink href="/x" labelTrigger="Ver" action={action} disabled />)
    expect(screen.queryByRole("link")).toBeNull()
    const button = screen.getByRole("button", { name: "Ver" })
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(action).not.toHaveBeenCalled()
  })
})
