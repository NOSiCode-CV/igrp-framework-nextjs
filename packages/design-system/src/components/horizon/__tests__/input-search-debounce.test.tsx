/**
 * The debouncer used to be built during render, so every render produced a fresh
 * closure with a fresh `timeout` binding — `clearTimeout` never had anything to
 * cancel and `onSearch` fired once per keystroke.
 */
import { describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPInputSearch } from "../input/search.js"

const wait = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

const searchBox = () => screen.getByRole("searchbox")

describe("IGRPInputSearch debounce", () => {
  it("collapses a burst of keystrokes into one onSearch call", async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<IGRPInputSearch id="q" onSearch={onSearch} isDebounce debounceMs={80} />)

    await user.type(searchBox(), "hello")
    await wait(400)

    expect(onSearch.mock.calls.map((call) => call[0])).toEqual(["hello"])
  }, 20000)

  it("fires again for a second burst", async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<IGRPInputSearch id="q" onSearch={onSearch} isDebounce debounceMs={60} />)

    await user.type(searchBox(), "ab")
    await wait(300)
    await user.type(searchBox(), "cd")
    await wait(300)

    expect(onSearch.mock.calls.map((call) => call[0])).toEqual(["ab", "abcd"])
  }, 20000)

  it("does not fire after unmount", async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    const { unmount } = render(<IGRPInputSearch id="q" onSearch={onSearch} isDebounce debounceMs={120} />)

    await user.type(searchBox(), "abc")
    unmount()
    await wait(400)

    expect(onSearch).not.toHaveBeenCalled()
  }, 20000)

  it("leaves onSearch alone when debounce is off", async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<IGRPInputSearch id="q" onSearch={onSearch} debounceMs={60} />)

    await user.type(searchBox(), "ab")
    await wait(200)

    expect(onSearch).not.toHaveBeenCalled()
  }, 20000)
})
