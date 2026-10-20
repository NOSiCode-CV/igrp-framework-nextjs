import { enGB, enUS, fr, frCA, pt, ptBR, type Locale } from "date-fns/locale"

/** Region-specific date-fns locales, matched on the whole tag first. */
const EXACT: Record<string, Locale> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "fr-CA": frCA,
}

/** Fallback per language for every other region (`pt-CV`, `en-GB`, `fr-FR`, …). */
const BY_LANGUAGE: Record<string, Locale> = {
  pt,
  en: enGB,
  fr,
}

/**
 * date-fns locale for a BCP-47 tag, used by the calendar when no `locale`
 * prop is given. Exact tag first, then language; `undefined` for a language
 * the platform does not ship, which lets react-day-picker use its default.
 */
export function igrpDateFnsLocale(tag: string): Locale | undefined {
  const [language = "", region] = tag.split(/[-_]/)
  const lang = language.toLowerCase()
  if (!lang) return undefined
  if (region) {
    const exact = EXACT[`${lang}-${region.toUpperCase()}`]
    if (exact) return exact
  }
  return BY_LANGUAGE[lang]
}
