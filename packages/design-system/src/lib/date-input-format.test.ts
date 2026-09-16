import { describe, expect, it } from "vitest"

import { getDateFormatMaxLength, getDateFormatParts, maskDateInput, parseDateInput } from "./date-input-format"

const FMT = "dd-MM-yyyy"

describe("getDateFormatParts", () => {
  it("accepts numeric formats and rejects textual ones", () => {
    expect(getDateFormatParts(FMT)).toBeDefined()
    expect(getDateFormatParts("yyyy/MM/dd")).toBeDefined()
    expect(getDateFormatParts("dd MMM yyyy")).toBeUndefined()
    expect(getDateFormatParts("P")).toBeUndefined()
  })
})

describe("maskDateInput", () => {
  it("inserts separators as digits are typed", () => {
    expect(maskDateInput("2", FMT)).toBe("2")
    expect(maskDateInput("26", FMT)).toBe("26")
    expect(maskDateInput("260", FMT)).toBe("26-0")
    expect(maskDateInput("26082026", FMT)).toBe("26-08-2026")
  })

  it("zero-pads a token closed early by a typed separator", () => {
    expect(maskDateInput("1-8-2026", FMT)).toBe("01-08-2026")
    expect(maskDateInput("1/8/2026", FMT)).toBe("01-08-2026")
  })

  it("is idempotent, so re-masking its own output is stable", () => {
    expect(maskDateInput(maskDateInput("26082026", FMT), FMT)).toBe("26-08-2026")
  })

  it("never appends a trailing separator, so backspace makes progress", () => {
    // The reverse of typing: each step must be strictly shorter than the last.
    let value = "26-08-2026"
    const seen: string[] = []
    for (let i = 0; i < 4; i++) {
      value = maskDateInput(value.slice(0, -1), FMT)
      seen.push(value)
    }
    expect(seen).toEqual(["26-08-202", "26-08-20", "26-08-2", "26-08"])
  })

  it("ignores digits beyond the format's capacity", () => {
    expect(maskDateInput("260820269999", FMT)).toBe("26-08-2026")
  })

  it("passes unmaskable formats through untouched", () => {
    expect(maskDateInput("26 Aug 2026", "dd MMM yyyy")).toBe("26 Aug 2026")
  })
})

describe("parseDateInput", () => {
  const iso = (d: Date | undefined) => (d ? [d.getFullYear(), d.getMonth() + 1, d.getDate()] : undefined)

  it("accepts the padded and the natural spelling alike", () => {
    expect(iso(parseDateInput("26-08-2026", FMT))).toEqual([2026, 8, 26])
    expect(iso(parseDateInput("1-8-2026", FMT))).toEqual([2026, 8, 1])
  })

  it("rejects half-typed input rather than guessing", () => {
    expect(parseDateInput("", FMT)).toBeUndefined()
    expect(parseDateInput("26", FMT)).toBeUndefined()
    expect(parseDateInput("26-08", FMT)).toBeUndefined()
    expect(parseDateInput("26-08-20", FMT)).toBeUndefined()
  })

  it("rejects days that do not exist", () => {
    expect(parseDateInput("31-02-2026", FMT)).toBeUndefined()
    expect(parseDateInput("29-02-2026", FMT)).toBeUndefined()
    expect(iso(parseDateInput("29-02-2024", FMT))).toEqual([2024, 2, 29])
  })

  it("anchors the parsed date at local midnight", () => {
    const parsed = parseDateInput("26-08-2026", FMT)!
    expect([parsed.getHours(), parsed.getMinutes(), parsed.getSeconds()]).toEqual([0, 0, 0])
  })

  it("still handles an unmaskable format at exact width", () => {
    expect(iso(parseDateInput("26 Aug 2026", "dd MMM yyyy"))).toEqual([2026, 8, 26])
    expect(parseDateInput("26 Aug 20", "dd MMM yyyy")).toBeUndefined()
  })
})

describe("getDateFormatMaxLength", () => {
  it("measures a fully typed value", () => {
    expect(getDateFormatMaxLength(FMT)).toBe(10)
    expect(getDateFormatMaxLength("yyyy/MM/dd")).toBe(10)
    expect(getDateFormatMaxLength("dd MMM yyyy")).toBeUndefined()
  })
})
