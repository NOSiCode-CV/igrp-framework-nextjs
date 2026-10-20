// @vitest-environment node
import { describe, expect, it } from "vitest"

import { RICH_TEXT_PLACEHOLDER_CLASS, RICH_TEXT_PROSE_CLASS, RICH_TEXT_TABLE_CLASS } from "../styles.js"

/**
 * The rich-text typography is owned by the DS, not by `@tailwindcss/typography`.
 * The template migrator cannot add a dependency to an upgraded app, and without
 * the plugin every `prose` class silently does nothing — Tailwind's preflight
 * then strips list bullets and heading sizes with no error anywhere.
 */
describe("rich-text styles", () => {
  const all = [RICH_TEXT_PROSE_CLASS, RICH_TEXT_TABLE_CLASS, RICH_TEXT_PLACEHOLDER_CLASS].join(" ").split(/\s+/)

  it("use no class from the typography plugin", () => {
    expect(all.filter((c) => /^(?:[\w-]+:)*prose(?:-|$)/.test(c))).toEqual([])
  })

  it("restore what preflight strips: list markers and heading sizes", () => {
    for (const needed of [
      "[&_ul]:list-disc",
      "[&_ol]:list-decimal",
      "[&_h1]:text-2xl",
      "[&_h2]:text-xl",
      "[&_h3]:text-lg",
    ]) {
      expect(all, needed).toContain(needed)
    }
  })

  it("render the editor placeholder from its data attribute", () => {
    expect(RICH_TEXT_PLACEHOLDER_CLASS).toContain("before:content-[attr(data-placeholder)]")
  })
})
