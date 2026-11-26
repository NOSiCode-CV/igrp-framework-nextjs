import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { IGRPAvatar } from "../avatar.js"
import { IGRPDataTable } from "../data-table/index.js"
import { createIGRPColumnHelper } from "../data-table/column-helper.js"
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

// sRGB relative luminance of an oklch() colour (CSS Color 4 matrices).
function oklchLuminance(l: number, c: number, h: number) {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ].map((v) => Math.min(1, Math.max(0, v)))
  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!
}

describe("--success token (light)", () => {
  it("keeps soft success text at 4.5:1 on a selected data-table row", () => {
    const css = readFileSync(join(__dirname, "..", "..", "..", "tokens.css"), "utf8")
    // The first definition is the light :root block; .dark comes later.
    const match = /^\s*--success:\s*oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/m.exec(css)
    expect(match).not.toBeNull()
    const [l, c, h] = match!.slice(1).map(Number) as [number, number, number]
    // #e5efef: bg-success/5 over the selected row's bg-muted, as axe measured it.
    const surface = 0.8462
    expect((surface + 0.05) / (oklchLuminance(l, c, h) + 0.05)).toBeGreaterThanOrEqual(4.5)
  })
})
