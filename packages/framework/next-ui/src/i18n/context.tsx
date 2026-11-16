'use client';

import { createContext, use, useSyncExternalStore, type ReactNode } from 'react';

import { igrpChromeStringsFor } from './catalogs.js';
import { IGRP_LOCALE_COOKIE } from './cookie.js';
import type { IGRPChromeStrings } from './strings.js';

const ChromeI18nContext = createContext<IGRPChromeStrings | null>(null);

/** A partial chrome catalog: any group, any subset of its keys. */
export type IGRPChromeStringsOverrides = {
  [Group in keyof IGRPChromeStrings]?: Partial<IGRPChromeStrings[Group]>;
};

/** `base` with every defined value of `overrides` laid over it, group by group. */
export function igrpMergeChromeStrings(
  base: IGRPChromeStrings,
  overrides: IGRPChromeStringsOverrides | undefined,
): IGRPChromeStrings {
  if (!overrides) return base;
  const merged = { ...base } as unknown as Record<string, Record<string, unknown>>;
  for (const [group, values] of Object.entries(overrides)) {
    if (!values) continue;
    // `undefined` means "not overridden", so it never blanks a catalog string.
    const defined = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined));
    merged[group] = { ...merged[group], ...defined };
  }
  return merged as unknown as IGRPChromeStrings;
}

/**
 * Supplies the chrome catalog for the current locale. Mounted by
 * `IGRPIntlProvider` in `@igrp/framework-next/i18n/client`; apps without i18n
 * never mount it and get the fallback below.
 *
 * `strings` replaces the catalog. Without it the parent catalog (or the cookie
 * fallback) is used. `overrides` is merged over either, key by key, so a
 * subtree can rename one label without restating the rest.
 */
export function IGRPChromeI18nProvider({
  strings,
  overrides,
  children,
}: {
  strings?: IGRPChromeStrings;
  overrides?: IGRPChromeStringsOverrides;
  children: ReactNode;
}) {
  const parent = useIGRPChromeI18n();
  const value = igrpMergeChromeStrings(strings ?? parent, overrides);
  return <ChromeI18nContext value={value}>{children}</ChromeI18nContext>;
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
 *
 * Runs on every render of every chrome component (it is the store snapshot), so
 * the parse is cached against the last `document.cookie` string.
 */
let lastCookie: string | undefined;
let lastCookieLocale = '';
function readCookieLocale(): string {
  const cookie = document.cookie;
  if (cookie !== lastCookie) {
    lastCookie = cookie;
    lastCookieLocale = parseCookieLocale(cookie);
  }
  return lastCookieLocale;
}

function parseCookieLocale(cookie: string): string {
  const entry = cookie.split('; ').find((c) => c.startsWith(`${IGRP_LOCALE_COOKIE}=`));
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
  const provided = use(ChromeI18nContext);
  const cookieLocale = useSyncExternalStore(subscribeNever, readCookieLocale, serverSnapshot);
  return provided ?? igrpChromeStringsFor(cookieLocale);
}
