'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import { type AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import { IGRPChromeI18nProvider, type IGRPChromeStrings } from '@igrp/framework-next-ui';
import { IGRPI18nProvider, type IGRPI18nStrings } from '@igrp/igrp-framework-react-design-system';

import type { IGRPLocale } from '../config.js';
import { igrpGetMessageFallback, igrpOnIntlError } from '../fallback.js';
import {
  IGRPLocaleInfoContext,
  type IGRPLocaleInfo,
  igrpRecordFormatLocale,
} from './locale-info.js';

export interface IGRPIntlProviderProps {
  locale: IGRPLocale;
  formatLocale: string;
  locales: readonly IGRPLocale[];
  timeZone?: string;
  /** Already merged on the server (`igrpMergeMessages`). */
  messages: AbstractIntlMessages;
  designSystemStrings: IGRPI18nStrings;
  chromeStrings: IGRPChromeStrings;
  children: ReactNode;
}

/**
 * Client i18n context: next-intl (app + framework messages), the design-system
 * catalog and the chrome catalog for the current locale. The error and
 * fallback handlers are functions, which cannot cross from the server layout,
 * so they are wired here. Mounted by `IGRPRootLayout` when `config.i18n` is set.
 */
export function IGRPIntlProvider({
  locale,
  formatLocale,
  locales,
  timeZone,
  messages,
  designSystemStrings,
  chromeStrings,
  children,
}: IGRPIntlProviderProps) {
  const info = useMemo<IGRPLocaleInfo>(
    () => ({ locale, formatLocale, locales, timeZone }),
    [locale, formatLocale, locales, timeZone],
  );
  useEffect(() => igrpRecordFormatLocale(formatLocale), [formatLocale]);
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
      onError={igrpOnIntlError}
      getMessageFallback={igrpGetMessageFallback}
    >
      <IGRPLocaleInfoContext.Provider value={info}>
        <IGRPI18nProvider strings={designSystemStrings} locale={formatLocale} timeZone={timeZone}>
          <IGRPChromeI18nProvider strings={chromeStrings}>{children}</IGRPChromeI18nProvider>
        </IGRPI18nProvider>
      </IGRPLocaleInfoContext.Provider>
    </NextIntlClientProvider>
  );
}
