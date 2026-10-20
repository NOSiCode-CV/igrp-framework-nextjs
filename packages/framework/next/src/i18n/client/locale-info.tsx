'use client';

import { createContext, useContext } from 'react';

import { IGRP_DEFAULT_FORMAT_LOCALES, IGRP_LOCALES, type IGRPLocale } from '../config.js';

export type IGRPLocaleInfo = {
  locale: IGRPLocale;
  formatLocale: string;
  locales: readonly IGRPLocale[];
  /** `i18n.timeZone`; `undefined` formats in the runtime's zone. */
  timeZone?: string;
};

const DEFAULT_INFO: IGRPLocaleInfo = {
  locale: 'pt',
  formatLocale: IGRP_DEFAULT_FORMAT_LOCALES.pt,
  locales: IGRP_LOCALES,
};

export const IGRPLocaleInfoContext = createContext<IGRPLocaleInfo>(DEFAULT_INFO);

/** Locale, format locale and enabled locales of the current request; pt defaults without a provider. */
export function useIGRPLocaleInfo(): IGRPLocaleInfo {
  return useContext(IGRPLocaleInfoContext);
}
