// UTC-N on purpose: a date-only cell read as UTC midnight only drops out of range west of Greenwich.
process.env.TZ = "Atlantic/Cape_Verde" // UTC-1

import { describe, it, expect } from "vitest"
import { IGRPDataTableDateRangeFilterFn } from "../filters-utils.js"

const row = (v: unknown) => ({ getValue: () => v }) as never
const noMeta = () => {}

describe("IGRPDataTableDateRangeFilterFn", () => {
  it("includes an in-range ISO date", () => {
    expect(
      IGRPDataTableDateRangeFilterFn(row("2026-06-15"), "d", { from: "2026-06-01", to: "2026-06-30" }, noMeta)
    ).toBe(true)
  })
  it("excludes an unparseable cell date without crashing (no silent total vanish)", () => {
    expect(
      IGRPDataTableDateRangeFilterFn(row("31/12/2026"), "d", { from: "2026-06-01", to: "2026-06-30" }, noMeta)
    ).toBe(false)
  })
  it("does not filter when the filter bound is unparseable", () => {
    expect(IGRPDataTableDateRangeFilterFn(row("2026-06-15"), "d", { from: "not-a-date" }, noMeta)).toBe(true)
  })
})

describe("IGRPDataTableDateRangeFilterFn outside UTC", () => {
  it("runs west of Greenwich", () => {
    expect(new Date("2026-08-26").getDate()).toBe(25)
  })
  it("includes a date-only cell on the first and last day", () => {
    const filter = { from: "2026-08-26", to: "2026-08-31" }
    expect(IGRPDataTableDateRangeFilterFn(row("2026-08-26"), "d", filter, noMeta)).toBe(true)
    expect(IGRPDataTableDateRangeFilterFn(row("2026-08-31"), "d", filter, noMeta)).toBe(true)
    expect(IGRPDataTableDateRangeFilterFn(row("2026-09-01"), "d", filter, noMeta)).toBe(false)
  })
  it("includes a datetime cell anywhere on the last day (Date bounds from the picker)", () => {
    const filter = { from: new Date(2026, 7, 26), to: new Date(2026, 7, 31) }
    expect(IGRPDataTableDateRangeFilterFn(row("2026-08-31T18:30:00"), "d", filter, noMeta)).toBe(true)
    expect(IGRPDataTableDateRangeFilterFn(row(new Date(2026, 8, 1)), "d", filter, noMeta)).toBe(false)
  })
})
