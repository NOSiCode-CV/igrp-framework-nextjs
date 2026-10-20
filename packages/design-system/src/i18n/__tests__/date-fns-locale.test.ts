import { describe, expect, it } from "vitest"
import { enGB, enUS, fr, frCA, pt, ptBR } from "date-fns/locale"

import { igrpDateFnsLocale } from "../date-fns-locale.js"

describe("igrpDateFnsLocale", () => {
  it("maps exact tags first", () => {
    expect(igrpDateFnsLocale("pt-BR")).toBe(ptBR)
    expect(igrpDateFnsLocale("en-US")).toBe(enUS)
    expect(igrpDateFnsLocale("fr-CA")).toBe(frCA)
  })

  it("maps by language when the region is unknown", () => {
    expect(igrpDateFnsLocale("pt-CV")).toBe(pt)
    expect(igrpDateFnsLocale("pt-PT")).toBe(pt)
    expect(igrpDateFnsLocale("en-GB")).toBe(enGB)
    expect(igrpDateFnsLocale("en-IE")).toBe(enGB)
    expect(igrpDateFnsLocale("fr-FR")).toBe(fr)
    expect(igrpDateFnsLocale("fr")).toBe(fr)
  })

  it("is case-insensitive and accepts underscores", () => {
    expect(igrpDateFnsLocale("PT_br")).toBe(ptBR)
  })

  it("returns undefined for a language the platform does not ship", () => {
    expect(igrpDateFnsLocale("de-DE")).toBeUndefined()
    expect(igrpDateFnsLocale("")).toBeUndefined()
  })
})
