/**
 * `IGRPDatePickerInputSingle` must only produce a date when the text is in `dateFormat`.
 *
 * Typed input is rewritten into `dateFormat` by `maskDateInput` first, so the field coerces
 * rather than scolds; what the parser rejects is anything the mask cannot bring into shape —
 * a different separator order, a named month in the wrong case, a short year.
 */
import { describe, expect, it, vi } from "vitest"
import { act, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPDatePickerInputSingle } from "../date-picker/input-single"

const settle = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

async function type(dateFormat: string, keys: string, mode: "type" | "paste" = "type") {
  const onDateChange = vi.fn()
  const user = userEvent.setup()
  // Scope to this render's own container: several cases run inside one test, and querying
  // the document would keep hitting the first field mounted.
  const { container, unmount } = render(
    <IGRPDatePickerInputSingle name="d" dateFormat={dateFormat} onDateChange={onDateChange} />
  )
  const input = container.querySelector("input") as HTMLInputElement

  if (mode === "paste") {
    await user.click(input)
    await user.paste(keys)
  } else {
    await user.type(input, keys)
  }
  await settle()

  const last = onDateChange.mock.calls.at(-1)?.[0]
  const result = {
    display: input.value,
    committed: last instanceof Date ? last.toISOString().slice(0, 10) : undefined,
  }
  unmount()
  return result
}

describe("IGRPDatePickerInputSingle honours dateFormat", () => {
  it("masks typed digits into the configured format", async () => {
    expect(await type("dd-MM-yyyy", "26082026")).toEqual({ display: "26-08-2026", committed: "2026-08-26" })
    expect(await type("dd/MM/yyyy", "26082026")).toEqual({ display: "26/08/2026", committed: "2026-08-26" })
    expect(await type("yyyy-MM-dd", "20260826")).toEqual({ display: "2026-08-26", committed: "2026-08-26" })
  })

  it("pads a short day or month into the format rather than accepting it as typed", async () => {
    expect(await type("dd-MM-yyyy", "1-8-2026")).toEqual({ display: "01-08-2026", committed: "2026-08-01" })
  })

  it("refuses text that is in a different format", async () => {
    // Day-first text in a year-first field: the mask cannot rescue it and the parser must
    // not read `20` as the year.
    expect(await type("dd-MM-yyyy", "2026-08-26", "paste")).toMatchObject({ committed: undefined })
    expect(await type("yyyy-MM-dd", "26-08-2026", "paste")).toMatchObject({ committed: undefined })
  })

  it("refuses a half-typed year instead of inventing one", async () => {
    // `26-08-20` used to be padded to `0026-08-20` by the mask and accepted as the year 26.
    expect(await type("yyyy-MM-dd", "26-08-20", "paste")).toMatchObject({ committed: undefined })
  })

  it("applies the rule to named-month formats, where there is no mask to help", async () => {
    expect(await type("dd MMM yyyy", "26 Aug 2026", "paste")).toMatchObject({ committed: "2026-08-26" })
    expect(await type("dd MMM yyyy", "26 aug 2026", "paste")).toMatchObject({ committed: undefined })
    expect(await type("dd MMM yyyy", "26-08-2026", "paste")).toMatchObject({ committed: undefined })
  })
})
