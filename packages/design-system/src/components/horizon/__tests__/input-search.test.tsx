import { describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPInputSearch } from "../input/search.js"

describe("IGRPInputSearch", () => {
  it("calls onSearch with the current value when the submit button is clicked", async () => {
    const onSearch = vi.fn()
    render(
      <IGRPInputSearch name="q" label="Search" defaultValue="initial" onSearch={onSearch} submitButtonLabel="Submit" />
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

describe("IGRPInputSearch slots and debounce", () => {
  it("renders startAdornment and submit nodes in place of the defaults", () => {
    render(
      <IGRPInputSearch
        name="q"
        label="Search"
        submitButtonLabel="Go"
        startAdornment={<span>NIF</span>}
        submit={<button type="button">Procurar</button>}
      />
    )
    expect(screen.getByText("NIF")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Procurar" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Go" })).not.toBeInTheDocument()
  })

  it("removes both adornments with false", () => {
    const { container } = render(<IGRPInputSearch name="q" label="Search" startAdornment={false} submit={false} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(container.querySelector("svg")).toBeNull()
  })

  it("debounces onSearch with debounce={ms}", () => {
    // Synchronous keystrokes on fake timers: no real time can leak between them.
    vi.useFakeTimers()
    try {
      const onSearch = vi.fn()
      render(<IGRPInputSearch name="q" label="Search" onSearch={onSearch} debounce={300} submit={false} />)
      const input = screen.getByLabelText("Search")
      for (const value of ["a", "ab", "abc"]) fireEvent.change(input, { target: { value } })
      expect(onSearch).not.toHaveBeenCalled()
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(onSearch).toHaveBeenCalledOnce()
      expect(onSearch).toHaveBeenCalledWith("abc")
    } finally {
      vi.useRealTimers()
    }
  })

  it("standalone runs the caller's onChange and onKeyDown after its own", async () => {
    const onChange = vi.fn()
    const onKeyDown = vi.fn()
    const onSearch = vi.fn()
    render(<IGRPInputSearch name="q" label="Search" onChange={onChange} onKeyDown={onKeyDown} onSearch={onSearch} />)

    const input = screen.getByLabelText("Search")
    await userEvent.type(input, "ab{enter}")

    expect(input).toHaveValue("ab")
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onKeyDown).toHaveBeenCalledTimes(3)
    expect(onSearch).toHaveBeenCalledWith("ab")
  })
})
