import { describe, expect, it } from "vitest"

import { getDateFormatMaxLength, getDateFormatParts, maskDateInput, parseDateInput } from "./date-input-format.js"

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

  it("accepts a value written exactly as the format renders it", () => {
    expect(iso(parseDateInput("26-08-2026", FMT))).toEqual([2026, 8, 26])
    expect(iso(parseDateInput("01-08-2026", FMT))).toEqual([2026, 8, 1])
  })

  it("rejects a value whose token widths do not match the format", () => {
    // `dd-MM-yyyy` renders `01-08-2026`; a one-digit day or month is a different shape.
    // `maskDateInput` pads these while the user types, so this only bites on paste or on a
    // value set programmatically — which is exactly where a wrong format must not slip in.
    expect(parseDateInput("1-8-2026", FMT)).toBeUndefined()
    expect(parseDateInput("1-08-2026", FMT)).toBeUndefined()
    expect(parseDateInput("26-8-2026", FMT)).toBeUndefined()
  })

  it("rejects a value written in a different format", () => {
    expect(parseDateInput("26/08/2026", FMT)).toBeUndefined()
    expect(parseDateInput("2026-08-26", FMT)).toBeUndefined()
    expect(parseDateInput("26 Aug 2026", FMT)).toBeUndefined()
  })

  it("honours single-letter tokens, which render unpadded", () => {
    expect(iso(parseDateInput("1-8-2026", "d-M-yyyy"))).toEqual([2026, 8, 1])
    expect(iso(parseDateInput("26-8-2026", "d-M-yyyy"))).toEqual([2026, 8, 26])
    // The mask has to commit to a width while typing and pads to two, so the padded
    // spelling has to keep working for these formats or the field accepts nothing at all.
    expect(iso(parseDateInput("01-08-2026", "d-M-yyyy"))).toEqual([2026, 8, 1])
  })

  it("applies the same rule to named-month formats", () => {
    expect(iso(parseDateInput("26 Aug 2026", "dd MMM yyyy"))).toEqual([2026, 8, 26])
    expect(parseDateInput("26 aug 2026", "dd MMM yyyy")).toBeUndefined()
    expect(parseDateInput("26 August 2026", "dd MMM yyyy")).toBeUndefined()
  })

  it("does not read a two-digit year as a four-digit one", () => {
    // The mask leaves a short year short precisely so this stays rejected.
    expect(parseDateInput("26-08-20", "yyyy-MM-dd")).toBeUndefined()
    expect(iso(parseDateInput("2026-08-26", "yyyy-MM-dd"))).toEqual([2026, 8, 26])
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
