import {
  IGRP_LOCALES,
  type IGRPLocale,
  igrpNormalizeLocale,
} from "@igrp/framework-next/i18n";

/**
 * Parses `IGRP_ENABLED_LOCALES` (`pt` or `pt,en`) into the languages this
 * deployment offers. Unknown tags are dropped and an empty result keeps every
 * platform language, so a bad value never stops the app. With one language
 * the locale switcher renders nothing.
 */
export function parseEnabledLocales(
  raw: string | undefined,
): readonly IGRPLocale[] {
  const locales = new Set<IGRPLocale>();
  for (const tag of (raw ?? "").split(",")) {
    const locale = igrpNormalizeLocale(tag);
    if (locale) locales.add(locale);
  }
  return locales.size > 0 ? [...locales] : IGRP_LOCALES;
}

/** `preferred` when enabled, else the first enabled language. */
export function pickDefaultLocale(
  locales: readonly IGRPLocale[],
  preferred: IGRPLocale,
): IGRPLocale {
  return locales.includes(preferred) ? preferred : locales[0];
}
