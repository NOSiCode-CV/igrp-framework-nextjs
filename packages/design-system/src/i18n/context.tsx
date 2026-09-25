"use client"
// The hook and the provider are colocated intentionally: the React context they
// share is module-private, so splitting them across files would require exporting
// the context object as public API. Fast-refresh's "components only" rule doesn't
// apply here.
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useMemo, type ReactNode } from "react"

import {
  IGRP_DEFAULT_LOCALE,
  IGRP_I18N_DEFAULTS_PT_PT,
  type IGRPI18nStrings,
  type IGRPI18nStringsOverride,
} from "./strings.js"

const IGRPI18nContext = createContext<IGRPI18nStrings>(IGRP_I18N_DEFAULTS_PT_PT)
const IGRPLocaleContext = createContext<string>(IGRP_DEFAULT_LOCALE)

/**
 * Provider for IGRP design-system user-facing strings. Wrap your app tree (typically
 * just inside `IGRPRootProviders`) to override the pt-PT defaults.
 *
 * Overrides are merged shallowly per component group, so you only need to provide
 * the keys you want to change:
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
  locale = IGRP_DEFAULT_LOCALE,
  children,
}: {
  /** Partial override of the default catalog. Missing keys fall back to pt-PT. */
  strings?: IGRPI18nStringsOverride
  /**
   * BCP-47 tag used for `Intl` number/date formatting inside the design system.
   * Defaults to `pt-PT`, matching the string catalog. Must be explicit and stable
   * across server and client — see {@link IGRP_DEFAULT_LOCALE}.
   */
  locale?: string
  children: ReactNode
}) {
  const merged = useMemo<IGRPI18nStrings>(() => {
    if (!strings) return IGRP_I18N_DEFAULTS_PT_PT
    return {
      dataTable: { ...IGRP_I18N_DEFAULTS_PT_PT.dataTable, ...strings.dataTable },
      inputPhone: { ...IGRP_I18N_DEFAULTS_PT_PT.inputPhone, ...strings.inputPhone },
      inputPassword: { ...IGRP_I18N_DEFAULTS_PT_PT.inputPassword, ...strings.inputPassword },
      inputNumber: { ...IGRP_I18N_DEFAULTS_PT_PT.inputNumber, ...strings.inputNumber },
      inputColor: { ...IGRP_I18N_DEFAULTS_PT_PT.inputColor, ...strings.inputColor },
      inputSelect: { ...IGRP_I18N_DEFAULTS_PT_PT.inputSelect, ...strings.inputSelect },
      inputUrl: { ...IGRP_I18N_DEFAULTS_PT_PT.inputUrl, ...strings.inputUrl },
      button: { ...IGRP_I18N_DEFAULTS_PT_PT.button, ...strings.button },
      datePicker: { ...IGRP_I18N_DEFAULTS_PT_PT.datePicker, ...strings.datePicker },
      combobox: { ...IGRP_I18N_DEFAULTS_PT_PT.combobox, ...strings.combobox },
      multiSelect: { ...IGRP_I18N_DEFAULTS_PT_PT.multiSelect, ...strings.multiSelect },
      radioGroup: { ...IGRP_I18N_DEFAULTS_PT_PT.radioGroup, ...strings.radioGroup },
      alertDialog: { ...IGRP_I18N_DEFAULTS_PT_PT.alertDialog, ...strings.alertDialog },
      banner: { ...IGRP_I18N_DEFAULTS_PT_PT.banner, ...strings.banner },
      notification: { ...IGRP_I18N_DEFAULTS_PT_PT.notification, ...strings.notification },
      avatar: { ...IGRP_I18N_DEFAULTS_PT_PT.avatar, ...strings.avatar },
      chat: { ...IGRP_I18N_DEFAULTS_PT_PT.chat, ...strings.chat },
      imageCropper: { ...IGRP_I18N_DEFAULTS_PT_PT.imageCropper, ...strings.imageCropper },
      stepper: { ...IGRP_I18N_DEFAULTS_PT_PT.stepper, ...strings.stepper },
      tabs: { ...IGRP_I18N_DEFAULTS_PT_PT.tabs, ...strings.tabs },
      pageHeader: { ...IGRP_I18N_DEFAULTS_PT_PT.pageHeader, ...strings.pageHeader },
      pdfViewer: { ...IGRP_I18N_DEFAULTS_PT_PT.pdfViewer, ...strings.pdfViewer },
      form: { ...IGRP_I18N_DEFAULTS_PT_PT.form, ...strings.form },
      formList: { ...IGRP_I18N_DEFAULTS_PT_PT.formList, ...strings.formList },
      inputFile: { ...IGRP_I18N_DEFAULTS_PT_PT.inputFile, ...strings.inputFile },
      copyTo: { ...IGRP_I18N_DEFAULTS_PT_PT.copyTo, ...strings.copyTo },
      richText: { ...IGRP_I18N_DEFAULTS_PT_PT.richText, ...strings.richText },
    }
  }, [strings])

  return (
    <IGRPLocaleContext.Provider value={locale}>
      <IGRPI18nContext.Provider value={merged}>{children}</IGRPI18nContext.Provider>
    </IGRPLocaleContext.Provider>
  )
}

/** Read the resolved IGRP string catalog. Returns pt-PT defaults if no provider is mounted. */
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

/** Substitutes `{token}` placeholders in a catalog string. */
function igrpFormatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = values[key]
    return value === undefined ? match : String(value)
  })
}

export { IGRPI18nProvider, useIGRPi18n, useIGRPLocale, igrpFormatMessage }
