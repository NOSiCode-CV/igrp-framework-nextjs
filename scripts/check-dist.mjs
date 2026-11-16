/**
 * Post-build contract on the emitted declarations, shared by every package that
 * ships `.d.ts` files (`check:dist` in design-system, next-types, next-ui, next).
 * Run from the package directory: it checks `<cwd>/dist`.
 *
 * `tsc` copies module specifiers into `dist/*.d.ts` VERBATIM, and these packages
 * are `"type": "module"`. An extensionless relative specifier is therefore
 * unresolvable for any consumer on `moduleResolution: "node16" | "nodenext"`, and
 * it fails *silently*: the TS2835 is raised inside a `.d.ts`, `skipLibCheck: true`
 * suppresses it, and every exported type degrades to `any`. Before this gate
 * existed, all 169 relative specifiers in the design system's `dist/index.d.ts`
 * were extensionless. Every in-repo consumer (`templates/demo-v1`) uses
 * `moduleResolution: "bundler"`, which accepts both spellings, so nothing else
 * catches it.
 *
 * `scripts/babel-plugin-add-import-extension.cjs` fixes the emitted `.js` only;
 * `tsc` has no equivalent. The fix belongs at the source import
 * (`./types/header.js`) — the Babel plugin is idempotent for already-extensioned
 * specifiers, so one spelling in `src/` satisfies both emitters.
 */

import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join, relative, sep } from "node:path"

const root = process.cwd()
const distDir = join(root, "dist")

if (!existsSync(distDir)) {
  console.error("\n[check-dist] dist/ does not exist — run this after the build.\n")
  process.exit(1)
}

function* declarationFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* declarationFiles(full)
    else if (entry.name.endsWith(".d.ts")) yield full
  }
}

/** `from './x'` / `import('./x')` — the specifier text `tsc` emitted. */
const SPECIFIER = /(?:from|import)\s*\(?\s*['"](\.[^'"]*)['"]/g
/** Non-JS assets are legitimately spelled with their own extension. */
const ASSET = /\.(css|json|svg|png|jpe?g|gif|webp|woff2?)$/i

const offenders = []
let checked = 0

for (const file of declarationFiles(distDir)) {
  checked += 1
  const source = readFileSync(file, "utf8")
  for (const [, specifier] of source.matchAll(SPECIFIER)) {
    if (!specifier.endsWith(".js") && !ASSET.test(specifier)) {
      offenders.push({ file: relative(root, file).split(sep).join("/"), specifier })
    }
  }
}

if (checked === 0) {
  console.error("\n[check-dist] no .d.ts files found in dist/ — the build emitted nothing.\n")
  process.exit(1)
}

if (offenders.length > 0) {
  console.error(
    `\n[check-dist] ${offenders.length} relative specifier(s) in dist/ lack a '.js' extension:\n` +
      offenders
        .slice(0, 40)
        .map(({ file, specifier }) => `  - ${file}: '${specifier}'`)
        .join("\n") +
      (offenders.length > 40 ? `\n  ... and ${offenders.length - 40} more` : "") +
      "\n\n  These declarations are unresolvable under moduleResolution 'node16'/'nodenext'," +
      "\n  and skipLibCheck hides the error while every exported type becomes `any`." +
      "\n  Add the extension at the SOURCE import (e.g. './types/header.js').\n"
  )
  process.exit(1)
}

console.log(`[check-dist] ok — ${checked} declaration file(s), every relative specifier carries a '.js' extension.`)
