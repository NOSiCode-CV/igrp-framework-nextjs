import {
  IGRP_CHROME_STRINGS_EN,
  IGRP_CHROME_STRINGS_FR,
  IGRP_CHROME_STRINGS_PT,
  type IGRPChromeStrings,
} from '@igrp/framework-next-ui';
import {
  IGRP_I18N_DEFAULTS_EN,
  IGRP_I18N_DEFAULTS_FR,
  IGRP_I18N_DEFAULTS_PT,
  igrpMergeI18nStrings,
  type IGRPI18nStrings,
} from '@igrp/igrp-framework-react-design-system';

import type { IGRPChromeStringsOverride, IGRPI18nConfig, IGRPLocale } from '../config.js';

const DS: Record<IGRPLocale, IGRPI18nStrings> = {
  pt: IGRP_I18N_DEFAULTS_PT,
  en: IGRP_I18N_DEFAULTS_EN,
  fr: IGRP_I18N_DEFAULTS_FR,
};
const CHROME: Record<IGRPLocale, IGRPChromeStrings> = {
  pt: IGRP_CHROME_STRINGS_PT,
  en: IGRP_CHROME_STRINGS_EN,
  fr: IGRP_CHROME_STRINGS_FR,
};

const dsCache = new WeakMap<IGRPI18nConfig, Map<IGRPLocale, IGRPI18nStrings>>();
const chromeCache = new WeakMap<IGRPI18nConfig, Map<IGRPLocale, IGRPChromeStrings>>();

function memo<T>(
  store: WeakMap<IGRPI18nConfig, Map<IGRPLocale, T>>,
  i18n: IGRPI18nConfig,
  locale: IGRPLocale,
  build: () => T,
): T {
  let m = store.get(i18n);
  if (!m) {
    m = new Map();
    store.set(i18n, m);
  }
  const hit = m.get(locale);
  if (hit) return hit;
  const built = build();
  m.set(locale, built);
  return built;
}

function mergeChrome(
  base: IGRPChromeStrings,
  override?: IGRPChromeStringsOverride,
): IGRPChromeStrings {
  if (!override) return base;
  const result = { ...base } as Record<string, object>;
  for (const group of Object.keys(base) as (keyof IGRPChromeStrings)[]) {
    const patch = override[group];
    if (patch) result[group] = { ...base[group], ...patch };
  }
  return result as unknown as IGRPChromeStrings;
}

/** Design-system catalog for `locale` with the app's overrides merged. */
export function igrpGetDesignSystemStrings(
  i18n: IGRPI18nConfig,
  locale: IGRPLocale,
): IGRPI18nStrings {
  return memo(dsCache, i18n, locale, () =>
    igrpMergeI18nStrings(DS[locale], i18n.overrides?.[locale]?.designSystem),
  );
}

/** Chrome catalog for `locale` with the app's overrides merged. */
export function igrpGetChromeStrings(i18n: IGRPI18nConfig, locale: IGRPLocale): IGRPChromeStrings {
  return memo(chromeCache, i18n, locale, () =>
    mergeChrome(CHROME[locale], i18n.overrides?.[locale]?.chrome),
  );
}
