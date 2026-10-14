import { describe, expect, it } from "vitest"

import { igrpMergeI18nStrings } from "../merge.js"
import { IGRP_I18N_DEFAULTS_PT } from "../strings.js"
import { IGRP_I18N_DEFAULTS_EN } from "../strings.en.js"

describe("igrpMergeI18nStrings", () => {
  it("returns the base itself when there is no override", () => {
    expect(igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT)).toBe(IGRP_I18N_DEFAULTS_PT)
    expect(igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT, undefined)).toBe(IGRP_I18N_DEFAULTS_PT)
  })

  it("overrides one key and keeps the siblings of that group and every other group", () => {
    const merged = igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT, { dataTable: { notFound: "Nothing here." } })
    expect(merged.dataTable.notFound).toBe("Nothing here.")
    expect(merged.dataTable.clearFilters).toBe(IGRP_I18N_DEFAULTS_PT.dataTable.clearFilters)
    expect(merged.inputPhone).toBe(IGRP_I18N_DEFAULTS_PT.inputPhone)
  })

  it("returns a full catalog unchanged in content (every key wins)", () => {
    const merged = igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT, IGRP_I18N_DEFAULTS_EN)
    expect(merged).toEqual(IGRP_I18N_DEFAULTS_EN)
  })

  it("ignores group keys the base does not have", () => {
    const merged = igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT, {
      dataTable: { notFound: "x" },
      bogusGroup: { any: "y" },
    } as never)
    expect(merged).not.toHaveProperty("bogusGroup")
  })

  it("ignores undefined leaf values so a partial object cannot blank a string", () => {
    const merged = igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT, { button: { loadingText: undefined } })
    expect(merged.button.loadingText).toBe(IGRP_I18N_DEFAULTS_PT.button.loadingText)
  })

  it("does not mutate its inputs", () => {
    const before = JSON.stringify(IGRP_I18N_DEFAULTS_PT)
    igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT, { button: { loadingText: "…" } })
    expect(JSON.stringify(IGRP_I18N_DEFAULTS_PT)).toBe(before)
  })
})
