/**
 * `after:content-["*"]` looks fine in source, but Babel re-emits the string as
 * `"after:content-[\"*\"]"` and Tailwind — which scans the consumer's view of
 * `dist/` — generates a class whose name carries the backslashes, so it never
 * matches and no form-bound field showed its required asterisk. Single quotes
 * inside the brackets survive the build unescaped.
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const SRC = join(__dirname, "..", "..", "..")

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return entry === "__tests__" ? [] : sourceFiles(path)
    return /\.tsx?$/.test(entry) ? [path] : []
  })
}

describe("Tailwind arbitrary content values", () => {
  it("never use double quotes inside the brackets", () => {
    const files = sourceFiles(SRC)
    expect(files.length).toBeGreaterThan(100)
    const offenders = files.filter((f) => /content-\["/.test(readFileSync(f, "utf8")))
    expect(offenders).toEqual([])
  })
})
