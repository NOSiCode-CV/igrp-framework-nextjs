// @vitest-environment node
import { icons } from "lucide-react"
import { describe, expect, it } from "vitest"

import { IGRPIconObject } from "../catalog.js"
import { IGRP_ICON_NAMES, IGRP_ICON_NAMES_OMITTED } from "../names.js"

describe("icon names", () => {
  it("match the installed lucide-react (run `pnpm generate:icon-names` if this fails)", () => {
    const omitted = new Set(IGRP_ICON_NAMES_OMITTED)
    expect([...IGRP_ICON_NAMES]).toEqual(
      Object.keys(icons)
        .sort()
        .filter((name) => !omitted.has(name))
    )
  })

  it("IGRPIconObject exposes the same sorted list", () => {
    expect(IGRPIconObject).toEqual([...IGRP_ICON_NAMES])
    expect(IGRPIconObject.length).toBeGreaterThan(1000)
  })
})
