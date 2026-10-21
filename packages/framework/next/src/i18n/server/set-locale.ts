import { cookies, headers } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';

import {
  IGRP_LOCALE_COOKIE,
  type IGRPI18nConfig,
  type IGRPLocale,
  igrpIsSecureRequest,
  igrpLocaleCookieOptions,
  igrpNormalizeLocale,
} from '../config.js';

export type IGRPSetLocaleResult =
  | { success: true; data: { locale: IGRPLocale; persisted: boolean } }
  | { success: false; error: string; status: number };

/**
 * Changes the UI language. Validate → `persistLocale` (when configured; a
 * failure aborts and nothing is written, so cookie and profile never
 * disagree) → cookie. Not a server action itself: Next accepts only function
 * declarations as exports of a `'use server'` file, so the app wraps it:
 *
 * ```ts
 * 'use server';
 * export async function setLocale(value: string) { return igrpSetLocale(i18n, value); }
 * ```
 *
 * Next control flow thrown inside `persistLocale` (`redirect()`,
 * `notFound()`, a `forbidden()` from the app's session gate) is rethrown, so
 * the navigation happens instead of a 500 result. `persistLocale` should
 * no-op and resolve `false` when there is no session (an anonymous visitor
 * may still change the language; only the cookie is written and the result
 * carries `persisted: false`, so the client skips its session refresh).
 */
export async function igrpSetLocale(
  i18n: IGRPI18nConfig,
  value: string,
): Promise<IGRPSetLocaleResult> {
  const locale = igrpNormalizeLocale(value);
  if (!locale || !i18n.locales.includes(locale)) {
    return { success: false, error: `Unsupported locale: ${value}`, status: 400 };
  }

  let persisted = false;
  if (i18n.persistLocale) {
    try {
      persisted = (await i18n.persistLocale(locale)) !== false;
    } catch (error) {
      unstable_rethrow(error);
      console.error('[igrp-i18n] persistLocale failed; the locale was not changed.', error);
      return { success: false, error: 'Could not save the language preference.', status: 500 };
    }
  }

  const secure = igrpIsSecureRequest(await headers());
  const cookieStore = await cookies();
  cookieStore.set(IGRP_LOCALE_COOKIE, locale, igrpLocaleCookieOptions(secure));

  return { success: true, data: { locale, persisted } };
}
