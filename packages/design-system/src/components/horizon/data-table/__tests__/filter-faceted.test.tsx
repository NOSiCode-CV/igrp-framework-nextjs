import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { IGRPDataTableFilterFaceted } from "../filter.js"

const options = Array.from({ length: 40 }, (_, i) => ({ value: `v${i}`, label: `Opção ${i}` }))

describe("IGRPDataTableFilterFaceted", () => {
  // CommandList carries max-h-72 + overflow-y-auto; without it a long list grows past the screen.
  it("renders its options inside the scrollable CommandList", async () => {
    render(<IGRPDataTableFilterFaceted placeholder="Estado" options={options} showFilter />)
    await userEvent.click(screen.getByRole("button", { name: "Estado" }))
    for (const label of ["Opção 0", "Opção 39"]) {
      expect(screen.getByText(label).closest('[data-slot="command-list"]')).not.toBeNull()
    }
  })
})
