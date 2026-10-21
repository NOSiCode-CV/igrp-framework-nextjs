// Edge-safe: imported by app middleware. No React, no next/headers, no root
// barrel (which reaches node:async_hooks), no process.env for configuration.
import type { IGRPI18nConfigBase, IGRPLocale } from '@igrp/framework-next-types';
import type { IGRPChromeStrings } from '@igrp/framework-next-ui';
import type { IGRPI18nStringsOverride } from '@igrp/igrp-framework-react-design-system';

import { IgrpConfigError } from '../errors.js';

export type { IGRPLocale };

/** Platform locales. An app enables a subset, never others. */
export const IGRP_LOCALES = ['pt', 'en', 'fr'] as const satisfies readonly IGRPLocale[];

/** Native language names: a language is always shown in its own name, untranslated. */
export const IGRP_LOCALE_NATIVE_NAMES: Record<IGRPLocale, string> = {
  pt: 'Português',
  en: 'English',
  fr: 'Français',
};

/** Shared with `@igrp/framework-next-ui` (its cookie fallback); a test asserts equality. */
export const IGRP_LOCALE_COOKIE = 'IGRP_LOCALE';

export const IGRP_DEFAULT_FORMAT_LOCALES: Readonly<Record<IGRPLocale, string>> = {
  pt: 'pt-CV',
  en: 'en-GB',
  fr: 'fr-FR',
};

/**
 * `path=/` so every IGRP app behind the gateway shares the choice; not
 * `httpOnly` because `global-error.tsx` reads it from `document.cookie`.
 */
export function igrpLocaleCookieOptions(secure: boolean) {
  return {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax' as const,
    secure,
    httpOnly: false,
  };
}

/**
 * Whether the browser reached us over TLS. Behind the gateway's proxy the app
 * sees `http:`, so the first `x-forwarded-proto` value wins; then the caller's
 * own protocol (middleware), then `origin` (server actions).
 */
export function igrpIsSecureRequest(
  headers: Pick<Headers, 'get'>,
  fallbackProtocol?: string,
): boolean {
  const proto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  if (proto) return proto === 'https';
  if (fallbackProtocol) return fallbackProtocol === 'https:';
  return headers.get('origin')?.startsWith('https:') === true;
}

export function igrpIsLocale(value: unknown): value is IGRPLocale {
  return typeof value === 'string' && (IGRP_LOCALES as readonly string[]).includes(value);
}

/** `pt-CV`, `pt_PT`, `PT-br`, ` en ` → base language; unsupported → `undefined`. */
export function igrpNormalizeLocale(tag: unknown): IGRPLocale | undefined {
  if (typeof tag !== 'string') return undefined;
  const base = tag.trim().toLowerCase().split(/[-_]/)[0];
  return igrpIsLocale(base) ? base : undefined;
}

/**
 * First supported language of an `Accept-Language` header, by q-value then
 * header order. With `allowed`, only those locales count, so an app that
 * enables fewer languages still gets the user's most-preferred enabled one
 * (and `q=0` entries are never picked).
 */
export function igrpParseAcceptLanguage(
  header: string | null | undefined,
  allowed?: readonly IGRPLocale[],
): IGRPLocale | undefined {
  if (!header) return undefined;
  const entries = header
    .split(',')
    .map((part, index) => {
      const [rawTag, ...params] = part.trim().split(';');
      const qParam = params.map((p) => p.trim()).find((p) => p.toLowerCase().startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return { tag: rawTag?.trim() ?? '', q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((e) => e.tag && e.tag !== '*' && e.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const entry of entries) {
    const locale = igrpNormalizeLocale(entry.tag);
    if (locale && (!allowed || allowed.includes(locale))) return locale;
  }
  return undefined;
}

function invalid(message: string): IgrpConfigError {
  return new IgrpConfigError('IGRP_I18N_CONFIG_INVALID', `[igrp-i18n] ${message}`);
}

function assertFormatLocale(locale: IGRPLocale, tag: string): void {
  let canonical: string | undefined;
  try {
    canonical = Intl.getCanonicalLocales(tag)[0];
  } catch {
    canonical = undefined;
  }
  if (!canonical) throw invalid(`"${tag}" is not a valid BCP-47 tag.`);
  if (igrpNormalizeLocale(canonical) !== locale) {
    throw invalid(`format locale "${tag}" must be a region of "${locale}".`);
  }
  // A bare language must never reach Intl: `pt` resolves to Brazilian conventions.
  if (!new Intl.Locale(canonical).region) {
    throw invalid(`format locale "${tag}" must carry a region (e.g. "${locale}-XX").`);
  }
}

/**
 * Parses `IGRP_FORMAT_LOCALES` (`pt-PT` or `pt-AO,en-US`) into a partial map
 * keyed by language. The template reads the env var and passes the string;
 * the framework itself never reads `process.env`.
 */
export function igrpParseFormatLocales(
  raw: string | undefined,
): Partial<Record<IGRPLocale, string>> {
  const out: Partial<Record<IGRPLocale, string>> = {};
  if (!raw || !raw.trim()) return out;
  for (const entry of raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const locale = igrpNormalizeLocale(entry);
    if (!locale) throw invalid(`"${entry}" is not a region of a platform language (pt, en, fr).`);
    if (out[locale]) throw invalid(`language "${locale}" appears twice in IGRP_FORMAT_LOCALES.`);
    assertFormatLocale(locale, entry);
    out[locale] = entry;
  }
  return out;
}

/** Deep-partial of the chrome catalog, group by group. */
export type IGRPChromeStringsOverride = {
  [G in keyof IGRPChromeStrings]?: Partial<IGRPChromeStrings[G]>;
};

export type IGRPI18nOverrides = Partial<
  Record<IGRPLocale, { designSystem?: IGRPI18nStringsOverride; chrome?: IGRPChromeStringsOverride }>
>;

export interface IGRPI18nConfig extends IGRPI18nConfigBase {
  readonly overrides?: IGRPI18nOverrides;
}

export interface IGRPI18nOptions {
  defaultLocale: IGRPLocale;
  /** Defaults to all platform locales, in this order. */
  locales?: readonly IGRPLocale[];
  /** Merged over `IGRP_DEFAULT_FORMAT_LOCALES`. */
  formatLocales?: Partial<Record<IGRPLocale, string>>;
  timeZone?: string;
  getSessionLocale?: () => Promise<string | null | undefined>;
  /** Its presence selects `session-first` resolution; resolve `false` when there is no session to write to. */
  persistLocale?: (locale: IGRPLocale) => Promise<void | boolean>;
  overrides?: IGRPI18nOverrides;
}

/** Validates and freezes the app's i18n configuration. Throws `IgrpConfigError('IGRP_I18N_CONFIG_INVALID')`. */
export function igrpDefineI18n(options: IGRPI18nOptions): IGRPI18nConfig {
  const locales = options.locales ?? IGRP_LOCALES;
  if (locales.length === 0) throw invalid('`locales` must not be empty.');
  for (const locale of locales) {
    if (!igrpIsLocale(locale)) {
      throw invalid(`"${String(locale)}" is not a platform locale (pt, en, fr).`);
    }
  }
  if (!locales.includes(options.defaultLocale)) {
    throw invalid(
      `defaultLocale "${options.defaultLocale}" is not in locales [${locales.join(', ')}].`,
    );
  }
  const formatLocales = { ...IGRP_DEFAULT_FORMAT_LOCALES } as Record<IGRPLocale, string>;
  for (const [locale, tag] of Object.entries(options.formatLocales ?? {}) as [
    IGRPLocale,
    string | undefined,
  ][]) {
    if (!tag) continue;
    if (!igrpIsLocale(locale))
      throw invalid(`formatLocales key "${locale}" is not a platform locale.`);
    assertFormatLocale(locale, tag);
    formatLocales[locale] = tag;
  }
  return Object.freeze({
    defaultLocale: options.defaultLocale,
    locales: Object.freeze([...locales]),
    formatLocales: Object.freeze(formatLocales),
    ...(options.timeZone ? { timeZone: options.timeZone } : {}),
    resolution: options.persistLocale ? 'session-first' : 'cookie-first',
    ...(options.getSessionLocale ? { getSessionLocale: options.getSessionLocale } : {}),
    ...(options.persistLocale ? { persistLocale: options.persistLocale } : {}),
    ...(options.overrides ? { overrides: options.overrides } : {}),
  });
}

export type IGRPLocaleCandidates = {
  /** `IGRP_LOCALE` cookie value. */
  cookie?: string | null;
  /** `session.user.locale`, raw. */
  session?: string | null;
  /** Raw `Accept-Language` header. */
  acceptLanguage?: string | null;
};

/** Pure resolution. Candidates outside the enabled locales are skipped. */
export function igrpPickLocale(
  candidates: IGRPLocaleCandidates,
  i18n: Pick<IGRPI18nConfig, 'locales' | 'defaultLocale' | 'resolution'>,
): IGRPLocale {
  const enabled = (value: IGRPLocale | undefined) =>
    value && i18n.locales.includes(value) ? value : undefined;
  const cookie = enabled(igrpNormalizeLocale(candidates.cookie));
  const session = enabled(igrpNormalizeLocale(candidates.session));
  const ordered = i18n.resolution === 'session-first' ? [session, cookie] : [cookie, session];
  return (
    ordered.find(Boolean) ??
    igrpParseAcceptLanguage(candidates.acceptLanguage, i18n.locales) ??
    i18n.defaultLocale
  );
}
