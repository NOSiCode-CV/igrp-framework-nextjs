/**
 * Guards the one property of `./cn` that makes it worth having: the BUILT module
 * carries no `"use client"` directive, and pulls in nothing that does.
 *
 * Source review cannot see this. The directive is emitted per-module by Babel
 * from whatever the source file declares, so `./cn` is server-safe only as long
 * as nobody adds a directive to `src/cn.ts` and nobody makes it import from
 * `src/index.ts` (or any component). Both are one-line changes that look
 * harmless in a diff.
 *
 * Nothing else in the toolchain would notice. `tsc --noEmit` passes either way,
 * `biome`/`eslint` pass either way, and the consuming app still compiles — the
 * failure only appears during a real `next build`, in page-data collection,
 * phrased as "Attempted to call cn() from the server but cn is on the client",
 * and attributed to whatever unrelated route happened to pull the root layout
 * in first. That is what this test exists to prevent recurring.
 *
 * Every assertion below also asserts it INSPECTED something. A guard that can
 * pass while reading nothing is not a guard — this repo has shipped three of
 * those (the `'use client'` quote bug, the missing `check:dist`, the `froms`
 * regex), and each one passed unconditionally for months.
 */
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const distRoot = path.join(packageRoot, "dist")

/** Entries that consumers may import from server components / server modules. */
const SERVER_SAFE_ENTRIES = ["cn.js"]

const CLIENT_DIRECTIVE = /^\s*(["'])use client\1/

describe.skipIf(!existsSync(distRoot))("server-safe entry points", () => {
  it("has server-safe entries to check", () => {
    // Fails if SERVER_SAFE_ENTRIES is emptied, or if the build stopped emitting
    // them — either way the assertions below would otherwise pass vacuously.
    expect(SERVER_SAFE_ENTRIES.length).toBeGreaterThan(0)
    for (const entry of SERVER_SAFE_ENTRIES) {
      expect(existsSync(path.join(distRoot, entry)), `${entry} missing from dist/`).toBe(true)
    }
  })

  it("emits no 'use client' directive in a server-safe entry", () => {
    for (const entry of SERVER_SAFE_ENTRIES) {
      const code = readFileSync(path.join(distRoot, entry), "utf8")
      expect(code.length, `${entry} is empty`).toBeGreaterThan(0)
      expect(CLIENT_DIRECTIVE.test(code), `${entry} declares "use client"`).toBe(false)
    }
  })

  it("does not reach the client barrel from a server-safe entry", () => {
    for (const entry of SERVER_SAFE_ENTRIES) {
      const code = readFileSync(path.join(distRoot, entry), "utf8")
      // A relative import of the barrel re-introduces the boundary transitively.
      expect(code, `${entry} imports the client barrel`).not.toMatch(/from\s+["']\.\/index\.js["']/)
    }
  })

  it("proves the check is meaningful: the root barrel IS a client boundary", () => {
    // If this ever fails, the root stopped being a client boundary and the
    // assertions above are no longer distinguishing anything.
    const barrel = readFileSync(path.join(distRoot, "index.js"), "utf8")
    expect(CLIENT_DIRECTIVE.test(barrel)).toBe(true)
  })
})
