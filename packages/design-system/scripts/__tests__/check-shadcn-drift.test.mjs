import { describe, it, expect } from "vitest"
import {
  parseStampDate,
  listPrimitives,
  normalizeSource,
  hashSource,
  diffLines,
  registryUrl,
} from "../check-shadcn-drift.mjs"

describe("parseStampDate", () => {
  it("extracts the YYYY-MM-DD from a line-comment stamp", () => {
    const src = "// shadcn: 2026-05-18\nimport * as React from 'react'\n"
    expect(parseStampDate(src)).toBe("2026-05-18")
  })

  it("extracts the date from a block-comment stamp", () => {
    const src = "/* shadcn: 2026-05-18 */\nimport * as React from 'react'\n"
    expect(parseStampDate(src)).toBe("2026-05-18")
  })

  it("finds a stamp sitting below another leading comment", () => {
    const src =
      "/* eslint-disable react-refresh/only-export-components */\n/* shadcn: 2026-05-18 */\nimport x from 'y'\n"
    expect(parseStampDate(src)).toBe("2026-05-18")
  })

  it("returns null when no stamp is present", () => {
    const src = "import * as React from 'react'\n"
    expect(parseStampDate(src)).toBeNull()
  })

  it("ignores stamps that appear after real code", () => {
    const src = "import * as React from 'react'\n// shadcn: 2026-05-18\n"
    expect(parseStampDate(src)).toBeNull()
  })
})

describe("listPrimitives", () => {
  it("returns a list of .tsx files under primitives/ relative to the package root", async () => {
    const files = await listPrimitives()
    expect(files.length).toBeGreaterThan(20) // we have ~56
    expect(files.every((f) => f.endsWith(".tsx"))).toBe(true)
    expect(files.some((f) => f.endsWith("button.tsx"))).toBe(true)
  })

  it("stamps every primitive it lists", async () => {
    const { readFile } = await import("node:fs/promises")
    const { join, dirname, resolve } = await import("node:path")
    const { fileURLToPath } = await import("node:url")
    const dir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "components", "primitives")

    const unstamped = []
    for (const f of await listPrimitives()) {
      if (parseStampDate(await readFile(join(dir, f), "utf8")) === null) unstamped.push(f)
    }
    expect(unstamped).toEqual([])
  })
})

describe("normalizeSource", () => {
  it("rewrites upstream @/ aliases to this package's relative paths", () => {
    expect(normalizeSource('import { cn } from "@/lib/utils"\n')).toContain('"../../lib/utils"')
    expect(normalizeSource('import { Button } from "@/components/ui/button"\n')).toContain('"./button"')
  })

  it("drops the leading comment block but keeps a use client directive", () => {
    const src = '/* shadcn: 2026-05-18 */\n"use client"\n\nconst a = 1\n'
    const out = normalizeSource(src)
    expect(out).not.toContain("shadcn:")
    expect(out).toContain('"use client"')
  })

  it("ignores line-ending and trailing-whitespace differences", () => {
    expect(normalizeSource("const a = 1  \r\nconst b = 2\r\n\r\n")).toBe(normalizeSource("const a = 1\nconst b = 2\n"))
  })
})

describe("hashSource", () => {
  it("is stable for equal input and differs for changed input", () => {
    expect(hashSource("a\n")).toBe(hashSource("a\n"))
    expect(hashSource("a\n")).not.toBe(hashSource("b\n"))
  })
})

describe("diffLines", () => {
  it("returns no +/- markers for identical input", () => {
    const out = diffLines("a\nb\nc\n", "a\nb\nc\n")
    expect(out.split("\n").some((l) => l.startsWith("+") || l.startsWith("-"))).toBe(false)
  })

  it("marks removed and added lines", () => {
    const out = diffLines("a\nb\n", "a\nc\n")
    expect(out).toContain("- b")
    expect(out).toContain("+ c")
  })
})

describe("registryUrl", () => {
  it("targets the radix-based style the package tracks", () => {
    expect(registryUrl("button")).toBe("https://ui.shadcn.com/r/styles/new-york-v4/button.json?base=radix")
  })
})
