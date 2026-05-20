export type ColorFormat = "hex" | "rgb" | "hsl" | "oklch"

// ─── Internal helpers ────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function hexToRgbComponents(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2) : h
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ]
}

function rgbComponentsToHex(r: number, g: number, b: number): string {
  const ch = (c: number) =>
    Math.round(clamp(c * 255, 0, 255))
      .toString(16)
      .padStart(2, "0")
  return `#${ch(r)}${ch(g)}${ch(b)}`
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      break
    case g:
      h = ((b - r) / d + 2) / 6
      break
    default:
      h = ((r - g) / d + 4) / 6
  }
  return [h * 360, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360
  if (s === 0) return [l, l, l]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2rgb = (t: number): number => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3)]
}

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function delinearize(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

// sRGB → OKLCH via linear sRGB → XYZ-D65 → OKLab → OKLCH
// Matrices: https://bottosson.github.io/posts/oklab/
function hexToOklch(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgbComponents(hex).map(linearize) as [number, number, number]
  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
  const z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z)
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  const C = Math.sqrt(a * a + bv * bv)
  let H = Math.atan2(bv, a) * (180 / Math.PI)
  if (H < 0) H += 360
  return [L, C, H]
}

// OKLCH → sRGB via OKLab → XYZ-D65 → linear sRGB → sRGB
function oklchToHex(L: number, C: number, H: number): string {
  const a = C * Math.cos(H * (Math.PI / 180))
  const b = C * Math.sin(H * (Math.PI / 180))
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_
  return rgbComponentsToHex(
    clamp(delinearize(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), 0, 1),
    clamp(delinearize(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), 0, 1),
    clamp(delinearize(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s), 0, 1),
  )
}

// ─── String parsers ──────────────────────────────────────────────────────────

function parseHex(value: string): string | null {
  const m = value.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (!m) return null
  const h = m[1]!
  const full = h.length === 3 ? h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2) : h
  return `#${full.toLowerCase()}`
}

function parseRgb(value: string): [number, number, number] | null {
  const m = value.trim().match(/^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/)
  if (!m) return null
  return [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255]
}

function parseHsl(value: string): [number, number, number] | null {
  const m = value.trim().match(/^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/)
  if (!m) return null
  return [Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100]
}

function parseOklch(value: string): [number, number, number] | null {
  const m = value.trim().match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/)
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Detect the format of a color string. Returns null if unrecognised. */
export function detectFormat(value: string): ColorFormat | null {
  const v = value.trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return "hex"
  if (/^rgb\(/.test(v)) return "rgb"
  if (/^hsl\(/.test(v)) return "hsl"
  if (/^oklch\(/.test(v)) return "oklch"
  return null
}

/** Convert a #rrggbb hex string to a color string in the target format. */
export function hexToFormat(hex: string, format: ColorFormat): string {
  const [r, g, b] = hexToRgbComponents(hex)
  switch (format) {
    case "hex":
      return hex.toLowerCase()
    case "rgb":
      return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
    case "hsl": {
      const [h, s, l] = rgbToHsl(r, g, b)
      return `hsl(${parseFloat(h.toFixed(4))}, ${parseFloat((s * 100).toFixed(4))}%, ${parseFloat((l * 100).toFixed(4))}%)`
    }
    case "oklch": {
      const [L, C, H] = hexToOklch(hex)
      return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(3)})`
    }
  }
}

/**
 * Parse a color string in the given format and return a #rrggbb hex string.
 * Returns null if the input is invalid.
 */
export function formatToHex(value: string, format: ColorFormat): string | null {
  switch (format) {
    case "hex":
      return parseHex(value)
    case "rgb": {
      const rgb = parseRgb(value)
      return rgb ? rgbComponentsToHex(...rgb) : null
    }
    case "hsl": {
      const hsl = parseHsl(value)
      return hsl ? rgbComponentsToHex(...hslToRgb(...hsl)) : null
    }
    case "oklch": {
      const oklch = parseOklch(value)
      return oklch ? oklchToHex(...oklch) : null
    }
  }
}

/**
 * Convert any supported color string to an `oklch(L C H)` string.
 * Pass `format` to tell the function how to interpret `value`.
 * When `format` is already `"oklch"` the value is returned as-is.
 */
export function colorToOklch(value: string, format: ColorFormat): string {
  if (format === "oklch") return value
  const hex = formatToHex(value, format)
  if (!hex) return "oklch(0 0 0)"
  return hexToFormat(hex, "oklch")
}
