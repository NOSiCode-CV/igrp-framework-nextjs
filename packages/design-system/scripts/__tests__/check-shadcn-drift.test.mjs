import { describe, it, expect } from "vitest"
import { parseStampDate, listPrimitives } from "../check-shadcn-drift.mjs"

describe("parseStampDate", () => {
  it("extracts the YYYY-MM-DD from a shadcn stamp comment", () => {
    const src = "// shadcn: 2026-05-18\nimport * as React from 'react'\n"
    expect(parseStampDate(src)).toBe("2026-05-18")
  })

  it("returns null when no stamp is present", () => {
    const src = "import * as React from 'react'\n"
    expect(parseStampDate(src)).toBeNull()
  })

  it("ignores stamps that are not on the first comment line", () => {
    const src = "import * as React from 'react'\n// shadcn: 2026-05-18\n"
    expect(parseStampDate(src)).toBeNull()
  })
})

describe("listPrimitives", () => {
  it("returns a list of .tsx files under primitives/ relative to the package root", async () => {
    const files = await listPrimitives()
    expect(files.length).toBeGreaterThan(20) // we have ~50
    expect(files.every((f) => f.endsWith(".tsx"))).toBe(true)
    expect(files.some((f) => f.endsWith("button.tsx"))).toBe(true)
  })
})
