# IGRPInputColor Redesign

**Date:** 2026-05-15
**Package:** `packages/design-system` — `@igrp/igrp-framework-react-design-system`
**Component:** `IGRPInputColor`

## Background

A review of the existing `IGRPInputColor` found three issues:

1. **Invisible focus ring** — the `<input type="color">` is `opacity-0` inside an `overflow-hidden` wrapper, so `focus-visible` styles never show. Keyboard users get no focus indicator.
2. **Incomplete error state** — `border-destructive` applies to the swatch wrapper only; the hex display keeps `border-input`, making the error signal partial.
3. **Shadow inconsistency** — swatch wrapper uses `shadow-sm`; hex display has no shadow.

The rebuild also expands the component with multi-format support and editable string input.

## Goals

- Fix all three review issues
- Support HEX / RGB / HSL / OKLCH display and editing
- Ship a `colorToOklch(value, format)` utility for consumers who need OKLCH
- Follow the same `IGRPFormField` integration pattern as `IGRPInputText`
- No new external dependencies

## Architecture

### Files changed

```
packages/design-system/src/
  lib/
    color-utils.ts           ← NEW: all color math + exported colorToOklch
  components/horizon/input/
    color.tsx                ← REBUILT: IGRPInputColor
  index.ts                   ← add colorToOklch to public exports
```

### Layout

```
<IGRPFormField>                       ← when inside form context; standalone div otherwise
  <div className="flex gap-2 items-center">
    [Swatch]                          ← hidden input[type=color] + color preview div
    [InputGroup]                      ← InputGroupInput + optional InputGroupAddon
  </div>
</IGRPFormField>
```

The swatch and `InputGroup` are siblings in a `flex gap-2` row, not nested inside each other.

## Component API

```tsx
type ColorFormat = "hex" | "rgb" | "hsl" | "oklch"

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
  className?: string
}
```

**`format` behaviour:**
- Absent → format dropdown visible; user can switch at runtime; `defaultFormat` sets the initial value (defaults to `"oklch"`)
- Present → dropdown hidden; `onChange` always emits in the specified format

**`value` / `defaultValue`** accept any supported format string — the component parses on mount and normalises to hex internally.

## Internal State

Single source of truth is always hex (the native picker's native format):

| State | Type | Purpose |
|---|---|---|
| `hexValue` | `string` | Internal canonical value, always `"#rrggbb"` |
| `activeFormat` | `ColorFormat` | Current display format |
| `stringInput` | `string` | Text field local buffer — allows partial edits without firing onChange |

**Update flows:**

- **Native picker change** → update `hexValue` → sync `stringInput` to `hexToFormat(newHex, activeFormat)` → fire `onChange`
- **User types in text field** → update `stringInput` only (no `onChange`)
- **Text field blur / Enter** → `formatToHex(stringInput, activeFormat)`: if valid → update `hexValue` + fire `onChange`; if invalid → reset `stringInput` to `hexToFormat(hexValue, activeFormat)`
- **Format dropdown switches** → update `activeFormat` → sync `stringInput` to `hexToFormat(hexValue, newFormat)` → fire `onChange` with value in new format

## Color Utilities (`lib/color-utils.ts`)

```tsx
export type ColorFormat = "hex" | "rgb" | "hsl" | "oklch"

/** Convert a hex color to the target format string. */
export function hexToFormat(hex: string, format: ColorFormat): string

/** Parse a color string in the given format and return hex. Returns null if invalid. */
export function formatToHex(value: string, format: ColorFormat): string | null

/** Convert any supported color string to an oklch() string. Public utility for consumers. */
export function colorToOklch(value: string, format: ColorFormat): string
```

**Implementation notes:**
- HEX ↔ RGB ↔ HSL: pure JS math, no dependencies
- HEX ↔ OKLCH: sRGB → linear sRGB → XYZ-D65 → OKLab → OKLCH pipeline (~40 lines of math)
- No external color library required

`colorToOklch` is re-exported from `src/index.ts`:
```tsx
export { colorToOklch, type ColorFormat } from "./lib/color-utils"
```

## Focus, Error & Disabled States

### Focus ring (fixes Issue #1)

Applied to the swatch wrapper via `has-[:focus-visible]` — the hidden `input[type=color]` receives focus; the wrapper shows the ring:

```tsx
"has-[:focus-visible]:border-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50"
```

`overflow-hidden` is removed from the swatch wrapper so the ring is not clipped. The color preview div stays contained via `rounded-md` on both wrapper and preview.

### Error state (fixes Issue #2)

Both the swatch wrapper and the `InputGroup` receive `border-destructive` when `fieldState.error || error`:

```tsx
// swatch wrapper
(fieldState.error || error) && "border-destructive"

// InputGroup
(fieldState.error || error) && "border-destructive [&:not(:focus-within)]:ring-destructive/20"
```

### Shadow (fixes Issue #3)

Both swatch wrapper and `InputGroup` use `shadow-xs` (consistent with other Horizon inputs).

### Disabled

`opacity-50 pointer-events-none` on the outer `div` wrapper — covers both swatch and text field at once.

## Form Integration

Two render paths, mirroring `IGRPInputText`:

**With form context** (`useFormContext()` returns a value):
- Wrap in `IGRPFormField` with `control={formContext.control}`
- Render function receives `(field, fieldState)`
- `field.value`, `field.onChange`, `field.onBlur` wired to the component
- `fieldState.error` drives `border-destructive` on both swatch and `InputGroup`

**Without form context:**
- Render standalone with a plain `div` wrapper
- `error` prop drives `border-destructive`
- Label, helper text, and error message rendered manually (same as `IGRPInputText` lines 97–141)

## Non-goals

- Alpha/opacity channel support (native `input[type=color]` does not support alpha)
- Preset color palette (out of scope; can be composed externally)
- Custom popover picker (native OS picker chosen for simplicity and zero deps)
