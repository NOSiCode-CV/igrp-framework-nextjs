import { describe, it, expect } from "vitest"
import { IGRPDataTableDateRangeFilterFn } from "../filters-utils"

const row = (v: unknown) => ({ getValue: () => v }) as never

describe("IGRPDataTableDateRangeFilterFn", () => {
  it("includes an in-range ISO date", () => {
    expect(IGRPDataTableDateRangeFilterFn(row("2026-06-15"), "d", { from: "2026-06-01", to: "2026-06-30" })).toBe(true)
  })
  it("excludes an unparseable cell date without crashing (no silent total vanish)", () => {
    expect(IGRPDataTableDateRangeFilterFn(row("31/12/2026"), "d", { from: "2026-06-01", to: "2026-06-30" })).toBe(false)
  })
  it("does not filter when the filter bound is unparseable", () => {
    expect(IGRPDataTableDateRangeFilterFn(row("2026-06-15"), "d", { from: "not-a-date" })).toBe(true)
  })
})
