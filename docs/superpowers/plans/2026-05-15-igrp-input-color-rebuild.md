# IGRPInputColor Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `IGRPInputColor` with HEX/RGB/HSL/OKLCH multi-format support, editable string field, format dropdown, and fixed focus ring / error state / shadow issues.

**Architecture:** A new `color-utils.ts` handles all pure color math (no external dependencies); the rebuilt `color.tsx` uses shadcn `InputGroup` + `DropdownMenu` alongside a native `input[type=color]` swatch; `IGRPFormField` wires both form-context and standalone render paths using the same pattern as `IGRPInputText`.

**Tech Stack:** React 19, react-hook-form, shadcn primitives (`InputGroup`, `InputGroupInput`, `InputGroupAddon`, `InputGroupButton`, `DropdownMenu`), Tailwind v4 semantic tokens, Lucide `ChevronDown`, pure JS OKLCH math (no new dependencies).

---

## File Map

| File | Change |
|---|---|
| `packages/design-system/package.json` | Add `vitest` devDep + `test` script |
| `packages/design-system/vitest.config.ts` | CREATE |
| `packages/design-system/src/lib/color-utils.ts` | CREATE |
| `packages/design-system/src/lib/color-utils.test.ts` | CREATE |
| `packages/design-system/src/components/horizon/input/color.tsx` | REBUILD |
| `packages/design-system/src/index.ts` | Add `colorToOklch`, `ColorFormat`, `detectFormat` exports |

---

### Task 1: Set up Vitest in packages/design-system

**Files:**
- Modify: `packages/design-system/package.json`
- Create: `packages/design-system/vitest.config.ts`

- [ ] **Step 1: Add vitest to package.json**

In `packages/design-system/package.json`, add to `"devDependencies"`:
```json
"vitest": "^4.0.18"
```
And add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
// packages/design-system/vitest.config.ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
```

- [ ] **Step 3: Install and confirm setup**

Run from repo root:
```bash
pnpm install
pnpm --filter @igrp/igrp-framework-react-design-system test
```
Expected: `No test files found`

- [ ] **Step 4: Commit**

```bash
git add packages/design-system/package.json packages/design-system/vitest.config.ts
git commit -m "chore(design-system): add vitest for color-utils unit tests"
```

---

### Task 2: Implement color-utils.ts (TDD)

**Files:**
- Create: `packages/design-system/src/lib/color-utils.test.ts`
- Create: `packages/design-system/src/lib/color-utils.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/design-system/src/lib/color-utils.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import {
  hexToFormat,
  formatToHex,
  detectFormat,
  colorToOklch,
  type ColorFormat,
} from "./color-utils"

describe("detectFormat", () => {
  it("detects hex", () => expect(detectFormat("#3b82f6")).toBe("hex"))
  it("detects short hex", () => expect(detectFormat("#fff")).toBe("hex"))
  it("detects rgb", () => expect(detectFormat("rgb(59, 130, 246)")).toBe("rgb"))
  it("detects hsl", () => expect(detectFormat("hsl(217, 91%, 60%)")).toBe("hsl"))
  it("detects oklch", () => expect(detectFormat("oklch(0.546 0.245 262.881)")).toBe("oklch"))
  it("returns null for unknown", () => expect(detectFormat("blue")).toBeNull())
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
    expect(parseFloat(m[1])).toBeCloseTo(0, 2)
  })
  it("hex → oklch white has L≈1, C≈0", () => {
    const result = hexToFormat("#ffffff", "oklch")
    const m = result.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)!
    expect(parseFloat(m[1])).toBeCloseTo(1, 2)
    expect(parseFloat(m[2])).toBeCloseTo(0, 2)
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
      const got  = [parseInt(back.slice(1, 3), 16), parseInt(back.slice(3, 5), 16), parseInt(back.slice(5, 7), 16)]
      orig.forEach((v, i) => expect(Math.abs(v - got[i])).toBeLessThanOrEqual(1))
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
```

- [ ] **Step 2: Run — confirm all tests FAIL**

```bash
pnpm --filter @igrp/igrp-framework-react-design-system test
```
Expected: `Cannot find module './color-utils'`

- [ ] **Step 3: Create color-utils.ts**

Create `packages/design-system/src/lib/color-utils.ts`:

```typescript
export type ColorFormat = "hex" | "rgb" | "hsl" | "oklch"

// ─── Internal helpers ────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function hexToRgbComponents(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ]
}

function rgbComponentsToHex(r: number, g: number, b: number): string {
  const ch = (c: number) => Math.round(clamp(c * 255, 0, 255)).toString(16).padStart(2, "0")
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
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
    case g: h = ((b - r) / d + 2) / 6; break
    default: h = ((r - g) / d + 4) / 6
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
  const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
  const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z)
  const L  = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const a  = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  const C  = Math.sqrt(a * a + bv * bv)
  let   H  = Math.atan2(bv, a) * (180 / Math.PI)
  if (H < 0) H += 360
  return [L, C, H]
}

// OKLCH → sRGB via OKLab → XYZ-D65 → linear sRGB → sRGB
function oklchToHex(L: number, C: number, H: number): string {
  const a  = C * Math.cos(H * (Math.PI / 180))
  const b  = C * Math.sin(H * (Math.PI / 180))
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  const l  = l_ * l_ * l_
  const m  = m_ * m_ * m_
  const s  = s_ * s_ * s_
  return rgbComponentsToHex(
    clamp(delinearize(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), 0, 1),
    clamp(delinearize(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), 0, 1),
    clamp(delinearize(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s), 0, 1),
  )
}

// ─── String parsers ──────────────────────────────────────────────────────────

function parseHex(value: string): string | null {
  const m = value.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (!m) return null
  const h = m[1]
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h
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
  if (/^#[0-9a-fA-F]{3,6}$/.test(v)) return "hex"
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
      return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
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
```

- [ ] **Step 4: Run — confirm all tests PASS**

```bash
pnpm --filter @igrp/igrp-framework-react-design-system test
```
Expected: all tests green. If any OKLCH round-trip fails with a diff > 1, re-check the matrix values against https://bottosson.github.io/posts/oklab/

- [ ] **Step 5: Commit**

```bash
git add packages/design-system/src/lib/color-utils.ts packages/design-system/src/lib/color-utils.test.ts
git commit -m "feat(design-system): add color-utils with HEX/RGB/HSL/OKLCH conversions"
```

---

### Task 3: Rebuild color.tsx

**Files:**
- Modify: `packages/design-system/src/components/horizon/input/color.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
"use client"

import { useId, useState, useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { ChevronDown } from "lucide-react"

import { cn } from "../../../lib/utils"
import type { IGRPInputProps } from "../../../types"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "../../primitives/input-group"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "../../primitives/dropdown-menu"
import { IGRPFormField } from "../form/form-field"
import { IGRPLabel } from "../label"
import {
  hexToFormat,
  formatToHex,
  detectFormat,
  type ColorFormat,
} from "../../../lib/color-utils"

interface IGRPInputColorProps
  extends Omit<IGRPInputProps, "onChange" | "value" | "defaultValue"> {
  /** Initial color in any supported format. Default: "#000000" */
  defaultValue?: string
  /** Controlled color value in the active format. */
  value?: string
  /** Fires on every confirmed change; emits in the active format. */
  onChange?: (value: string) => void
  /** Locks the display format and hides the format dropdown. */
  format?: ColorFormat
  /** Initial format when format prop is omitted. Default: "oklch" */
  defaultFormat?: ColorFormat
  /** Show/hide the text field + format dropdown. Default: true */
  showFormatValue?: boolean
  error?: string
}

const FORMAT_LABELS: Record<ColorFormat, string> = {
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  oklch: "OKLCH",
}

const ALL_FORMATS: ColorFormat[] = ["hex", "rgb", "hsl", "oklch"]

function normalizeToHex(value: string, hint?: ColorFormat): string {
  if (!value) return "#000000"
  const fmt = hint ?? detectFormat(value) ?? "hex"
  return formatToHex(value, fmt) ?? "#000000"
}

function IGRPInputColor({
  name,
  id,
  label,
  helperText,
  className,
  labelClassName,
  required,
  defaultValue = "#000000",
  value: controlledValue,
  onChange,
  format: formatProp,
  defaultFormat = "oklch",
  showFormatValue = true,
  error,
  ...props
}: IGRPInputColorProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id
  const formContext = useFormContext()
  const isFormatLocked = formatProp !== undefined

  const [activeFormat, setActiveFormat] = useState<ColorFormat>(formatProp ?? defaultFormat)
  const [hexValue, setHexValue] = useState(() =>
    normalizeToHex(
      controlledValue ?? defaultValue,
      formatProp ?? (controlledValue ? (detectFormat(controlledValue) ?? defaultFormat) : defaultFormat),
    ),
  )
  const [stringInput, setStringInput] = useState(() => hexToFormat(hexValue, activeFormat))

  // Sync when controlled value changes externally (standalone path only)
  useEffect(() => {
    if (controlledValue !== undefined && !formContext) {
      const newHex = normalizeToHex(
        controlledValue,
        formatProp ?? detectFormat(controlledValue) ?? activeFormat,
      )
      setHexValue(newHex)
      setStringInput(hexToFormat(newHex, activeFormat))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledValue])

  function commitString(onFieldChange?: (v: string) => void) {
    const parsed = formatToHex(stringInput, activeFormat)
    if (parsed) {
      setHexValue(parsed)
      const display = hexToFormat(parsed, activeFormat)
      setStringInput(display)
      onFieldChange?.(display)
      onChange?.(display)
    } else {
      setStringInput(hexToFormat(hexValue, activeFormat))
    }
  }

  function handlePickerChange(
    e: React.ChangeEvent<HTMLInputElement>,
    onFieldChange?: (v: string) => void,
  ) {
    const newHex = e.target.value
    setHexValue(newHex)
    const display = hexToFormat(newHex, activeFormat)
    setStringInput(display)
    onFieldChange?.(display)
    onChange?.(display)
  }

  function handleFormatChange(fmt: ColorFormat, onFieldChange?: (v: string) => void) {
    setActiveFormat(fmt)
    const display = hexToFormat(hexValue, fmt)
    setStringInput(display)
    onFieldChange?.(display)
    onChange?.(display)
  }

  function renderControl(
    hasError: boolean,
    onFieldChange?: (v: string) => void,
    onFieldBlur?: () => void,
  ) {
    return (
      <div className={cn("flex items-center gap-2", props.disabled && "opacity-50 pointer-events-none")}>
        {/* Swatch — overflow-hidden removed so focus ring is not clipped */}
        <div
          className={cn(
            "relative size-9 flex-shrink-0 rounded-md border border-input shadow-xs",
            "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
            hasError && "border-destructive",
          )}
        >
          <input
            type="color"
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            value={hexValue}
            onChange={(e) => handlePickerChange(e, onFieldChange)}
            onBlur={onFieldBlur}
            disabled={props.disabled}
          />
          <div
            className="absolute inset-0 rounded-md pointer-events-none"
            style={{ backgroundColor: hexValue }}
          />
        </div>

        {showFormatValue && (
          <InputGroup className={cn("flex-1", hasError && "border-destructive")}>
            <InputGroupInput
              value={stringInput}
              onChange={(e) => setStringInput(e.target.value)}
              onBlur={() => commitString(onFieldChange)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commitString(onFieldChange)
                }
              }}
              aria-invalid={hasError || undefined}
            />
            {!isFormatLocked && (
              <InputGroupAddon align="inline-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton size="xs">
                      {FORMAT_LABELS[activeFormat]}
                      <ChevronDown data-icon="inline-end" />
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      {ALL_FORMATS.map((fmt) => (
                        <DropdownMenuItem
                          key={fmt}
                          onSelect={() => handleFormatChange(fmt, onFieldChange)}
                        >
                          {FORMAT_LABELS[fmt]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </InputGroupAddon>
            )}
          </InputGroup>
        )}
      </div>
    )
  }

  if (formContext) {
    return (
      <IGRPFormField
        name={fieldName}
        label={label}
        helperText={helperText}
        className={className}
        required={required}
        control={formContext.control}
      >
        {(field, fieldState) =>
          renderControl(!!fieldState.error || !!error, field.onChange, field.onBlur)
        }
      </IGRPFormField>
    )
  }

  return (
    <div className={cn("*:not-first:mt-2", className)}>
      {label && (
        <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />
      )}

      {renderControl(!!error)}

      {helperText && !error && (
        <p
          id={`${fieldName}-helper`}
          className="text-muted-foreground mt-2 text-xs"
          role="region"
          aria-live="polite"
        >
          {helperText}
        </p>
      )}

      {error && (
        <p id={`${fieldName}-error`} className="text-destructive mt-2 text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export { IGRPInputColor, type IGRPInputColorProps }
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm --filter @igrp/igrp-framework-react-design-system build:types 2>&1 | head -40
```
Expected: no errors. If there are type errors, check that `IGRPInputProps` does not conflict with the `Omit` exclusions.

- [ ] **Step 3: Commit**

```bash
git add packages/design-system/src/components/horizon/input/color.tsx
git commit -m "feat(design-system): rebuild IGRPInputColor with multi-format support and fixed a11y"
```

---

### Task 4: Export colorToOklch, ColorFormat, detectFormat from index.ts

**Files:**
- Modify: `packages/design-system/src/index.ts`

- [ ] **Step 1: Add exports to index.ts**

Find the `// libs` section near the bottom of `src/index.ts` (currently ends with `export { cn, parseLocalDate } from "./lib/utils"`). Add after that line:

```ts
export { colorToOklch, detectFormat, type ColorFormat } from "./lib/color-utils"
```

- [ ] **Step 2: Verify no duplicate export**

Search for any existing `colorToOklch` export:
```bash
grep -n "colorToOklch" packages/design-system/src/index.ts
```
Expected: exactly 1 match (the line just added).

- [ ] **Step 3: Commit**

```bash
git add packages/design-system/src/index.ts
git commit -m "feat(design-system): export colorToOklch, detectFormat, ColorFormat from public API"
```

---

### Task 5: Full build and verify

**Files:** none changed

- [ ] **Step 1: Run tests one final time**

```bash
pnpm --filter @igrp/igrp-framework-react-design-system test
```
Expected: all tests pass.

- [ ] **Step 2: Build the design-system**

```bash
pnpm build:ds
```
Expected: exits 0. Watch for React Compiler warnings — if the compiler rejects `color.tsx` due to `useEffect` with a conditional (`!formContext`), replace with `pnpm --filter @igrp/igrp-framework-react-design-system build:without_reactcompiler` as the escape hatch and note it in the commit message.

- [ ] **Step 3: Verify the export is present in dist**

```bash
grep -l "colorToOklch" packages/design-system/dist/*.js 2>/dev/null | head -3
```
Expected: at least one match.

- [ ] **Step 4: Final commit**

```bash
git add packages/design-system/dist
git commit -m "chore(design-system): build IGRPInputColor rebuild"
```

> **Note:** `dist/` is in `.gitignore` for most packages — if the grep above returns nothing from git-tracked files, skip Step 4. The dist commit is only needed if this repo tracks built artifacts.
