"use client"
// The hook and the provider are colocated intentionally: the React context they
// share is module-private, so splitting them across files would require exporting
// the context object as public API. Fast-refresh's "components only" rule doesn't
// apply here.
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useMemo, type ReactNode } from "react"

import {
  IGRP_I18N_DEFAULTS_PT_PT,
  type IGRPI18nStrings,
  type IGRPI18nStringsOverride,
} from "./strings"

const IGRPI18nContext = createContext<IGRPI18nStrings>(IGRP_I18N_DEFAULTS_PT_PT)

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
  children,
}: {
  /** Partial override of the default catalog. Missing keys fall back to pt-PT. */
  strings?: IGRPI18nStringsOverride
  children: ReactNode
}) {
  const merged = useMemo<IGRPI18nStrings>(() => {
    if (!strings) return IGRP_I18N_DEFAULTS_PT_PT
    return {
      dataTable: { ...IGRP_I18N_DEFAULTS_PT_PT.dataTable, ...strings.dataTable },
      inputPhone: { ...IGRP_I18N_DEFAULTS_PT_PT.inputPhone, ...strings.inputPhone },
      inputPassword: { ...IGRP_I18N_DEFAULTS_PT_PT.inputPassword, ...strings.inputPassword },
      inputNumber: { ...IGRP_I18N_DEFAULTS_PT_PT.inputNumber, ...strings.inputNumber },
      form: { ...IGRP_I18N_DEFAULTS_PT_PT.form, ...strings.form },
    }
  }, [strings])

  return <IGRPI18nContext.Provider value={merged}>{children}</IGRPI18nContext.Provider>
}

/** Read the resolved IGRP string catalog. Returns pt-PT defaults if no provider is mounted. */
function useIGRPi18n(): IGRPI18nStrings {
  return useContext(IGRPI18nContext)
}

export { IGRPI18nProvider, useIGRPi18n }
