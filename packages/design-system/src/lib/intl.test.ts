import { describe, expect, it } from "vitest"

import { igrpDateTimeFormat, igrpNumberFormat } from "./intl.js"

describe("Intl formatter cache", () => {
  it("returns the same formatter for the same locale and options", () => {
    expect(igrpNumberFormat("pt-PT", { maximumFractionDigits: 2 })).toBe(
      igrpNumberFormat("pt-PT", { maximumFractionDigits: 2 })
    )
    expect(igrpDateTimeFormat("pt-PT", { timeZone: "UTC" })).toBe(igrpDateTimeFormat("pt-PT", { timeZone: "UTC" }))
  })

  it("keys on locale, options and formatter kind", () => {
    const base = igrpNumberFormat("pt-PT", { maximumFractionDigits: 2 })
    expect(igrpNumberFormat("en-US", { maximumFractionDigits: 2 })).not.toBe(base)
    expect(igrpNumberFormat("pt-PT", { maximumFractionDigits: 1 })).not.toBe(base)
    expect(igrpNumberFormat("pt-PT")).not.toBe(igrpDateTimeFormat("pt-PT"))
    expect(igrpNumberFormat("en-US", { style: "currency", currency: "EUR" }).format(1.5)).toBe("€1.50")
  })
})
