import { IGRP_CHROME_STRINGS_PT, type IGRPChromeStrings } from './strings.js';
import { IGRP_CHROME_STRINGS_EN } from './strings.en.js';
import { IGRP_CHROME_STRINGS_FR } from './strings.fr.js';

const BY_LANGUAGE: Record<string, IGRPChromeStrings> = {
  pt: IGRP_CHROME_STRINGS_PT,
  en: IGRP_CHROME_STRINGS_EN,
  fr: IGRP_CHROME_STRINGS_FR,
};

/**
 * Chrome catalog for a locale or language tag (`fr`, `fr-FR`, `EN_gb`).
 * Unsupported, empty or missing tags resolve to Portuguese: this is the
 * fallback path of `useIGRPChromeI18n()` and must never throw.
 */
export function igrpChromeStringsFor(tag: string | null | undefined): IGRPChromeStrings {
  const language = (tag ?? '').trim().toLowerCase().split(/[-_]/)[0] ?? '';
  return BY_LANGUAGE[language] ?? IGRP_CHROME_STRINGS_PT;
}
