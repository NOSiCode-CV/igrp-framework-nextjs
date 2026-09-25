// @vitest-environment node
/**
 * The primitives are shadcn copies that style orientation with `data-vertical:` /
 * `data-horizontal:`, which upstream targets Base UI. Ours wrap Radix, which only
 * emits `data-orientation="vertical" | "horizontal"`, so without the widened
 * variants in `tokens.css` every orientation style silently never applies — a
 * vertical Separator measured 0px wide (ADR 0004).
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { compile } from "tailwindcss"
import { describe, expect, it } from "vitest"

const SRC = join(__dirname, "..", "..", "..")
const PRIMITIVES = join(SRC, "components", "primitives")
const tokens = readFileSync(join(SRC, "tokens.css"), "utf8")

function primitivesUsing(variant: string): string[] {
  return readdirSync(PRIMITIVES).filter(
    (f) => f.endsWith(".tsx") && readFileSync(join(PRIMITIVES, f), "utf8").includes(`${variant}`)
  )
}

/** Compiles the given candidates against the real tokens.css. */
async function css(candidates: string[]): Promise<string> {
  const compiler = await compile(`@import "tailwindcss/utilities";\n${tokens}`, {
    base: SRC,
    loadStylesheet: async (id, base) => {
      const path = require.resolve(id === "tailwindcss/utilities" ? "tailwindcss/utilities.css" : id, { paths: [base] })
      return { path, base, content: readFileSync(path, "utf8") }
    },
  })
  return compiler.build(candidates)
}

describe("orientation variants (ADR 0004)", () => {
  it.each([["vertical"], ["horizontal"]])("data-%s also matches Radix's data-orientation", (orientation) => {
    const variant = `data-${orientation}`
    expect(primitivesUsing(`${variant}:`).length).toBeGreaterThan(0)
    const declaration = new RegExp(`@custom-variant ${variant} \\(([^;]*)\\);`).exec(tokens)
    expect(declaration?.[1]).toContain(`&[${variant}]`)
    expect(declaration?.[1]).toContain(`&[data-orientation="${orientation}"]`)
  })

  it("a plain variant reaches Radix's attribute", async () => {
    const out = await css(["data-vertical:w-px"])
    expect(out).toContain('[data-orientation="vertical"]')
  })

  it("the group-*/name compound the tabs and toggle-group use still resolves", async () => {
    const out = await css(["group-data-vertical/tabs:flex-col"])
    expect(out).toMatch(/\.group\\\/tabs[^{]*\[data-orientation="vertical"\]/)
  })

  it("the group-has-*/name compound the field description uses still resolves", async () => {
    const out = await css(["group-has-data-horizontal/field:text-balance"])
    expect(out).toContain('[data-orientation="horizontal"]')
  })
})
