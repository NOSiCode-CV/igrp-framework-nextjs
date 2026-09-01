/**
 * Regression guard: every source file under `src/` must be free of top-level
 * side effects, except CSS files (which are the only declared sideEffects in
 * `package.json`). Adding a top-level mutation would silently break consumer
 * tree-shaking.
 *
 * Heuristic checks:
 *   - No top-level statement that calls a function (other than imports, type
 *     aliases, interfaces, exports, declarations) — i.e. no `someFn()` at the
 *     module's outer scope.
 *   - No `import "*.css"` from a `.ts`/`.tsx` file (CSS belongs in tokens.css,
 *     consumed via the `/tokens` subpath export, not co-imported from JS).
 *
 * This is intentionally conservative — it catches the patterns most likely to
 * defeat tree-shaking. A determined writer can still smuggle effects in via
 * imported impure modules; for that, run `pnpm dlx agadoo dist/index.js` after
 * build.
 */
import { readFile, readdir } from "node:fs/promises"
import { join, dirname, resolve, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(__dirname, "..", "src")

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const out = []
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "experimental") continue
      out.push(...(await walk(full)))
    } else if (e.isFile() && /\.(ts|tsx)$/.test(e.name) && !/\.test\.(ts|tsx)$/.test(e.name)) {
      out.push(full)
    }
  }
  return out
}

describe("package side-effect hygiene", () => {
  it("no .ts/.tsx file imports a .css file", async () => {
    const files = await walk(SRC)
    const offenders = []
    for (const file of files) {
      const src = await readFile(file, "utf8")
      if (/^\s*import[^;]*['"][^'"]+\.css['"]/m.test(src)) {
        offenders.push(relative(SRC, file))
      }
    }
    expect(offenders, "CSS belongs in tokens.css, consumed via the /tokens export").toEqual([])
  })

  it("no .ts/.tsx file has a bare top-level function call (likely side effect)", async () => {
    const files = await walk(SRC)
    const offenders = []
    // Lines that look like function calls at column 0: `foo(`, `foo.bar(`, `new Foo(`.
    // Ignore lines inside template strings or comments — best-effort, not bulletproof.
    const callRe = /^([A-Za-z_$][\w$.]*\s*\(|new\s+[A-Za-z_$])/
    // Allowed top-level call: none — even logging is a smell at module scope.
    for (const file of files) {
      const src = await readFile(file, "utf8")
      const lines = src.split(/\r?\n/)
      let inBlockComment = false
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (inBlockComment) {
          if (line.includes("*/")) inBlockComment = false
          continue
        }
        const trimmedStart = line.replace(/^\s*/, "")
        if (trimmedStart.startsWith("/*")) {
          if (!line.includes("*/")) inBlockComment = true
          continue
        }
        if (line.startsWith("//")) continue
        // Only flag column-0 (no leading whitespace) — indented = inside a function/block.
        if (callRe.test(line)) {
          offenders.push(`${relative(SRC, file)}:${i + 1}: ${line.slice(0, 80)}`)
        }
      }
    }
    expect(offenders, "Top-level function calls break tree-shaking; move into a function or export").toEqual([])
  })
})
