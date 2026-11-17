/**
 * The debouncer used to be built during render, so every render produced a fresh
 * closure with a fresh `timeout` binding — `clearTimeout` never had anything to
 * cancel and `onSearch` fired once per keystroke.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

import { IGRPInputSearch } from "../input/search.js"

// Fake timers + synchronous keystrokes: with real timers and user-event, a busy
// machine spaced keystrokes past the debounce window and the test flaked.
const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

const searchBox = () => screen.getByRole("searchbox")

/** Types `text` one character at a time, with no time passing between keystrokes. */
const type = (text: string) => {
  const box = searchBox() as HTMLInputElement
  for (const ch of text) fireEvent.change(box, { target: { value: box.value + ch } })
}

describe("IGRPInputSearch debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("collapses a burst of keystrokes into one onSearch call", () => {
    const onSearch = vi.fn()
    render(<IGRPInputSearch id="q" onSearch={onSearch} isDebounce debounceMs={80} />)

    type("hello")
    wait(400)

    expect(onSearch.mock.calls.map((call) => call[0])).toEqual(["hello"])
  })

  it("fires again for a second burst", () => {
    const onSearch = vi.fn()
    render(<IGRPInputSearch id="q" onSearch={onSearch} isDebounce debounceMs={60} />)

    type("ab")
    wait(300)
    type("cd")
    wait(300)

    expect(onSearch.mock.calls.map((call) => call[0])).toEqual(["ab", "abcd"])
  })

  it("does not fire after unmount", () => {
    const onSearch = vi.fn()
    const { unmount } = render(<IGRPInputSearch id="q" onSearch={onSearch} isDebounce debounceMs={120} />)

    type("abc")
    unmount()
    wait(400)

    expect(onSearch).not.toHaveBeenCalled()
  })

  it("leaves onSearch alone when debounce is off", () => {
    const onSearch = vi.fn()
    render(<IGRPInputSearch id="q" onSearch={onSearch} debounceMs={60} />)

    type("ab")
    wait(200)

    expect(onSearch).not.toHaveBeenCalled()
  })
})
