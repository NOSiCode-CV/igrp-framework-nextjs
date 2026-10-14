import { describe, expect, it } from "vitest"

import { IGRP_I18N_DEFAULTS_PT, type IGRPI18nStrings } from "../strings.js"
import { IGRP_I18N_DEFAULTS_EN } from "../strings.en.js"
import { IGRP_I18N_DEFAULTS_FR } from "../strings.fr.js"

/** `group.key` → value, for every leaf. */
function flatten(catalog: IGRPI18nStrings): Map<string, string> {
  const out = new Map<string, string>()
  for (const [group, strings] of Object.entries(catalog)) {
    for (const [key, value] of Object.entries(strings as Record<string, string>)) {
      out.set(`${group}.${key}`, value)
    }
  }
  return out
}

/** Sorted `{token}` names used by a message. */
function tokens(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort()
}

const PT = flatten(IGRP_I18N_DEFAULTS_PT)

describe.each([
  ["en", IGRP_I18N_DEFAULTS_EN],
  ["fr", IGRP_I18N_DEFAULTS_FR],
] as const)("%s catalog parity with pt", (_locale, catalog) => {
  const flat = flatten(catalog)

  it("has exactly the pt keys", () => {
    expect([...flat.keys()].sort()).toEqual([...PT.keys()].sort())
  })

  it("uses the same {token} arguments as pt for every key", () => {
    for (const [key, ptValue] of PT) {
      expect(tokens(flat.get(key) ?? ""), key).toEqual(tokens(ptValue))
    }
  })

  it("has no empty or non-string value", () => {
    for (const [key, value] of flat) {
      expect(typeof value, key).toBe("string")
      expect(value.trim().length, key).toBeGreaterThan(0)
    }
  })
})

describe("deprecated alias", () => {
  it("IGRP_I18N_DEFAULTS_PT_PT is the same object as IGRP_I18N_DEFAULTS_PT", async () => {
    const { IGRP_I18N_DEFAULTS_PT_PT } = await import("../strings.js")
    expect(IGRP_I18N_DEFAULTS_PT_PT).toBe(IGRP_I18N_DEFAULTS_PT)
  })
})
