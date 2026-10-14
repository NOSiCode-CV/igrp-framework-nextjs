import type { ReactNode } from 'react';
import type { AbstractIntlMessages } from 'next-intl';
import {
  IGRP_CHROME_STRINGS_EN,
  IGRP_CHROME_STRINGS_FR,
  IGRP_CHROME_STRINGS_PT,
} from '@igrp/framework-next-ui';
import {
  IGRP_I18N_DEFAULTS_EN,
  IGRP_I18N_DEFAULTS_FR,
  IGRP_I18N_DEFAULTS_PT,
} from '@igrp/igrp-framework-react-design-system';

import { IGRPIntlProvider } from '../client/provider.js';
import { IGRP_DEFAULT_FORMAT_LOCALES, IGRP_LOCALES, type IGRPLocale } from '../config.js';
import { igrpMergeMessages } from '../messages/index.js';

const DS = { pt: IGRP_I18N_DEFAULTS_PT, en: IGRP_I18N_DEFAULTS_EN, fr: IGRP_I18N_DEFAULTS_FR };
const CHROME = { pt: IGRP_CHROME_STRINGS_PT, en: IGRP_CHROME_STRINGS_EN, fr: IGRP_CHROME_STRINGS_FR };

export interface IGRPIntlTestProviderProps {
  locale?: IGRPLocale;
  locales?: readonly IGRPLocale[];
  formatLocale?: string;
  /** App catalogs keyed by locale; framework namespaces are merged underneath. */
  messages?: Partial<Record<IGRPLocale, AbstractIntlMessages>>;
  children: ReactNode;
}

/**
 * The same client context `IGRPRootLayout` mounts, for tests:
 * `render(<X />, { wrapper: ({ children }) => <IGRPIntlTestProvider locale="en">{children}</IGRPIntlTestProvider> })`.
 */
export function IGRPIntlTestProvider({
  locale = 'pt',
  locales = IGRP_LOCALES,
  formatLocale = IGRP_DEFAULT_FORMAT_LOCALES[locale],
  messages = {},
  children,
}: IGRPIntlTestProviderProps) {
  return (
    <IGRPIntlProvider
      locale={locale}
      formatLocale={formatLocale}
      locales={locales}
      messages={igrpMergeMessages({ defaultLocale: locale }, locale, messages)}
      designSystemStrings={DS[locale]}
      chromeStrings={CHROME[locale]}
    >
      {children}
    </IGRPIntlProvider>
  );
}
