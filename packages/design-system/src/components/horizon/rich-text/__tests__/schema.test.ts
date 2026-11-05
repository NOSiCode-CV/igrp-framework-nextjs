// @vitest-environment node
import { describe, expect, it } from "vitest"

import { isBlankRichText } from "../schema.js"

describe("isBlankRichText", () => {
  it("answers a long run of unclosed '<' in linear time", () => {
    // Stored HTML can bypass the editor; the old tag strip took seconds on this.
    const start = performance.now()
    expect(isBlankRichText("<".repeat(100_000))).toBe(false)
    expect(performance.now() - start).toBeLessThan(500)
  })

  it.each([
    ["<<p></p>", true],
    ["<a<b>", true],
    ["<p></p><", false],
    ["<p>&nbsp;</p>", true],
  ])("keeps the tag-strip result for malformed input %j", (html, blank) => {
    expect(isBlankRichText(html)).toBe(blank)
  })
})
