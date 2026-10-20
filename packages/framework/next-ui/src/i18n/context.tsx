'use client';

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

import { igrpChromeStringsFor } from './catalogs.js';
import { IGRP_LOCALE_COOKIE } from './cookie.js';
import type { IGRPChromeStrings } from './strings.js';

const ChromeI18nContext = createContext<IGRPChromeStrings | null>(null);

/**
 * Supplies the chrome catalog for the current locale. Mounted by
 * `IGRPIntlProvider` in `@igrp/framework-next/i18n/client`; apps without i18n
 * never mount it and get the fallback below.
 */
export function IGRPChromeI18nProvider({
  strings,
  children,
}: {
  strings: IGRPChromeStrings;
  children: ReactNode;
}) {
  return <ChromeI18nContext.Provider value={strings}>{children}</ChromeI18nContext.Provider>;
}

const subscribeNever = () => () => {};

/**
 * The `IGRP_LOCALE` cookie value on the client; `''` when absent.
 *
 * Never throws: the cookie is shared by every app on the domain and is not
 * `httpOnly`, so a malformed percent-encoding is a real input, and a throw here
 * would take down every chrome component, `IGRPGlobalError` included. A value
 * that cannot be decoded is used raw (and then falls back to Portuguese);
 * RFC 6265 surrounding quotes are stripped.
 */
function readCookieLocale(): string {
  const entry = document.cookie.split('; ').find((c) => c.startsWith(`${IGRP_LOCALE_COOKIE}=`));
  if (!entry) return '';
  const raw = entry.slice(IGRP_LOCALE_COOKIE.length + 1);
  let value: string;
  try {
    value = decodeURIComponent(raw);
  } catch {
    value = raw;
  }
  return value.length >= 2 && value.startsWith('"') && value.endsWith('"')
    ? value.slice(1, -1)
    : value;
}

const serverSnapshot = () => '';

/**
 * The chrome catalog in effect.
 *
 * With a provider: its catalog. Without one (an app that has not configured
 * i18n, or `global-error.tsx`, which renders outside every provider): the
 * catalog for the `IGRP_LOCALE` cookie on the client, Portuguese on the server.
 * `useSyncExternalStore` renders the server snapshot during hydration and then
 * the cookie value, so the markup never mismatches.
 */
export function useIGRPChromeI18n(): IGRPChromeStrings {
  const provided = useContext(ChromeI18nContext);
  const cookieLocale = useSyncExternalStore(subscribeNever, readCookieLocale, serverSnapshot);
  return provided ?? igrpChromeStringsFor(cookieLocale);
}
