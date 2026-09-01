/**
 * String catalog for IGRP design-system components. Keep keys grouped by component
 * surface so the override surface is discoverable from a single type.
 *
 * To add a string: add the key here, update `IGRP_I18N_DEFAULTS_PT_PT` with the
 * pt-PT default, and call `useIGRPi18n()` from the consuming component. Never
 * hardcode a user-visible string directly in a component.
 */
export interface IGRPI18nStrings {
  dataTable: {
    /** Button label for clearing all filters. */
    clearFilters: string
    /** Empty-state message shown when no rows match. */
    notFound: string
  }
  inputPhone: {
    /** Default placeholder for the phone input. */
    placeholder: string
    /** Native-select default option label. */
    selectCountry: string
    /** aria-label for the country selector. */
    countrySelectorLabel: string
  }
  inputPassword: {
    /** aria-label for the toggle when the password is hidden. */
    showPasswordLabel: string
    /** aria-label for the toggle when the password is visible. */
    hidePasswordLabel: string
  }
  inputNumber: {
    /** aria-label for the increment stepper button. */
    incrementLabel: string
    /** aria-label for the decrement stepper button. */
    decrementLabel: string
    /** Message shown when input doesn't parse as a valid number. */
    invalidValueMessage: string
  }
  form: {
    /** Toast title shown when an onSubmit handler throws (when showToastOnError). */
    submissionErrorTitle: string
    /** Fallback global error message when the thrown error isn't an Error instance. */
    submissionErrorFallback: string
  }
}

/**
 * Default string catalog. pt-PT is the framework default — consumers wrap their
 * app tree in `IGRPI18nProvider` to override.
 */
export const IGRP_I18N_DEFAULTS_PT_PT: IGRPI18nStrings = {
  dataTable: {
    clearFilters: "Limpar",
    notFound: "Nenhum registo encontrado.",
  },
  inputPhone: {
    placeholder: "Introduza o número de telefone",
    selectCountry: "Selecionar país",
    countrySelectorLabel: "Selecionar país",
  },
  inputPassword: {
    showPasswordLabel: "Mostrar palavra-passe",
    hidePasswordLabel: "Ocultar palavra-passe",
  },
  inputNumber: {
    incrementLabel: "Incrementar",
    decrementLabel: "Decrementar",
    invalidValueMessage: "Introduza um número válido",
  },
  form: {
    submissionErrorTitle: "Erro ao submeter formulário",
    submissionErrorFallback: "Ocorreu um erro inesperado",
  },
}

/** Deep-partial of {@link IGRPI18nStrings} — what consumers pass to `IGRPI18nProvider`. */
export type IGRPI18nStringsOverride = {
  [K in keyof IGRPI18nStrings]?: Partial<IGRPI18nStrings[K]>
}
