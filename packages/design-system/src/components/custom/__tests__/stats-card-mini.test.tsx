import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPStatsCardMini } from "../stats-card-mini.js"

describe("IGRPStatsCardMini", () => {
  it("renders title and value without a button role when not clickable", () => {
    render(<IGRPStatsCardMini title="Utilizadores" value={42} />)
    expect(screen.getByText("Utilizadores")).toBeInTheDocument()
    expect(screen.getByText("42")).toBeInTheDocument()
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("is a keyboard-operable button when onClick is given", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<IGRPStatsCardMini title="Utilizadores" value={42} onClick={onClick} />)

    const card = screen.getByRole("button", { name: /Utilizadores/ })
    await user.click(card)
    card.focus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    expect(onClick).toHaveBeenCalledTimes(3)
  })
})
