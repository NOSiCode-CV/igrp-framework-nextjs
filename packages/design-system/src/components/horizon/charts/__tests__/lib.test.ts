import { describe, it, expect } from "vitest"
import { formatChartValue, getChartHeight, getChartWidth } from "../lib"

describe("formatChartValue", () => {
  it("abbreviates positive magnitudes", () => {
    expect(formatChartValue(2500000)).toBe("2.5M")
    expect(formatChartValue(2500)).toBe("2.5K")
  })
  it("abbreviates negative magnitudes with sign", () => {
    expect(formatChartValue(-2500000)).toBe("-2.5M")
    expect(formatChartValue(-2500)).toBe("-2.5K")
  })
})

describe("getChartHeight / getChartWidth honor an explicit 0", () => {
  it("returns an explicit numeric height of 0", () => {
    expect(getChartHeight("md", [], 0)).toBe(0)
  })
  it("returns an explicit numeric width of 0", () => {
    expect(getChartWidth(0)).toBe(0)
  })
  it("passes through a non-zero height", () => {
    expect(getChartHeight("md", [], 300)).toBe(300)
  })
})
