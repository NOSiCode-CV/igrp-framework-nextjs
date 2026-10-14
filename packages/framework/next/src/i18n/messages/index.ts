import type { AbstractIntlMessages } from 'next-intl';

import type { IGRPI18nConfig, IGRPLocale } from '../config.js';
import { IGRP_MESSAGES_EN } from './en.js';
import { IGRP_MESSAGES_FR } from './fr.js';
import { IGRP_MESSAGES_PT, type IGRPFrameworkMessages } from './pt.js';

export { IGRP_MESSAGES_PT, IGRP_MESSAGES_EN, IGRP_MESSAGES_FR, type IGRPFrameworkMessages };

const FRAMEWORK: Record<IGRPLocale, AbstractIntlMessages> = {
  pt: IGRP_MESSAGES_PT,
  en: IGRP_MESSAGES_EN,
  fr: IGRP_MESSAGES_FR,
};

const isTree = (v: unknown): v is AbstractIntlMessages =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Every key of `override` wins; keys missing from it keep `base`'s value. Neither input is mutated. */
export function igrpDeepMergeMessages(
  base: AbstractIntlMessages,
  override: AbstractIntlMessages,
): AbstractIntlMessages {
  const result: AbstractIntlMessages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    result[key] = isTree(current) && isTree(value) ? igrpDeepMergeMessages(current, value) : value;
  }
  return result;
}

export type IGRPAppCatalogs = Partial<Record<IGRPLocale, AbstractIntlMessages>>;

const cache = new WeakMap<IGRPAppCatalogs, Map<IGRPLocale, AbstractIntlMessages>>();

/**
 * Messages for `locale`: framework[locale] ⊕ (app[defaultLocale] ⊕ app[locale]).
 * The framework catalogs are complete in all three languages, so they need
 * no fallback of their own; the app's default catalog is the per-key
 * fallback for its other languages, and app keys shadow framework keys.
 * Cached per catalogs object and locale.
 */
export function igrpMergeMessages(
  i18n: Pick<IGRPI18nConfig, 'defaultLocale'>,
  locale: IGRPLocale,
  appCatalogs: IGRPAppCatalogs,
): AbstractIntlMessages {
  let perLocale = cache.get(appCatalogs);
  if (!perLocale) {
    perLocale = new Map();
    cache.set(appCatalogs, perLocale);
  }
  const hit = perLocale.get(locale);
  if (hit) return hit;

  const appDefault = appCatalogs[i18n.defaultLocale] ?? {};
  const appLocale = appCatalogs[locale] ?? {};
  const app =
    locale === i18n.defaultLocale ? appDefault : igrpDeepMergeMessages(appDefault, appLocale);
  const merged = igrpDeepMergeMessages(FRAMEWORK[locale], app);
  perLocale.set(locale, merged);
  return merged;
}
