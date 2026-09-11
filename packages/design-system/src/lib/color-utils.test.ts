import { describe, it, expect } from "vitest"
import { hexToFormat, formatToHex, detectFormat, colorToOklch } from "./color-utils"

describe("detectFormat", () => {
  it("detects hex", () => expect(detectFormat("#3b82f6")).toBe("hex"))
  it("detects short hex", () => expect(detectFormat("#fff")).toBe("hex"))
  it("detects 4-char hex (alpha discarded)", () => expect(detectFormat("#ffff")).toBe("hex"))
  it("detects 8-char hex (alpha discarded)", () => expect(detectFormat("#ff000080")).toBe("hex"))
  it("returns null for 5-char hex", () => expect(detectFormat("#fffff")).toBeNull())
  it("detects rgb", () => expect(detectFormat("rgb(59, 130, 246)")).toBe("rgb"))
  it("detects rgba", () => expect(detectFormat("rgba(59 130 246 / 50%)")).toBe("rgb"))
  it("detects hsl", () => expect(detectFormat("hsl(217, 91%, 60%)")).toBe("hsl"))
  it("detects hsla", () => expect(detectFormat("hsla(217 91% 60% / 0.5)")).toBe("hsl"))
  it("detects oklch", () => expect(detectFormat("oklch(0.546 0.245 262.881)")).toBe("oklch"))
  it("detects oklch with percentage lightness", () => expect(detectFormat("oklch(62.8% 0.25 29)")).toBe("oklch"))
  it("returns null for unknown", () => expect(detectFormat("blue")).toBeNull())
})

describe("formatToHex — CSS syntax coverage", () => {
  it("accepts the modern space syntax", () => {
    expect(formatToHex("rgb(255 0 0)", "rgb")).toBe("#ff0000")
    expect(formatToHex("hsl(0 100% 50%)", "hsl")).toBe("#ff0000")
  })
  it("accepts percentage and angle units", () => {
    expect(formatToHex("rgb(100% 0% 0%)", "rgb")).toBe("#ff0000")
    expect(formatToHex("hsl(0deg 100 50)", "hsl")).toBe("#ff0000")
  })
  it("discards alpha", () => {
    expect(formatToHex("rgba(255, 0, 0, 0.5)", "rgb")).toBe("#ff0000")
    expect(formatToHex("rgb(255 0 0 / 50%)", "rgb")).toBe("#ff0000")
    expect(formatToHex("#ff000080", "hex")).toBe("#ff0000")
    expect(formatToHex("#f008", "hex")).toBe("#ff0000")
  })
  it("reads an oklch lightness given as a percentage", () => {
    expect(formatToHex("oklch(62.8% 0.2577 29.234)", "oklch")).toBe(formatToHex("oklch(0.628 0.2577 29.234)", "oklch"))
  })
  it("normalises hue outside [0, 360)", () => {
    expect(formatToHex("hsl(360 100% 50%)", "hsl")).toBe("#ff0000")
    expect(formatToHex("hsl(-360 100% 50%)", "hsl")).toBe("#ff0000")
  })
  it("still rejects malformed input", () => {
    expect(formatToHex("rgb(255, 0)", "rgb")).toBeNull()
    expect(formatToHex("rgb(a, b, c)", "rgb")).toBeNull()
    expect(formatToHex("hsl(0 100% 50%)", "rgb")).toBeNull()
    expect(formatToHex("oklch(0.6 0.1)", "oklch")).toBeNull()
    expect(formatToHex("#12345", "hex")).toBeNull()
  })
})

describe("hexToFormat", () => {
  it("hex → hex normalises case", () => {
    expect(hexToFormat("#3B82F6", "hex")).toBe("#3b82f6")
  })
  it("hex → rgb", () => {
    expect(hexToFormat("#ff0000", "rgb")).toBe("rgb(255, 0, 0)")
  })
  it("hex → hsl red", () => {
    expect(hexToFormat("#ff0000", "hsl")).toBe("hsl(0, 100%, 50%)")
  })
  it("black → hsl", () => {
    expect(hexToFormat("#000000", "hsl")).toBe("hsl(0, 0%, 0%)")
  })
  it("white → rgb", () => {
    expect(hexToFormat("#ffffff", "rgb")).toBe("rgb(255, 255, 255)")
  })
  it("hex → oklch black has L≈0", () => {
    const result = hexToFormat("#000000", "oklch")
    const m = result.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)!
    expect(parseFloat(m[1]!)).toBeCloseTo(0, 2)
  })
  it("hex → oklch white has L≈1, C≈0", () => {
    const result = hexToFormat("#ffffff", "oklch")
    const m = result.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)!
    expect(parseFloat(m[1]!)).toBeCloseTo(1, 2)
    expect(parseFloat(m[2]!)).toBeCloseTo(0, 2)
  })
})

describe("formatToHex", () => {
  it("hex → hex", () => expect(formatToHex("#3b82f6", "hex")).toBe("#3b82f6"))
  it("short hex → hex", () => expect(formatToHex("#fff", "hex")).toBe("#ffffff"))
  it("invalid hex → null", () => expect(formatToHex("notahex", "hex")).toBeNull())
  it("rgb → hex", () => expect(formatToHex("rgb(255, 0, 0)", "rgb")).toBe("#ff0000"))
  it("hsl → hex", () => expect(formatToHex("hsl(0, 100%, 50%)", "hsl")).toBe("#ff0000"))
  it("invalid rgb → null", () => expect(formatToHex("rgb(255)", "rgb")).toBeNull())
  it("oklch(0 0 0) → #000000", () => expect(formatToHex("oklch(0 0 0)", "oklch")).toBe("#000000"))
  it("oklch(1 0 0) → #ffffff", () => expect(formatToHex("oklch(1 0 0)", "oklch")).toBe("#ffffff"))
})

describe("round-trip conversions", () => {
  const hexes = ["#ff0000", "#00ff00", "#0000ff", "#3b82f6", "#000000", "#ffffff", "#aabbcc"]

  for (const hex of hexes) {
    it(`${hex} → rgb → hex`, () => {
      expect(formatToHex(hexToFormat(hex, "rgb"), "rgb")).toBe(hex)
    })
    it(`${hex} → hsl → hex`, () => {
      expect(formatToHex(hexToFormat(hex, "hsl"), "hsl")).toBe(hex)
    })
    it(`${hex} → oklch → hex within ±1 per channel`, () => {
      const back = formatToHex(hexToFormat(hex, "oklch"), "oklch")!
      const orig = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
      const got = [parseInt(back.slice(1, 3), 16), parseInt(back.slice(3, 5), 16), parseInt(back.slice(5, 7), 16)]
      orig.forEach((v, i) => expect(Math.abs(v - got[i]!)).toBeLessThanOrEqual(1))
    })
  }
})

describe("colorToOklch", () => {
  it("oklch passthrough", () => {
    const v = "oklch(0.546 0.245 262.881)"
    expect(colorToOklch(v, "oklch")).toBe(v)
  })
  it("converts hex to oklch string", () => {
    expect(colorToOklch("#000000", "hex")).toMatch(/^oklch\(/)
  })
  it("converts rgb to oklch string", () => {
    expect(colorToOklch("rgb(255, 0, 0)", "rgb")).toMatch(/^oklch\(/)
  })
  it("invalid input returns oklch(0 0 0)", () => {
    expect(colorToOklch("bad", "hex")).toBe("oklch(0 0 0)")
  })
})
