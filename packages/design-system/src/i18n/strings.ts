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
    /** aria-label for a single column filter trigger. */
    filterLabel: string
    /** aria-label for the per-column clear-filter button. */
    clearFilter: string
    /** Tooltip on the sortable column header button. */
    sortLabel: string
    /** aria-label for the ascending-sort menu item. */
    sortAscending: string
    /** Visible text of the ascending-sort menu item. */
    sortAscendingShort: string
    /** aria-label for the descending-sort menu item. */
    sortDescending: string
    /** Visible text of the descending-sort menu item. */
    sortDescendingShort: string
    /** aria-label for the select-all-rows checkbox. */
    selectAll: string
    /** aria-label for a row-selection checkbox. */
    selectRow: string
    /** aria-label for a row-selection switch. */
    toggleRow: string
    /** aria-label for the per-row actions trigger. */
    openActions: string
    /** Label for the column-visibility menu. */
    toggleColumns: string
    /** Label for the column-visibility trigger button. */
    view: string
    /** aria-label for the first-page button. */
    firstPage: string
    /** aria-label for the previous-page button. */
    previousPage: string
    /** aria-label for the next-page button. */
    nextPage: string
    /** aria-label for the last-page button. */
    lastPage: string
    /** aria-label for the rows-per-page selector. */
    resultsPerPage: string
    /** Placeholder for the rows-per-page selector. */
    resultsPerPagePlaceholder: string
    /** Suffix appended to a page-size option. */
    perPageSuffix: string
    /** Placeholder for the date-range filter trigger. */
    filterDatePlaceholder: string
    /** Placeholder for the faceted and select filter triggers. */
    filterSelectPlaceholder: string
    /** Placeholder for the text filter input. */
    filterSearchPlaceholder: string
    /** Empty-state message inside a faceted filter's option list. */
    filterNoResults: string
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
  inputColor: {
    /** aria-label for the native colour swatch/picker when no visible label is set. */
    pickerLabel: string
    /** aria-label prefix for the colour value text field (the active format is appended). */
    valueLabel: string
    /** aria-label for the colour format selector trigger. */
    formatSelectorLabel: string
    /** Message shown when the typed colour string can't be parsed. */
    invalidValueMessage: string
  }
  button: {
    /** Text shown in place of the label while a button is loading. */
    loadingText: string
  }
  datePicker: {
    /** aria-label for the button that clears the selected date. */
    clear: string
    /** Accessible name for the button that opens the calendar popover. */
    open: string
    /** Placeholder shown by a date picker with no value and no `placeholder` prop. */
    placeholder: string
  }
  inputSelect: {
    /** Placeholder for the in-dropdown search box. */
    searchPlaceholder: string
    /** aria-label for the in-dropdown search box. */
    searchLabel: string
    /** aria-label for the button that clears the search box. */
    clearSearch: string
  }
  inputUrl: {
    /** aria-label for the protocol selector. */
    protocolLabel: string
  }
  combobox: {
    /** Empty-state message when no option matches. */
    notFound: string
    /** Placeholder for the combobox search box. */
    searchPlaceholder: string
  }
  alertDialog: {
    /** Default confirm-button label. */
    action: string
    /** Default cancel-button label. */
    cancel: string
  }
  banner: {
    /** aria-label for the dismiss button. */
    dismiss: string
    /** Default learn-more link label. */
    learnMore: string
    /** Default accept-button label. */
    accept: string
    /** Default decline-button label. */
    decline: string
  }
  notification: {
    /** aria-label for the close button. */
    close: string
  }
  avatar: {
    /** aria-label for the decorative status indicator. */
    iconIndicator: string
  }
  chat: {
    /** Placeholder for the message composer. */
    messagePlaceholder: string
    /** aria-label for the send button. */
    sendMessage: string
    /** System message shown in the transcript when a request to the endpoint fails. */
    errorMessage: string
  }
  imageCropper: {
    /** aria-label for the zoom slider. */
    zoomSlider: string
    /** Default crop-button label. */
    crop: string
  }
  stepper: {
    /** aria-label for the steps navigation region. */
    processSteps: string
    /** aria-label for the scroll-to-previous-steps button. */
    scrollPrevious: string
    /** aria-label for the scroll-to-next-steps button. */
    scrollNext: string
  }
  tabs: {
    /** aria-label for the scroll-tabs-left button. */
    scrollLeft: string
    /** aria-label for the scroll-tabs-right button. */
    scrollRight: string
  }
  pageHeader: {
    /** aria-label for the back button. */
    back: string
  }
  pdfViewer: {
    /** Message shown when the document fails to load. */
    loadError: string
    /** Message shown when no file is supplied. */
    notFound: string
  }
  form: {
    /** Toast title shown when an onSubmit handler throws (when showToastOnError). */
    submissionErrorTitle: string
    /** Fallback global error message when the thrown error isn't an Error instance. */
    submissionErrorFallback: string
  }
  formList: {
    /** Add-item button label. */
    addItem: string
    /**
     * Accessible name of an item's remove button. `{index}` is replaced with the
     * item's 1-based position.
     */
    removeItem: string
  }
  inputFile: {
    /** Drop-zone prompt. */
    dropzoneLabel: string
    /** Prefix for the list of accepted file types. */
    dropzoneHint: string
    /**
     * Accessible name of a file's remove button. `{name}` is replaced with the
     * file name, so each button in the list gets a distinct name.
     */
    removeFile: string
    /** Remove-all-files button label. */
    removeAllFiles: string
    /** Drop-zone label while a valid drag is over it. */
    dragActive: string
    /** Drop-zone label while a drag contains files that would be rejected. */
    dragReject: string
    /** Prefix for the max-file-size constraint. */
    maxSize: string
    /** Prefix for the max-file-count constraint. */
    maxFiles: string
    /** Title of the rejected-files alert. */
    rejectedTitle: string
  }
  copyTo: {
    /** Message shown when there is nothing to copy. */
    nothingToCopy: string
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
    filterLabel: "Filtrar",
    clearFilter: "Limpar filtro",
    sortLabel: "Ordenar",
    sortAscending: "Ordenar ascendente",
    sortAscendingShort: "Ascendente",
    sortDescending: "Ordenar descendente",
    sortDescendingShort: "Descendente",
    selectAll: "Selecionar tudo",
    selectRow: "Selecionar linha",
    toggleRow: "Alternar linha",
    openActions: "Abrir ações",
    toggleColumns: "Alternar colunas",
    view: "Ver",
    firstPage: "Ir para a primeira página",
    previousPage: "Ir para a página anterior",
    nextPage: "Ir para a página seguinte",
    lastPage: "Ir para a última página",
    resultsPerPage: "Resultados por página",
    resultsPerPagePlaceholder: "Selecionar número de resultados",
    perPageSuffix: "/ página",
    filterDatePlaceholder: "Selecionar data…",
    filterSelectPlaceholder: "Selecionar…",
    filterSearchPlaceholder: "Pesquisar…",
    filterNoResults: "Nenhum resultado encontrado.",
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
  inputColor: {
    pickerLabel: "Seletor de cor",
    valueLabel: "Valor da cor",
    formatSelectorLabel: "Formato da cor",
    invalidValueMessage: "Introduza uma cor válida",
  },
  button: {
    loadingText: "A carregar…",
  },
  datePicker: {
    clear: "Limpar data",
    open: "Selecionar data",
    placeholder: "Selecionar data",
  },
  inputSelect: {
    searchPlaceholder: "Pesquisar...",
    searchLabel: "Pesquisar opções",
    clearSearch: "Limpar pesquisa",
  },
  inputUrl: {
    protocolLabel: "Protocolo",
  },
  combobox: {
    notFound: "Nenhum item encontrado.",
    searchPlaceholder: "Pesquisar...",
  },
  alertDialog: {
    action: "Continuar",
    cancel: "Cancelar",
  },
  banner: {
    dismiss: "Dispensar",
    learnMore: "Saber mais",
    accept: "Aceitar",
    decline: "Recusar",
  },
  notification: {
    close: "Fechar notificação",
  },
  avatar: {
    iconIndicator: "Indicador",
  },
  chat: {
    messagePlaceholder: "Escreva a sua mensagem…",
    sendMessage: "Enviar mensagem",
    errorMessage: "Ocorreu um erro. Por favor tente novamente.",
  },
  imageCropper: {
    zoomSlider: "Ampliação",
    crop: "Recortar",
  },
  stepper: {
    processSteps: "Etapas do processo",
    scrollPrevious: "Ver etapas anteriores",
    scrollNext: "Ver etapas seguintes",
  },
  tabs: {
    scrollLeft: "Deslocar separadores para a esquerda",
    scrollRight: "Deslocar separadores para a direita",
  },
  pageHeader: {
    back: "Voltar",
  },
  pdfViewer: {
    loadError: "Não foi possível carregar o PDF",
    notFound: "Nenhum ficheiro encontrado",
  },
  form: {
    submissionErrorTitle: "Erro ao submeter formulário",
    submissionErrorFallback: "Ocorreu um erro inesperado",
  },
  formList: {
    addItem: "Adicionar",
    removeItem: "Remover item {index}",
  },
  inputFile: {
    dropzoneLabel: "Arraste ficheiros aqui ou clique para selecionar",
    dropzoneHint: "Tipos aceites",
    removeFile: "Remover {name}",
    removeAllFiles: "Remover todos",
    dragActive: "Solte os ficheiros aqui",
    dragReject: "Alguns ficheiros serão rejeitados",
    maxSize: "Tamanho máx:",
    maxFiles: "Máx de ficheiros:",
    rejectedTitle: "Erro no upload",
  },
  copyTo: {
    nothingToCopy: "Nenhum conteúdo para copiar",
  },
}

/**
 * Locale used for `Intl` formatting inside the design system (numbers, dates).
 *
 * It has to be an explicit value rather than `undefined`: `undefined` resolves to
 * the *runtime* locale, which is the server's under SSR and the browser's on the
 * client, so any formatted value rendered on both sides hydrates with a mismatch.
 */
export const IGRP_DEFAULT_LOCALE = "pt-PT"

/** Deep-partial of {@link IGRPI18nStrings} — what consumers pass to `IGRPI18nProvider`. */
export type IGRPI18nStringsOverride = {
  [K in keyof IGRPI18nStrings]?: Partial<IGRPI18nStrings[K]>
}
