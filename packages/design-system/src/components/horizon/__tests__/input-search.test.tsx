import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPInputSearch } from "../input/search"

describe("IGRPInputSearch", () => {
  it("calls onSearch with the current value when the submit button is clicked", async () => {
    const onSearch = vi.fn()
    render(
      <IGRPInputSearch
        name="q"
        label="Search"
        defaultValue="initial"
        onSearch={onSearch}
        submitButtonLabel="Submit"
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Submit" }))
    expect(onSearch).toHaveBeenCalledWith("initial")
  })

  it("calls onSearch on Enter key without debounce when isDebounce=false", async () => {
    const onSearch = vi.fn()
    render(<IGRPInputSearch name="q" label="Search" onSearch={onSearch} submitButtonLabel="Go" />)

    const input = screen.getByLabelText("Search") as HTMLInputElement
    await userEvent.type(input, "hello{enter}")
    expect(onSearch).toHaveBeenCalledWith("hello")
  })

  it("associates the label with the search input", () => {
    render(<IGRPInputSearch name="q" label="Search" />)
    const input = screen.getByLabelText("Search") as HTMLInputElement
    expect(input.type).toBe("search")
    expect(input.name).toBe("q")
  })

  it("renders the error message and marks input invalid", () => {
    render(<IGRPInputSearch name="q" label="Search" error="Too short" />)
    const input = screen.getByLabelText("Search")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByText("Too short")).toBeInTheDocument()
  })
})
