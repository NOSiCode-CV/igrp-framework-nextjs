/**
 * String catalog for IGRP design-system components. Keep keys grouped by component
 * surface so the override surface is discoverable from a single type.
 *
 * To add a string: add the key here, give it a value in `IGRP_I18N_DEFAULTS_PT`,
 * `strings.en.ts` and `strings.fr.ts` (the parity test fails until all three have
 * it), and call `useIGRPi18n()` from the consuming component. Never hardcode a
 * user-visible string directly in a component.
 */
export interface IGRPI18nStrings {
  dataTable: {
    /** aria-label of the row expander while collapsed. */
    expandRow: string
    /** aria-label of the row expander while expanded. */
    collapseRow: string
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
    /** Label of the page-size selector in the paginations. */
    rowsPerPage: string
    /** Word between the visible range and the total, as in "1-50 de 200". */
    rangeOf: string
    /** Numeric pagination summary; tokens: {page}, {total}. */
    pageOf: string
    /** Text of the not-available row sub-component. */
    notAvailable: string
    /** aria-label of the range filter minimum input; token: {label}. */
    /** Placeholder of the min input in a min/max filter. */
    minPlaceholder: string
    /** Placeholder of the max input in a min/max filter. */
    maxPlaceholder: string
    minLabel: string
    /** aria-label of the range filter maximum input; token: {label}. */
    maxLabel: string
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
    /** Default label of the start time field. */
    startDate: string
    /** Default label of the end time field. */
    endDate: string
  }
  inputSelect: {
    /** Trigger text shown with no value and no `placeholder` prop. */
    placeholder: string
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
    /** Trigger text shown with no value and no `placeholder` prop. */
    placeholder: string
    /** Empty-state message when no option matches. */
    notFound: string
    /** Placeholder for the combobox search box. */
    searchPlaceholder: string
    /** Group heading for options without a `group`, when `showGroup` is on. */
    otherGroup: string
  }
  commandDialog: {
    /** Screen-reader title of `CommandDialog` without a `title` prop. */
    title: string
    /** Screen-reader description of `CommandDialog` without a `description` prop. */
    description: string
  }
  multiSelect: {
    /** Trigger text while the selection is empty. */
    placeholder: string
    /** Placeholder for the search box. */
    searchPlaceholder: string
    /** Empty-state message when no option matches the search. */
    notFound: string
    /** Trigger text for a selection of two or more. `{count}` is replaced with its size. */
    selectedCount: string
    /** Footer tally. `{count}` and `{total}` are replaced with the selection and option counts. */
    tally: string
    /** Appended to the tally when a cap is set. `{max}` is replaced with the cap. */
    tallyMax: string
    /** Bulk action that selects every enabled option. */
    selectAll: string
    /** Bulk action that empties the selection. */
    clear: string
    /** Accessible name of a chip's remove button. `{label}` is replaced with the option label. */
    removeChip: string
  }
  radioGroup: {
    /** Shown instead of the options when a radio group has none. */
    empty: string
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
  modalDialog: {
    /** Screen-reader label for the close button. */
    close: string
    /** Screen-reader description when the dialog has no title. */
    contentDescription: string
  }
  avatar: {
    /** aria-label for the decorative status indicator. */
    iconIndicator: string
    /** Fallback alt text of the user avatar image. */
    currentUser: string
    /** aria-label of the status dot; token: {status}. */
    status: string
  }
  chat: {
    /** Heading text above the transcript (`labelDescription` default). */
    description: string
    /** Sender name shown on the user's own messages. */
    you: string
    /** Placeholder for the message composer. */
    messagePlaceholder: string
    /** aria-label for the send button. */
    sendMessage: string
    /** System message shown in the transcript when a request to the endpoint fails. */
    errorMessage: string
    /** Alt text of an image sent in the transcript. */
    sentContent: string
  }
  imageCropper: {
    /** aria-label for the zoom slider. */
    zoomSlider: string
    /** Default crop-button label. */
    crop: string
    /** Alt text of the cropped preview image. */
    croppedResult: string
    /** Placeholder shown before a crop exists. */
    previewPlaceholder: string
  }
  stepper: {
    /** aria-label for the steps navigation region. */
    processSteps: string
    /** aria-label for the scroll-to-previous-steps button. */
    scrollPrevious: string
    /** aria-label for the scroll-to-next-steps button. */
    scrollNext: string
    /** Default text of the visually hidden step title. */
    step: string
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
    /** Default label of the modal's close button. */
    close: string
    /** Default label of the open-in-new-tab button. */
    openInNewTab: string
    /** Message shown when the document fails to load. */
    loadError: string
    /** Message shown when no file is supplied. */
    notFound: string
    /** Title of the embedded PDF frame; token: {name}. */
    viewerTitle: string
    /** aria-label of the embedded PDF frame; token: {name}. */
    viewerLabel: string
  }
  loadingSpinner: {
    /** Default accessible label. */
    label: string
  }
  menuNavigation: {
    /** Default heading of the section nav. */
    title: string
  }
  toast: {
    /** Title of a plain toast with no `title`. */
    title: string
    /** Promise toast: pending message. */
    loading: string
    /** Promise toast: success message when the result isn't a string. */
    success: string
    /** Promise toast: error message when the rejection isn't an Error. */
    error: string
  }
  videoEmbed: {
    /** Shown when `src` is not a valid URL. */
    invalidUrl: string
  }
  table: {
    /** Screen-reader header of the actions column. */
    actions: string
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
    /** Message shown on a successful copy. */
    copied: string
    /** Message shown when copying fails. */
    copyFailed: string
    /** Tooltip text before copying. */
    clickToCopy: string
  }
  richText: {
    /** Editor placeholder while the body is empty. */
    placeholder: string
    /** Hint above the template-variable chips. */
    variablesHint: string
    /** View: expand a body clipped by `maxHeight`. */
    showMore: string
    /** View: collapse an expanded body back to `maxHeight`. */
    showLess: string
    /** Accessible name of the formatting toolbar. */
    toolbar: string
    undo: string
    redo: string
    bold: string
    italic: string
    underline: string
    strike: string
    highlight: string
    subscript: string
    superscript: string
    clearFormatting: string
    /** `{level}` is replaced with 1–3. */
    heading: string
    bulletList: string
    orderedList: string
    blockquote: string
    indent: string
    outdent: string
    horizontalRule: string
    alignLeft: string
    alignCenter: string
    alignRight: string
    alignJustify: string
    /** Link control tooltip and popover title. */
    link: string
    linkUrl: string
    linkApply: string
    linkRemove: string
    table: string
    tableInsert: string
    tableColumnBefore: string
    tableColumnAfter: string
    tableDeleteColumn: string
    tableRowBefore: string
    tableRowAfter: string
    tableDeleteRow: string
    tableMergeOrSplit: string
    tableDelete: string
    specialCharacter: string
    textColor: string
    fontSize: string
    /** Resets colour or font size to the document default. */
    defaultFormat: string
    colorBlack: string
    colorGray: string
    colorRed: string
    colorOrange: string
    colorGreen: string
    colorBlue: string
    colorPurple: string
  }
  dialog: {
    /** Screen-reader label for the close button. */
    close: string
  }
  sheet: {
    /** Screen-reader label for the close button. */
    close: string
  }
  sidebar: {
    /** Accessible name for the sidebar toggle. */
    toggle: string
    /** Screen-reader title of the mobile sidebar sheet. */
    title: string
    /** Screen-reader description of the mobile sidebar sheet. */
    description: string
  }
  carousel: {
    /** Label for the previous control. */
    previous: string
    /** Label for the next control. */
    next: string
  }
  pagination: {
    /** aria-label of the pagination nav. */
    label: string
    /** Screen-reader text of the pagination ellipsis. */
    morePages: string
    /** Label for the previous control. */
    previous: string
    /** Label for the next control. */
    next: string
    /** aria-label for the previous-page link. */
    goToPrevious: string
    /** aria-label for the next-page link. */
    goToNext: string
  }
  breadcrumb: {
    /** Accessible name of the breadcrumb `<nav>`. */
    label: string
    /** Screen-reader text of the breadcrumb ellipsis. */
    more: string
  }
  inputAddons: {
    /** aria-label for the addon select with no `optionLabel`. */
    selectOption: string
  }
}

/**
 * Default string catalog (Portuguese). `IGRP_I18N_DEFAULTS_EN` and
 * `IGRP_I18N_DEFAULTS_FR` are the other platform languages; the parity test
 * keeps the three in step. Consumers wrap their app tree in
 * `IGRPI18nProvider` to pick a catalog or override keys.
 */
export const IGRP_I18N_DEFAULTS_PT: IGRPI18nStrings = {
  dataTable: {
    expandRow: "Expandir detalhes",
    collapseRow: "Recolher detalhes",
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
    rowsPerPage: "Registos por página",
    rangeOf: "de",
    pageOf: "Página {page} de {total}",
    notAvailable: "N/D",
    minPlaceholder: "Mín.",
    maxPlaceholder: "Máx.",
    minLabel: "{label} mín.",
    maxLabel: "{label} máx.",
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
    startDate: "Data Início",
    endDate: "Data Fim",
  },
  inputSelect: {
    placeholder: "Selecionar uma opção",
    searchPlaceholder: "Pesquisar...",
    searchLabel: "Pesquisar opções",
    clearSearch: "Limpar pesquisa",
  },
  inputUrl: {
    protocolLabel: "Protocolo",
  },
  combobox: {
    placeholder: "Selecionar…",
    notFound: "Nenhum item encontrado.",
    searchPlaceholder: "Pesquisar...",
    otherGroup: "Outros",
  },
  commandDialog: {
    title: "Paleta de comandos",
    description: "Pesquise e execute um comando.",
  },
  multiSelect: {
    placeholder: "Selecione as opções",
    searchPlaceholder: "Pesquisar...",
    notFound: "Nenhuma opção encontrada.",
    selectedCount: "{count} opções selecionadas",
    tally: "{count} de {total}",
    tallyMax: " (máx. {max})",
    selectAll: "Selecionar tudo",
    clear: "Limpar",
    removeChip: "Remover {label}",
  },
  radioGroup: {
    empty: "Sem opções disponíveis.",
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
  modalDialog: {
    close: "Fechar",
    contentDescription: "Conteúdo do diálogo",
  },
  avatar: {
    iconIndicator: "Indicador",
    currentUser: "Utilizador atual",
    status: "Estado: {status}",
  },
  chat: {
    description: "Pergunte-me o que quiser!",
    you: "Você",
    messagePlaceholder: "Escreva a sua mensagem…",
    sendMessage: "Enviar mensagem",
    errorMessage: "Ocorreu um erro. Por favor tente novamente.",
    sentContent: "Conteúdo enviado",
  },
  imageCropper: {
    zoomSlider: "Ampliação",
    crop: "Recortar",
    croppedResult: "Resultado recortado",
    previewPlaceholder: "Pré-visualização da imagem",
  },
  stepper: {
    processSteps: "Etapas do processo",
    scrollPrevious: "Ver etapas anteriores",
    scrollNext: "Ver etapas seguintes",
    step: "Passo",
  },
  tabs: {
    scrollLeft: "Deslocar separadores para a esquerda",
    scrollRight: "Deslocar separadores para a direita",
  },
  pageHeader: {
    back: "Voltar",
  },
  pdfViewer: {
    close: "Fechar",
    openInNewTab: "Abrir num novo separador",
    loadError: "Não foi possível carregar o PDF",
    notFound: "Nenhum ficheiro encontrado",
    viewerTitle: "Visualizador de PDF - {name}",
    viewerLabel: "Visualizador de PDF para {name}",
  },
  loadingSpinner: {
    label: "A carregar…",
  },
  menuNavigation: {
    title: "Navegação",
  },
  toast: {
    title: "Notificação",
    loading: "A processar…",
    success: "Operação concluída com sucesso!",
    error: "Ocorreu um erro.",
  },
  videoEmbed: {
    invalidUrl: "URL de vídeo inválido",
  },
  table: {
    actions: "Ações",
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
    copied: "Copiado para a área de transferência",
    copyFailed: "Não foi possível copiar para a área de transferência",
    clickToCopy: "Clique para copiar",
  },
  richText: {
    placeholder: "Comece a escrever aqui…",
    variablesHint: "Clique numa variável para a inserir na posição do cursor.",
    showMore: "Ver mais",
    showLess: "Ver menos",
    toolbar: "Formatação",
    undo: "Desfazer",
    redo: "Refazer",
    bold: "Negrito",
    italic: "Itálico",
    underline: "Sublinhado",
    strike: "Riscado",
    highlight: "Realce",
    subscript: "Subscrito",
    superscript: "Sobrescrito",
    clearFormatting: "Remover formatação",
    heading: "Título {level}",
    bulletList: "Lista com marcas",
    orderedList: "Lista numerada",
    blockquote: "Citação",
    indent: "Aumentar avanço",
    outdent: "Diminuir avanço",
    horizontalRule: "Linha horizontal",
    alignLeft: "Alinhar à esquerda",
    alignCenter: "Alinhar ao centro",
    alignRight: "Alinhar à direita",
    alignJustify: "Justificar",
    link: "Inserir hiperligação",
    linkUrl: "URL",
    linkApply: "Aplicar",
    linkRemove: "Remover",
    table: "Tabela",
    tableInsert: "Inserir tabela 3×3",
    tableColumnBefore: "Coluna antes",
    tableColumnAfter: "Coluna depois",
    tableDeleteColumn: "Eliminar coluna",
    tableRowBefore: "Linha antes",
    tableRowAfter: "Linha depois",
    tableDeleteRow: "Eliminar linha",
    tableMergeOrSplit: "Unir / dividir células",
    tableDelete: "Eliminar tabela",
    specialCharacter: "Carácter especial",
    textColor: "Cor do texto",
    fontSize: "Tamanho do texto",
    defaultFormat: "Predefinido",
    colorBlack: "Preto",
    colorGray: "Cinzento",
    colorRed: "Vermelho",
    colorOrange: "Laranja",
    colorGreen: "Verde",
    colorBlue: "Azul",
    colorPurple: "Roxo",
  },
  dialog: {
    close: "Fechar",
  },
  sheet: {
    close: "Fechar",
  },
  sidebar: {
    toggle: "Alternar barra lateral",
    title: "Barra lateral",
    description: "Mostra a barra lateral em dispositivos móveis.",
  },
  carousel: {
    previous: "Diapositivo anterior",
    next: "Diapositivo seguinte",
  },
  pagination: {
    label: "Paginação",
    morePages: "Mais páginas",
    previous: "Anterior",
    next: "Seguinte",
    goToPrevious: "Ir para a página anterior",
    goToNext: "Ir para a página seguinte",
  },
  breadcrumb: {
    label: "Trilho de navegação",
    more: "Mais",
  },
  inputAddons: {
    selectOption: "Selecionar opção",
  },
}

/** @deprecated Renamed to {@link IGRP_I18N_DEFAULTS_PT}. Same object; removed in the next minor. */
export const IGRP_I18N_DEFAULTS_PT_PT: IGRPI18nStrings = IGRP_I18N_DEFAULTS_PT

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
