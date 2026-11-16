import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { IGRPButton } from "../button.js"

describe("IGRPButton loading", () => {
  it("keeps focus and ignores clicks", async () => {
    const onClick = vi.fn()
    const { rerender } = render(<IGRPButton onClick={onClick}>Guardar</IGRPButton>)
    const button = screen.getByRole("button")
    button.focus()
    rerender(
      <IGRPButton onClick={onClick} loading>
        Guardar
      </IGRPButton>
    )
    expect(button).toHaveFocus()
    expect(button).not.toBeDisabled()
    expect(button).toHaveAttribute("aria-disabled", "true")
    await userEvent.click(button)
    await userEvent.keyboard("{Enter}")
    expect(onClick).not.toHaveBeenCalled()
  })

  it("does not submit its form, by click or by Enter in a field", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <input aria-label="nome" />
        <IGRPButton type="submit" loading>
          Guardar
        </IGRPButton>
      </form>
    )
    await userEvent.click(screen.getByRole("button"))
    await userEvent.type(screen.getByLabelText("nome"), "a{Enter}")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("native disabled still wins", () => {
    render(
      <IGRPButton disabled loading>
        Guardar
      </IGRPButton>
    )
    expect(screen.getByRole("button")).toBeDisabled()
  })
})
