// @vitest-environment node
import { icons } from "lucide-react"
import { describe, expect, it } from "vitest"

import { IGRPIconObject } from "../catalog.js"
import { IGRP_ICON_NAMES } from "../names.js"

describe("icon names", () => {
  it("match the installed lucide-react (run `pnpm generate:icon-names` if this fails)", () => {
    expect([...IGRP_ICON_NAMES]).toEqual(Object.keys(icons).sort())
  })

  it("IGRPIconObject exposes the same sorted list", () => {
    expect(IGRPIconObject).toEqual([...IGRP_ICON_NAMES])
    expect(IGRPIconObject.length).toBeGreaterThan(1000)
  })
})
