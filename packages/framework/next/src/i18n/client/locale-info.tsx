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

let lastFormatLocale: string | undefined;

/** Records the provider's format locale; called by `IGRPIntlProvider` after it mounts. */
export function igrpRecordFormatLocale(formatLocale: string): void {
  lastFormatLocale = formatLocale;
}

/**
 * The format locale the intl provider last rendered with, or `undefined` before
 * it mounts (e.g. the root layout failed on the server). For `global-error.tsx`,
 * which renders outside every provider and cannot read the deployment's
 * `IGRP_FORMAT_LOCALES`; client module state outlives the root layout it replaces.
 */
export function igrpLastFormatLocale(): string | undefined {
  return lastFormatLocale;
}
