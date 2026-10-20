"use client"
// The hook and the provider are colocated intentionally: the React context they
// share is module-private, so splitting them across files would require exporting
// the context object as public API. Fast-refresh's "components only" rule doesn't
// apply here.
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useMemo, type ReactNode } from "react"

import { igrpMergeI18nStrings } from "./merge.js"
import {
  IGRP_DEFAULT_LOCALE,
  IGRP_I18N_DEFAULTS_PT,
  type IGRPI18nStrings,
  type IGRPI18nStringsOverride,
} from "./strings.js"

const IGRPI18nContext = createContext<IGRPI18nStrings>(IGRP_I18N_DEFAULTS_PT)
const IGRPLocaleContext = createContext<string>(IGRP_DEFAULT_LOCALE)
const IGRPTimeZoneContext = createContext<string | undefined>(undefined)

/**
 * Provider for IGRP design-system user-facing strings. Wrap your app tree (typically
 * just inside `IGRPRootProviders`) to pick a catalog or override keys.
 *
 * `strings` may be a full catalog (`IGRP_I18N_DEFAULTS_EN`) or a deep-partial
 * override; overrides merge over `base` (pt by default), so only the keys you
 * change need to be present:
 *
 * ```tsx
 * <IGRPI18nProvider strings={{ dataTable: { notFound: "No records found." } }}>
 *   <App />
 * </IGRPI18nProvider>
 * ```
 *
 * Component-level props (e.g. `<IGRPDataTable notFoundLabel="…" />`) still take
 * precedence over the provider value when supplied — the provider only changes
 * the default a component falls back to.
 */
function IGRPI18nProvider({
  strings,
  base = IGRP_I18N_DEFAULTS_PT,
  locale = IGRP_DEFAULT_LOCALE,
  timeZone,
  children,
}: {
  /** Full catalog or partial override. Missing keys fall back to `base`. */
  strings?: IGRPI18nStrings | IGRPI18nStringsOverride
  /** Catalog that partial overrides merge over. Defaults to Portuguese. */
  base?: IGRPI18nStrings
  /**
   * BCP-47 tag used for `Intl` number/date formatting inside the design system.
   * Defaults to `pt-PT`, matching the string catalog. Must be explicit and stable
   * across server and client — see {@link IGRP_DEFAULT_LOCALE}.
   */
  locale?: string
  /** IANA time zone for `Intl` date formatting. Defaults to the runtime zone when omitted. */
  timeZone?: string
  children: ReactNode
}) {
  const merged = useMemo(() => igrpMergeI18nStrings(base, strings), [base, strings])

  return (
    <IGRPLocaleContext.Provider value={locale}>
      <IGRPTimeZoneContext.Provider value={timeZone}>
        <IGRPI18nContext.Provider value={merged}>{children}</IGRPI18nContext.Provider>
      </IGRPTimeZoneContext.Provider>
    </IGRPLocaleContext.Provider>
  )
}

/** Read the resolved IGRP string catalog. Returns the Portuguese defaults if no provider is mounted. */
function useIGRPi18n(): IGRPI18nStrings {
  return useContext(IGRPI18nContext)
}

/**
 * Read the locale used for `Intl` formatting. Returns {@link IGRP_DEFAULT_LOCALE}
 * if no provider is mounted — never `undefined`, so SSR and client agree.
 */
function useIGRPLocale(): string {
  return useContext(IGRPLocaleContext)
}

/** Read the IANA time zone for `Intl` date formatting. `undefined` means the runtime zone. */
function useIGRPTimeZone(): string | undefined {
  return useContext(IGRPTimeZoneContext)
}

/** Substitutes `{token}` placeholders in a catalog string. */
function igrpFormatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = values[key]
    return value === undefined ? match : String(value)
  })
}

export { IGRPI18nProvider, useIGRPi18n, useIGRPLocale, useIGRPTimeZone, igrpFormatMessage }
