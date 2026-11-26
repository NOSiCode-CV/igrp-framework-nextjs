import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { IGRPAvatar } from "../avatar.js"
import { IGRPDataTable } from "../data-table/index.js"
import { createIGRPColumnHelper } from "../data-table/column-helper.js"
import { IGRPDataTableFilterSelect } from "../data-table/filter.js"
import { Command, CommandGroup, CommandItem, CommandList, CommandSeparator } from "../../primitives/command.js"

describe("IGRPAvatar status and icon indicators", () => {
  it("give the labelled spans role img, so aria-label is allowed and announced", () => {
    render(<IGRPAvatar fallback="AB" hasStatus status="success" showIcon />)
    expect(screen.getByRole("img", { name: "Estado: success" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Indicador" })).toBeInTheDocument()
  })
})

describe("CommandSeparator", () => {
  it("puts no role=separator inside the listbox", () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup heading="A">
            <CommandItem>Um</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="B">
            <CommandItem>Dois</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    )
    const listbox = screen.getByRole("listbox")
    expect(listbox.querySelector('[role="separator"]')).toBeNull()
    expect(listbox.querySelector('[data-slot="command-separator"]')).toHaveAttribute("role", "none")
  })
})

describe("IGRPDataTable actions column", () => {
  it("names its header cell for screen readers", () => {
    const col = createIGRPColumnHelper<{ id: string; name: string }>()
    render(
      <IGRPDataTable
        columns={[col.accessor("name", { header: "Nome" })]}
        data={[{ id: "a", name: "Ana" }]}
        actions={[{ type: "link", label: "Ver", href: () => "/x" }]}
      />
    )
    expect(screen.getByRole("columnheader", { name: "Ações" })).toBeInTheDocument()
  })
})

describe("IGRPDataTableFilterSelect", () => {
  // Closed, the Radix trigger shows no text: the selected item renders only once the list mounts.
  it("names its trigger from the catalogue, overridable by ariaLabel", () => {
    const { rerender } = render(<IGRPDataTableFilterSelect options={[{ label: "Um", value: "1" }]} />)
    expect(screen.getByRole("combobox", { name: "Filtrar" })).toBeInTheDocument()
    rerender(<IGRPDataTableFilterSelect options={[]} ariaLabel="Perfil" />)
    expect(screen.getByRole("combobox", { name: "Perfil" })).toBeInTheDocument()
  })
})

// oklch() → gamma-encoded sRGB (CSS Color 4 matrices), clipped to gamut like Chromium.
function oklchToSrgb(l: number, c: number, h: number): number[] {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ].map((v) => {
    const x = Math.min(1, Math.max(0, v))
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
  })
}

const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (x: number[], y: number[]) => {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const tokensCss = readFileSync(join(__dirname, "..", "..", "..", "tokens.css"), "utf8")
const darkStart = tokensCss.indexOf(".dark {")

function token(name: string, mode: "light" | "dark") {
  const block = mode === "light" ? tokensCss.slice(0, darkStart) : tokensCss.slice(darkStart)
  const match = new RegExp(String.raw`^\s*--${name}:\s*oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)`, "m").exec(block)
  if (!match) throw new Error(`--${name} not found in ${mode}`)
  return oklchToSrgb(...(match.slice(1).map(Number) as [number, number, number]))
}

// Browsers composite a translucent fill in gamma-encoded sRGB.
const over = (fg: number[], alpha: number, bg: number[]) => fg.map((v, i) => v * alpha + bg[i]! * (1 - alpha))

describe.each(["light", "dark"] as const)("soft text contrast (%s)", (mode) => {
  // A selected data-table row is bg-muted; soft badges add bg-<color>/5 on top (axe measured #e5efef for success).
  it.each(["success", "warning", "destructive", "indigo"])("keeps text-%s at 4.5:1 on its /5 tint over a selected row", (name) => {
    const fg = token(name, mode)
    expect(contrast(fg, over(fg, 0.05, token("muted", mode)))).toBeGreaterThanOrEqual(4.5)
  })

  it("keeps the destructive button's text at 4.5:1 on its own tint", () => {
    // primitives/button.tsx: bg-destructive/10, dark:bg-destructive/20.
    const fg = token("destructive", mode)
    const tint = mode === "light" ? 0.1 : 0.2
    expect(contrast(fg, over(fg, tint, token("background", mode)))).toBeGreaterThanOrEqual(4.5)
  })
})
