/**
 * i18n configuration as the framework config carries it.
 *
 * This package precedes the design system and `next-ui` in the dependency
 * order, so it cannot name their string catalogs. `overrides` is therefore
 * typed as `object` here; `@igrp/framework-next/i18n` declares
 * `IGRPI18nConfig extends IGRPI18nConfigBase` narrowing it to deep partials of
 * `IGRPI18nStrings` and `IGRPChromeStrings`. `igrpDefineI18n` returns the
 * narrow type, which is assignable to this base.
 */

/** Platform locales. Fixed: an app may enable fewer, never others. */
export type IGRPLocale = 'pt' | 'en' | 'fr';

/**
 * Which source wins when the browser holds a locale choice AND the session
 * carries one. `session-first` is only valid for apps that persist the choice
 * (a `persistLocale` is configured); see ADR 0001 and its amendment.
 */
export type IGRPLocaleResolution = 'cookie-first' | 'session-first';

export interface IGRPI18nConfigBase {
  /** The enabled locale used when nothing about the request names another. */
  readonly defaultLocale: IGRPLocale;
  /** Enabled locales, in switcher order. Always contains `defaultLocale`. */
  readonly locales: readonly IGRPLocale[];
  /** Region-qualified tag per locale, used for `Intl`, the design system and `<html lang>`. */
  readonly formatLocales: Readonly<Record<IGRPLocale, string>>;
  /** Forwarded to next-intl so server and client format dates in one zone. */
  readonly timeZone?: string;
  /** Derived from the presence of `persistLocale`. */
  readonly resolution: IGRPLocaleResolution;
  /** The signed-in user's locale (`session.user.locale`), raw; `undefined` when unknown. */
  readonly getSessionLocale?: () => Promise<string | null | undefined>;
  /** Persists an explicit choice for the signed-in user. Its presence selects `session-first`. */
  readonly persistLocale?: (locale: IGRPLocale) => Promise<void>;
  /** Per-locale overrides of the design-system and chrome catalogs. */
  readonly overrides?: Partial<Record<IGRPLocale, { designSystem?: object; chrome?: object }>>;
}
