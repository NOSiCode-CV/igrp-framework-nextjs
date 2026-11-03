/**
 * The primitives are shadcn copies that style open state with `data-open:` / `data-closed:`,
 * which upstream targets Base UI. Ours wrap Radix, which only emits
 * `data-state="open" | "closed"`, so without the widened variants in `tokens.css` every
 * enter/exit animation and open highlight silently never applies (ADR 0006).
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const SRC = join(__dirname, "..", "..", "..")
const PRIMITIVES = join(SRC, "components", "primitives")
const tokens = readFileSync(join(SRC, "tokens.css"), "utf8")

function primitivesUsing(variant: string): string[] {
  return readdirSync(PRIMITIVES).filter(
    (f) => f.endsWith(".tsx") && readFileSync(join(PRIMITIVES, f), "utf8").includes(`${variant}:`)
  )
}

describe("open-state variants (ADR 0006)", () => {
  it.each([
    ["data-open", "open"],
    ["data-closed", "closed"],
  ])("%s also matches Radix's data-state=%s", (variant, state) => {
    expect(primitivesUsing(variant).length).toBeGreaterThan(0)
    const declaration = new RegExp(`@custom-variant ${variant} \\(([^;]*)\\);`).exec(tokens)
    expect(declaration?.[1]).toContain(`&[${variant}]`)
    expect(declaration?.[1]).toContain(`&[data-state="${state}"]`)
  })

  it("AccordionContent does not pin its body to the height measured on open", () => {
    const accordion = readFileSync(join(PRIMITIVES, "accordion.tsx"), "utf8")
    expect(accordion).toContain("data-open:animate-accordion-down")
    expect(accordion).not.toContain("h-(--radix-accordion-content-height)")
  })
})
