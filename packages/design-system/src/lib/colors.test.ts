import { describe, expect, it } from "vitest"

import { IGRPColors, IGRPColorObjectRole, IGRPColorObjectVariants } from "./colors"

/** Every slot, flattened to `[role, color, slot]` for exhaustive assertions. */
const everySlot = IGRPColorObjectRole.flatMap((role) =>
  IGRPColorObjectVariants.map((color) => [role, color, IGRPColors[role][color]] as const),
)

describe("IGRPColors", () => {
  it("covers every color for every role", () => {
    expect(everySlot).toHaveLength(IGRPColorObjectRole.length * IGRPColorObjectVariants.length)
  })

  describe("bgStatic", () => {
    it.each(everySlot)("%s/%s carries no interactive state variant", (_role, _color, slot) => {
      // Non-interactive surfaces (cards, panels) use this slot, so a `hover:` /
      // `focus:` class leaking in would apply a state the surface never enters.
      expect(slot.bgStatic).not.toMatch(/[a-z-]+:/)
    })

    it.each(everySlot)("%s/%s is bg with the state variants removed", (_role, _color, slot) => {
      const expected = slot.bg
        .split(" ")
        .filter((token) => !token.includes(":"))
        .join(" ")

      expect(slot.bgStatic).toBe(expected)
    })

    it.each(everySlot)("%s/%s still declares a background", (_role, _color, slot) => {
      expect(slot.bgStatic).toMatch(/^bg-/)
    })
  })
})
