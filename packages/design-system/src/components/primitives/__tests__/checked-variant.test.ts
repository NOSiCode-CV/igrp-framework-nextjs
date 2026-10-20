/**
 * The primitives are shadcn copies that style checked state with `data-checked:` /
 * `data-unchecked:`, which upstream targets Base UI. Ours wrap Radix, which only emits
 * `data-state="checked" | "unchecked"`, so without the widened variants in `tokens.css`
 * every checked style silently never applies (ADR 0002).
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

describe("checked-state variants (ADR 0002)", () => {
  it.each([
    ["data-checked", "checked"],
    ["data-unchecked", "unchecked"],
  ])("%s also matches Radix's data-state=%s", (variant, state) => {
    expect(primitivesUsing(variant).length).toBeGreaterThan(0)
    const declaration = new RegExp(`@custom-variant ${variant} \\(([^;]*)\\);`).exec(tokens)
    expect(declaration?.[1]).toContain(`&[${variant}]`)
    expect(declaration?.[1]).toContain(`&[data-state="${state}"]`)
  })
})
