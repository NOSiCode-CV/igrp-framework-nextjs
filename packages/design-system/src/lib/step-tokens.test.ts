/**
 * Stepper components colour their steps with semantic tokens, so the step states
 * resolve through `@theme inline` into Tailwind classes such as `bg-step-active`.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const tokens = readFileSync(join(__dirname, "..", "tokens.css"), "utf8")

describe("step tokens", () => {
  it.each(["step-active", "step-active-foreground", "step-complete", "step-complete-foreground"])(
    "%s is declared in :root and mapped in @theme",
    (name) => {
      expect(tokens).toMatch(new RegExp(`--${name}:\\s*var\\(--`))
      expect(tokens).toContain(`--color-${name}: var(--${name});`)
    }
  )
})
