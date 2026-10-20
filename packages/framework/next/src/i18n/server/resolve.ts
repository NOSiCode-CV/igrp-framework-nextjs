import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';

import {
  IGRP_LOCALE_COOKIE,
  type IGRPI18nConfig,
  type IGRPLocale,
  igrpPickLocale,
} from '../config.js';

async function sessionLocale(i18n: IGRPI18nConfig): Promise<string | null | undefined> {
  if (!i18n.getSessionLocale) return undefined;
  try {
    return await i18n.getSessionLocale();
  } catch (error) {
    // Next's dynamic-rendering bailout is control flow, not a failure.
    unstable_rethrow(error);
    return undefined;
  }
}

/** The request's locale; one resolution per request (React `cache`). */
export const igrpResolveLocale = cache(async (i18n: IGRPI18nConfig): Promise<IGRPLocale> => {
  const [session, cookieStore, headerStore] = await Promise.all([
    sessionLocale(i18n),
    cookies(),
    headers(),
  ]);
  return igrpPickLocale(
    {
      cookie: cookieStore.get(IGRP_LOCALE_COOKIE)?.value,
      session,
      acceptLanguage: headerStore.get('accept-language'),
    },
    i18n,
  );
});

export async function igrpResolveFormatLocale(i18n: IGRPI18nConfig): Promise<string> {
  return i18n.formatLocales[await igrpResolveLocale(i18n)];
}
