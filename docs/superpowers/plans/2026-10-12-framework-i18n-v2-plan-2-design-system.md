# Framework i18n v2, Plan 2 of 5: design-system catalogs in three languages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `@igrp/igrp-framework-react-design-system` complete `pt`, `en` and `fr` string catalogs, a generic deep merge in `IGRPI18nProvider` that accepts a full catalog or overrides, and locale-aware calendar and chart formatting.

**Architecture:** The catalog type `IGRPI18nStrings` is unchanged. `IGRP_I18N_DEFAULTS_PT` becomes the canonical name (the `_PT_PT` export stays as a deprecated alias), `_EN` and `_FR` are added, and a parity test pins their keys and `{token}` arguments to `pt`. The provider's 28-group hand-written merge is replaced by one generic deep merge. `useIGRPLocale()` feeds the calendar's date-fns locale and the chart tooltip's number formatting.

**Tech Stack:** React 19, TypeScript 6, Vitest 5 + jsdom + Testing Library, date-fns 4 (peer), react-day-picker 9, Babel build, ESLint + Prettier.

**Spec:** `docs/superpowers/specs/2026-10-12-framework-i18n-v2-design.md` (section "design-system").

**Series:** Plan 1 auth/types → **Plan 2 (this)** → Plan 3 next-ui → Plan 4 framework-next + i18n-tools → Plan 5 template + migration.

## Global Constraints

- Strings keep the `{token}` format (`igrpFormatMessage`); no ICU, no plurals. Plural-sensitive wording is phrased so one form fits all counts.
- `IGRP_DEFAULT_LOCALE` stays `"pt-PT"`: it is the design system's standalone default; the framework passes the deployment's format locale through the `locale` prop.
- Relative imports in this package carry `.js` (`check:dist` enforces it on declarations).
- Every file that renders design-system components already has `"use client"`; new modules under `src/i18n/` that export only data have no directive.
- ESLint + Prettier (`pnpm lint`, `pnpm format`) before commit; never Biome.
- Changeset `patch` for `@igrp/igrp-framework-react-design-system`.

## Review Focus

1. A consumer passing a **full** catalog object (every group, every key) must get exactly that object back, not a merge over pt. Test in Task 2.
2. An override containing a group key the type does not know (a stale consumer) must be ignored, not spread into the result. Test in Task 2.
3. A format locale the calendar map does not know (`de-DE`) must fall back to react-day-picker's default (`undefined`), never throw. Test in Task 3.
4. The chart tooltip must format with the provider's locale on both server and client, so hydration never mismatches: the test renders with `locale="en-GB"` and asserts `1,234.5`. Test in Task 3.
5. `en` and `fr` must have no key that `pt` lacks and no `{token}` that `pt` lacks, in either direction; a translator who drops `{count}` fails the build. Test in Task 1.

---

### Task 1: `_PT`, `_EN`, `_FR` catalogs and the parity test

**Files:**
- Modify: `packages/design-system/src/i18n/strings.ts` (rename the constant, keep the alias)
- Create: `packages/design-system/src/i18n/strings.en.ts`
- Create: `packages/design-system/src/i18n/strings.fr.ts`
- Create: `packages/design-system/src/i18n/__tests__/parity.test.ts`

**Interfaces:**
- Produces: `IGRP_I18N_DEFAULTS_PT`, `IGRP_I18N_DEFAULTS_EN`, `IGRP_I18N_DEFAULTS_FR: IGRPI18nStrings`; `IGRP_I18N_DEFAULTS_PT_PT` (deprecated alias of `_PT`). Plan 4 selects one of the three by locale.

- [ ] **Step 1: Write the parity test**

`packages/design-system/src/i18n/__tests__/parity.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { IGRP_I18N_DEFAULTS_PT, type IGRPI18nStrings } from "../strings.js"
import { IGRP_I18N_DEFAULTS_EN } from "../strings.en.js"
import { IGRP_I18N_DEFAULTS_FR } from "../strings.fr.js"

/** `group.key` → value, for every leaf. */
function flatten(catalog: IGRPI18nStrings): Map<string, string> {
  const out = new Map<string, string>()
  for (const [group, strings] of Object.entries(catalog)) {
    for (const [key, value] of Object.entries(strings as Record<string, string>)) {
      out.set(`${group}.${key}`, value)
    }
  }
  return out
}

/** Sorted `{token}` names used by a message. */
function tokens(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort()
}

const PT = flatten(IGRP_I18N_DEFAULTS_PT)

describe.each([
  ["en", IGRP_I18N_DEFAULTS_EN],
  ["fr", IGRP_I18N_DEFAULTS_FR],
] as const)("%s catalog parity with pt", (_locale, catalog) => {
  const flat = flatten(catalog)

  it("has exactly the pt keys", () => {
    expect([...flat.keys()].sort()).toEqual([...PT.keys()].sort())
  })

  it("uses the same {token} arguments as pt for every key", () => {
    for (const [key, ptValue] of PT) {
      expect(tokens(flat.get(key) ?? ""), key).toEqual(tokens(ptValue))
    }
  })

  it("has no empty or non-string value", () => {
    for (const [key, value] of flat) {
      expect(typeof value, key).toBe("string")
      expect(value.trim().length, key).toBeGreaterThan(0)
    }
  })
})

describe("deprecated alias", () => {
  it("IGRP_I18N_DEFAULTS_PT_PT is the same object as IGRP_I18N_DEFAULTS_PT", async () => {
    const { IGRP_I18N_DEFAULTS_PT_PT } = await import("../strings.js")
    expect(IGRP_I18N_DEFAULTS_PT_PT).toBe(IGRP_I18N_DEFAULTS_PT)
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/i18n/__tests__/parity.test.ts`
Expected: FAIL. `strings.en.js` / `strings.fr.js` cannot be resolved; `IGRP_I18N_DEFAULTS_PT` is not exported.

- [ ] **Step 3: Rename the pt constant and keep the alias**

In `packages/design-system/src/i18n/strings.ts` rename the declaration `export const IGRP_I18N_DEFAULTS_PT_PT: IGRPI18nStrings = {` to `export const IGRP_I18N_DEFAULTS_PT: IGRPI18nStrings = {` and update its JSDoc to:

```ts
/**
 * Default string catalog (Portuguese). `IGRP_I18N_DEFAULTS_EN` and
 * `IGRP_I18N_DEFAULTS_FR` are the other platform languages; the parity test
 * keeps the three in step. Consumers wrap their app tree in
 * `IGRPI18nProvider` to pick a catalog or override keys.
 */
```

Append after the catalog:

```ts
/** @deprecated Renamed to {@link IGRP_I18N_DEFAULTS_PT}. Same object; removed in the next minor. */
export const IGRP_I18N_DEFAULTS_PT_PT: IGRPI18nStrings = IGRP_I18N_DEFAULTS_PT
```

Also update the file-header comment ("update `IGRP_I18N_DEFAULTS_PT_PT` with the pt-PT default") to: "add the key here, give it a value in `IGRP_I18N_DEFAULTS_PT`, `strings.en.ts` and `strings.fr.ts` (the parity test fails until all three have it), and call `useIGRPi18n()` from the consuming component."

- [ ] **Step 4: Write the English catalog**

`packages/design-system/src/i18n/strings.en.ts`:

```ts
import type { IGRPI18nStrings } from "./strings.js"

/** English catalog. Keys and `{token}` arguments are pinned to `IGRP_I18N_DEFAULTS_PT` by the parity test. */
export const IGRP_I18N_DEFAULTS_EN: IGRPI18nStrings = {
  dataTable: {
    clearFilters: "Clear",
    notFound: "No records found.",
    filterLabel: "Filter",
    clearFilter: "Clear filter",
    sortLabel: "Sort",
    sortAscending: "Sort ascending",
    sortAscendingShort: "Ascending",
    sortDescending: "Sort descending",
    sortDescendingShort: "Descending",
    selectAll: "Select all",
    selectRow: "Select row",
    toggleRow: "Toggle row",
    openActions: "Open actions",
    toggleColumns: "Toggle columns",
    view: "View",
    firstPage: "Go to first page",
    previousPage: "Go to previous page",
    nextPage: "Go to next page",
    lastPage: "Go to last page",
    resultsPerPage: "Results per page",
    resultsPerPagePlaceholder: "Select number of results",
    perPageSuffix: "/ page",
    filterDatePlaceholder: "Select date…",
    filterSelectPlaceholder: "Select…",
    filterSearchPlaceholder: "Search…",
    filterNoResults: "No results found.",
  },
  inputPhone: {
    placeholder: "Enter the phone number",
    selectCountry: "Select country",
    countrySelectorLabel: "Select country",
  },
  inputPassword: {
    showPasswordLabel: "Show password",
    hidePasswordLabel: "Hide password",
  },
  inputNumber: {
    incrementLabel: "Increase",
    decrementLabel: "Decrease",
    invalidValueMessage: "Enter a valid number",
  },
  inputColor: {
    pickerLabel: "Colour picker",
    valueLabel: "Colour value",
    formatSelectorLabel: "Colour format",
    invalidValueMessage: "Enter a valid colour",
  },
  button: {
    loadingText: "Loading…",
  },
  datePicker: {
    clear: "Clear date",
    open: "Select date",
    placeholder: "Select date",
  },
  inputSelect: {
    searchPlaceholder: "Search...",
    searchLabel: "Search options",
    clearSearch: "Clear search",
  },
  inputUrl: {
    protocolLabel: "Protocol",
  },
  combobox: {
    notFound: "No item found.",
    searchPlaceholder: "Search...",
  },
  multiSelect: {
    placeholder: "Select options",
    searchPlaceholder: "Search...",
    notFound: "No option found.",
    selectedCount: "{count} options selected",
    tally: "{count} of {total}",
    tallyMax: " (max. {max})",
    selectAll: "Select all",
    clear: "Clear",
    removeChip: "Remove {label}",
  },
  radioGroup: {
    empty: "No options available.",
  },
  alertDialog: {
    action: "Continue",
    cancel: "Cancel",
  },
  banner: {
    dismiss: "Dismiss",
    learnMore: "Learn more",
    accept: "Accept",
    decline: "Decline",
  },
  notification: {
    close: "Close notification",
  },
  modalDialog: {
    close: "Close",
  },
  avatar: {
    iconIndicator: "Indicator",
  },
  chat: {
    messagePlaceholder: "Write your message…",
    sendMessage: "Send message",
    errorMessage: "Something went wrong. Please try again.",
  },
  imageCropper: {
    zoomSlider: "Zoom",
    crop: "Crop",
  },
  stepper: {
    processSteps: "Process steps",
    scrollPrevious: "Show previous steps",
    scrollNext: "Show next steps",
  },
  tabs: {
    scrollLeft: "Scroll tabs left",
    scrollRight: "Scroll tabs right",
  },
  pageHeader: {
    back: "Back",
  },
  pdfViewer: {
    loadError: "The PDF could not be loaded",
    notFound: "No file found",
  },
  form: {
    submissionErrorTitle: "Error submitting the form",
    submissionErrorFallback: "An unexpected error occurred",
  },
  formList: {
    addItem: "Add",
    removeItem: "Remove item {index}",
  },
  inputFile: {
    dropzoneLabel: "Drag files here or click to select",
    dropzoneHint: "Accepted types",
    removeFile: "Remove {name}",
    removeAllFiles: "Remove all",
    dragActive: "Drop the files here",
    dragReject: "Some files will be rejected",
    maxSize: "Max size:",
    maxFiles: "Max files:",
    rejectedTitle: "Upload error",
  },
  copyTo: {
    nothingToCopy: "Nothing to copy",
  },
  richText: {
    placeholder: "Start writing here…",
    variablesHint: "Click a variable to insert it at the cursor position.",
    showMore: "Show more",
    showLess: "Show less",
    toolbar: "Formatting",
    undo: "Undo",
    redo: "Redo",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    strike: "Strikethrough",
    highlight: "Highlight",
    subscript: "Subscript",
    superscript: "Superscript",
    clearFormatting: "Clear formatting",
    heading: "Heading {level}",
    bulletList: "Bulleted list",
    orderedList: "Numbered list",
    blockquote: "Quote",
    indent: "Increase indent",
    outdent: "Decrease indent",
    horizontalRule: "Horizontal rule",
    alignLeft: "Align left",
    alignCenter: "Align centre",
    alignRight: "Align right",
    alignJustify: "Justify",
    link: "Insert link",
    linkUrl: "URL",
    linkApply: "Apply",
    linkRemove: "Remove",
    table: "Table",
    tableInsert: "Insert 3×3 table",
    tableColumnBefore: "Column before",
    tableColumnAfter: "Column after",
    tableDeleteColumn: "Delete column",
    tableRowBefore: "Row before",
    tableRowAfter: "Row after",
    tableDeleteRow: "Delete row",
    tableMergeOrSplit: "Merge / split cells",
    tableDelete: "Delete table",
    specialCharacter: "Special character",
    textColor: "Text colour",
    fontSize: "Text size",
    defaultFormat: "Default",
    colorBlack: "Black",
    colorGray: "Grey",
    colorRed: "Red",
    colorOrange: "Orange",
    colorGreen: "Green",
    colorBlue: "Blue",
    colorPurple: "Purple",
  },
}
```

- [ ] **Step 5: Write the French catalog**

`packages/design-system/src/i18n/strings.fr.ts`:

```ts
import type { IGRPI18nStrings } from "./strings.js"

/** French catalog. Keys and `{token}` arguments are pinned to `IGRP_I18N_DEFAULTS_PT` by the parity test. */
export const IGRP_I18N_DEFAULTS_FR: IGRPI18nStrings = {
  dataTable: {
    clearFilters: "Effacer",
    notFound: "Aucun enregistrement trouvé.",
    filterLabel: "Filtrer",
    clearFilter: "Effacer le filtre",
    sortLabel: "Trier",
    sortAscending: "Trier par ordre croissant",
    sortAscendingShort: "Croissant",
    sortDescending: "Trier par ordre décroissant",
    sortDescendingShort: "Décroissant",
    selectAll: "Tout sélectionner",
    selectRow: "Sélectionner la ligne",
    toggleRow: "Basculer la ligne",
    openActions: "Ouvrir les actions",
    toggleColumns: "Afficher ou masquer les colonnes",
    view: "Affichage",
    firstPage: "Aller à la première page",
    previousPage: "Aller à la page précédente",
    nextPage: "Aller à la page suivante",
    lastPage: "Aller à la dernière page",
    resultsPerPage: "Résultats par page",
    resultsPerPagePlaceholder: "Sélectionner le nombre de résultats",
    perPageSuffix: "/ page",
    filterDatePlaceholder: "Sélectionner une date…",
    filterSelectPlaceholder: "Sélectionner…",
    filterSearchPlaceholder: "Rechercher…",
    filterNoResults: "Aucun résultat trouvé.",
  },
  inputPhone: {
    placeholder: "Saisissez le numéro de téléphone",
    selectCountry: "Sélectionner le pays",
    countrySelectorLabel: "Sélectionner le pays",
  },
  inputPassword: {
    showPasswordLabel: "Afficher le mot de passe",
    hidePasswordLabel: "Masquer le mot de passe",
  },
  inputNumber: {
    incrementLabel: "Augmenter",
    decrementLabel: "Diminuer",
    invalidValueMessage: "Saisissez un nombre valide",
  },
  inputColor: {
    pickerLabel: "Sélecteur de couleur",
    valueLabel: "Valeur de la couleur",
    formatSelectorLabel: "Format de la couleur",
    invalidValueMessage: "Saisissez une couleur valide",
  },
  button: {
    loadingText: "Chargement…",
  },
  datePicker: {
    clear: "Effacer la date",
    open: "Sélectionner une date",
    placeholder: "Sélectionner une date",
  },
  inputSelect: {
    searchPlaceholder: "Rechercher...",
    searchLabel: "Rechercher des options",
    clearSearch: "Effacer la recherche",
  },
  inputUrl: {
    protocolLabel: "Protocole",
  },
  combobox: {
    notFound: "Aucun élément trouvé.",
    searchPlaceholder: "Rechercher...",
  },
  multiSelect: {
    placeholder: "Sélectionnez des options",
    searchPlaceholder: "Rechercher...",
    notFound: "Aucune option trouvée.",
    selectedCount: "{count} options sélectionnées",
    tally: "{count} sur {total}",
    tallyMax: " (max. {max})",
    selectAll: "Tout sélectionner",
    clear: "Effacer",
    removeChip: "Retirer {label}",
  },
  radioGroup: {
    empty: "Aucune option disponible.",
  },
  alertDialog: {
    action: "Continuer",
    cancel: "Annuler",
  },
  banner: {
    dismiss: "Ignorer",
    learnMore: "En savoir plus",
    accept: "Accepter",
    decline: "Refuser",
  },
  notification: {
    close: "Fermer la notification",
  },
  modalDialog: {
    close: "Fermer",
  },
  avatar: {
    iconIndicator: "Indicateur",
  },
  chat: {
    messagePlaceholder: "Écrivez votre message…",
    sendMessage: "Envoyer le message",
    errorMessage: "Une erreur s'est produite. Veuillez réessayer.",
  },
  imageCropper: {
    zoomSlider: "Zoom",
    crop: "Rogner",
  },
  stepper: {
    processSteps: "Étapes du processus",
    scrollPrevious: "Voir les étapes précédentes",
    scrollNext: "Voir les étapes suivantes",
  },
  tabs: {
    scrollLeft: "Faire défiler les onglets vers la gauche",
    scrollRight: "Faire défiler les onglets vers la droite",
  },
  pageHeader: {
    back: "Retour",
  },
  pdfViewer: {
    loadError: "Impossible de charger le PDF",
    notFound: "Aucun fichier trouvé",
  },
  form: {
    submissionErrorTitle: "Erreur lors de l'envoi du formulaire",
    submissionErrorFallback: "Une erreur inattendue s'est produite",
  },
  formList: {
    addItem: "Ajouter",
    removeItem: "Retirer l'élément {index}",
  },
  inputFile: {
    dropzoneLabel: "Glissez des fichiers ici ou cliquez pour sélectionner",
    dropzoneHint: "Types acceptés",
    removeFile: "Retirer {name}",
    removeAllFiles: "Tout retirer",
    dragActive: "Déposez les fichiers ici",
    dragReject: "Certains fichiers seront refusés",
    maxSize: "Taille max. :",
    maxFiles: "Nombre max. de fichiers :",
    rejectedTitle: "Erreur de téléversement",
  },
  copyTo: {
    nothingToCopy: "Rien à copier",
  },
  richText: {
    placeholder: "Commencez à écrire ici…",
    variablesHint: "Cliquez sur une variable pour l'insérer à la position du curseur.",
    showMore: "Voir plus",
    showLess: "Voir moins",
    toolbar: "Mise en forme",
    undo: "Annuler",
    redo: "Rétablir",
    bold: "Gras",
    italic: "Italique",
    underline: "Souligné",
    strike: "Barré",
    highlight: "Surlignage",
    subscript: "Indice",
    superscript: "Exposant",
    clearFormatting: "Supprimer la mise en forme",
    heading: "Titre {level}",
    bulletList: "Liste à puces",
    orderedList: "Liste numérotée",
    blockquote: "Citation",
    indent: "Augmenter le retrait",
    outdent: "Réduire le retrait",
    horizontalRule: "Ligne horizontale",
    alignLeft: "Aligner à gauche",
    alignCenter: "Centrer",
    alignRight: "Aligner à droite",
    alignJustify: "Justifier",
    link: "Insérer un lien",
    linkUrl: "URL",
    linkApply: "Appliquer",
    linkRemove: "Supprimer",
    table: "Tableau",
    tableInsert: "Insérer un tableau 3×3",
    tableColumnBefore: "Colonne avant",
    tableColumnAfter: "Colonne après",
    tableDeleteColumn: "Supprimer la colonne",
    tableRowBefore: "Ligne avant",
    tableRowAfter: "Ligne après",
    tableDeleteRow: "Supprimer la ligne",
    tableMergeOrSplit: "Fusionner / scinder les cellules",
    tableDelete: "Supprimer le tableau",
    specialCharacter: "Caractère spécial",
    textColor: "Couleur du texte",
    fontSize: "Taille du texte",
    defaultFormat: "Par défaut",
    colorBlack: "Noir",
    colorGray: "Gris",
    colorRed: "Rouge",
    colorOrange: "Orange",
    colorGreen: "Vert",
    colorBlue: "Bleu",
    colorPurple: "Violet",
  },
}
```

- [ ] **Step 6: Run the parity test to see it pass**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/i18n/__tests__/parity.test.ts`
Expected: PASS (7 tests). If a key is reported missing, the `richText` group is the usual culprit: compare against the interface in `strings.ts` line by line.

Run: `pnpm --filter @igrp/igrp-framework-react-design-system typecheck`
Expected: exit 0 (the two new objects satisfy `IGRPI18nStrings`).

- [ ] **Step 7: Commit**

```bash
git add packages/design-system/src/i18n/strings.ts packages/design-system/src/i18n/strings.en.ts packages/design-system/src/i18n/strings.fr.ts packages/design-system/src/i18n/__tests__/parity.test.ts
git commit -m "feat(design-system): English and French string catalogs with a parity test"
```

---

### Task 2: Generic deep merge and full-catalog support in `IGRPI18nProvider`

**Files:**
- Create: `packages/design-system/src/i18n/merge.ts`
- Create: `packages/design-system/src/i18n/__tests__/merge.test.ts`
- Modify: `packages/design-system/src/i18n/context.tsx`
- Modify: `packages/design-system/src/i18n/__tests__/context.test.tsx`

**Interfaces:**
- Produces: `igrpMergeI18nStrings(base: IGRPI18nStrings, override?: IGRPI18nStrings | IGRPI18nStringsOverride): IGRPI18nStrings`; `IGRPI18nProvider` prop `strings?: IGRPI18nStrings | IGRPI18nStringsOverride` and new prop `base?: IGRPI18nStrings` (the catalog overrides merge over; defaults to pt). Plan 4 passes `strings={fullCatalogForLocale}`.

- [ ] **Step 1: Write the failing merge tests**

`packages/design-system/src/i18n/__tests__/merge.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { igrpMergeI18nStrings } from "../merge.js"
import { IGRP_I18N_DEFAULTS_PT } from "../strings.js"
import { IGRP_I18N_DEFAULTS_EN } from "../strings.en.js"

describe("igrpMergeI18nStrings", () => {
  it("returns the base itself when there is no override", () => {
    expect(igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT)).toBe(IGRP_I18N_DEFAULTS_PT)
    expect(igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT, undefined)).toBe(IGRP_I18N_DEFAULTS_PT)
  })

  it("overrides one key and keeps the siblings of that group and every other group", () => {
    const merged = igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT, { dataTable: { notFound: "Nothing here." } })
    expect(merged.dataTable.notFound).toBe("Nothing here.")
    expect(merged.dataTable.clearFilters).toBe(IGRP_I18N_DEFAULTS_PT.dataTable.clearFilters)
    expect(merged.inputPhone).toBe(IGRP_I18N_DEFAULTS_PT.inputPhone)
  })

  it("returns a full catalog unchanged in content (every key wins)", () => {
    const merged = igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT, IGRP_I18N_DEFAULTS_EN)
    expect(merged).toEqual(IGRP_I18N_DEFAULTS_EN)
  })

  it("ignores group keys the base does not have", () => {
    const merged = igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT, {
      dataTable: { notFound: "x" },
      bogusGroup: { any: "y" },
    } as never)
    expect(merged).not.toHaveProperty("bogusGroup")
  })

  it("ignores undefined leaf values so a partial object cannot blank a string", () => {
    const merged = igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT, { button: { loadingText: undefined } })
    expect(merged.button.loadingText).toBe(IGRP_I18N_DEFAULTS_PT.button.loadingText)
  })

  it("does not mutate its inputs", () => {
    const before = JSON.stringify(IGRP_I18N_DEFAULTS_PT)
    igrpMergeI18nStrings(IGRP_I18N_DEFAULTS_PT, { button: { loadingText: "…" } })
    expect(JSON.stringify(IGRP_I18N_DEFAULTS_PT)).toBe(before)
  })
})
```

Add to `packages/design-system/src/i18n/__tests__/context.test.tsx` (inside the existing `describe`), and change its existing `IGRP_I18N_DEFAULTS_PT_PT` imports to `IGRP_I18N_DEFAULTS_PT`:

```tsx
  it("accepts a full catalog as `strings`", async () => {
    const { IGRP_I18N_DEFAULTS_EN } = await import("../strings.en.js")
    render(
      <IGRPI18nProvider strings={IGRP_I18N_DEFAULTS_EN}>
        <StringsProbe keyPath="notFound" />
      </IGRPI18nProvider>
    )
    expect(screen.getByTestId("probe")).toHaveTextContent("No records found.")
  })

  it("merges overrides over an explicit `base` catalog", async () => {
    const { IGRP_I18N_DEFAULTS_FR } = await import("../strings.fr.js")
    render(
      <IGRPI18nProvider base={IGRP_I18N_DEFAULTS_FR} strings={{ dataTable: { notFound: "Rien." } }}>
        <StringsProbe keyPath="notFound" />
        <StringsProbe keyPath="clearFilters" />
      </IGRPI18nProvider>
    )
    const probes = screen.getAllByTestId("probe")
    expect(probes[0]).toHaveTextContent("Rien.")
    expect(probes[1]).toHaveTextContent("Effacer")
  })
```

- [ ] **Step 2: Run both tests to see them fail**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/i18n/__tests__/merge.test.ts src/i18n/__tests__/context.test.tsx`
Expected: FAIL. `merge.js` does not exist; `base` is not a prop.

- [ ] **Step 3: Implement the merge**

`packages/design-system/src/i18n/merge.ts`:

```ts
import type { IGRPI18nStrings, IGRPI18nStringsOverride } from "./strings.js"

/**
 * Merges `override` over `base`, group by group, key by key.
 *
 * Generic over the groups of `base`, so adding a group to `IGRPI18nStrings`
 * needs no change here (the provider used to list all 28 groups by hand).
 * Groups unknown to `base` are dropped; `undefined` leaves keep the base
 * value; neither input is mutated. Without an override the base is returned
 * as-is, so the provider's `useMemo` identity is stable.
 */
export function igrpMergeI18nStrings(
  base: IGRPI18nStrings,
  override?: IGRPI18nStrings | IGRPI18nStringsOverride
): IGRPI18nStrings {
  if (!override) return base
  const result = { ...base } as Record<string, Record<string, string>>
  for (const group of Object.keys(base) as (keyof IGRPI18nStrings)[]) {
    const patch = (override as Record<string, Record<string, string | undefined> | undefined>)[group]
    if (!patch) continue
    const merged: Record<string, string> = { ...base[group] }
    for (const [key, value] of Object.entries(patch)) {
      if (typeof value === "string") merged[key] = value
    }
    result[group] = merged
  }
  return result as unknown as IGRPI18nStrings
}
```

- [ ] **Step 4: Use it in the provider**

Replace the body of `packages/design-system/src/i18n/context.tsx` from the imports down to the `return` of `IGRPI18nProvider` with:

```tsx
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
  children: ReactNode
}) {
  const merged = useMemo(() => igrpMergeI18nStrings(base, strings), [base, strings])

  return (
    <IGRPLocaleContext.Provider value={locale}>
      <IGRPI18nContext.Provider value={merged}>{children}</IGRPI18nContext.Provider>
    </IGRPLocaleContext.Provider>
  )
}
```

Keep the `"use client"` directive, the leading comments, `useIGRPi18n`, `useIGRPLocale`, `igrpFormatMessage` and the final `export` line unchanged. Update the `useIGRPi18n` JSDoc to say "Returns the Portuguese defaults if no provider is mounted".

- [ ] **Step 5: Run the tests to see them pass**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/i18n`
Expected: PASS for parity, merge and context suites.

- [ ] **Step 6: Commit**

```bash
git add packages/design-system/src/i18n/merge.ts packages/design-system/src/i18n/context.tsx packages/design-system/src/i18n/__tests__/merge.test.ts packages/design-system/src/i18n/__tests__/context.test.tsx
git commit -m "feat(design-system): generic catalog merge; IGRPI18nProvider accepts a full catalog and a base"
```

---

### Task 3: Calendar and chart follow `useIGRPLocale()`

**Files:**
- Create: `packages/design-system/src/i18n/date-fns-locale.ts`
- Create: `packages/design-system/src/i18n/__tests__/date-fns-locale.test.ts`
- Modify: `packages/design-system/src/components/primitives/calendar.tsx`
- Modify: `packages/design-system/src/components/primitives/chart.tsx`
- Create: `packages/design-system/src/components/primitives/__tests__/chart-locale.test.tsx`

**Interfaces:**
- Produces: `igrpDateFnsLocale(tag: string): Locale | undefined` (date-fns `Locale`).

- [ ] **Step 1: Write the failing tests**

`packages/design-system/src/i18n/__tests__/date-fns-locale.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { enGB, enUS, fr, frCA, pt, ptBR } from "date-fns/locale"

import { igrpDateFnsLocale } from "../date-fns-locale.js"

describe("igrpDateFnsLocale", () => {
  it("maps exact tags first", () => {
    expect(igrpDateFnsLocale("pt-BR")).toBe(ptBR)
    expect(igrpDateFnsLocale("en-US")).toBe(enUS)
    expect(igrpDateFnsLocale("fr-CA")).toBe(frCA)
  })

  it("maps by language when the region is unknown", () => {
    expect(igrpDateFnsLocale("pt-CV")).toBe(pt)
    expect(igrpDateFnsLocale("pt-PT")).toBe(pt)
    expect(igrpDateFnsLocale("en-GB")).toBe(enGB)
    expect(igrpDateFnsLocale("en-IE")).toBe(enGB)
    expect(igrpDateFnsLocale("fr-FR")).toBe(fr)
    expect(igrpDateFnsLocale("fr")).toBe(fr)
  })

  it("is case-insensitive and accepts underscores", () => {
    expect(igrpDateFnsLocale("PT_br")).toBe(ptBR)
  })

  it("returns undefined for a language the platform does not ship", () => {
    expect(igrpDateFnsLocale("de-DE")).toBeUndefined()
    expect(igrpDateFnsLocale("")).toBeUndefined()
  })
})
```

`packages/design-system/src/components/primitives/__tests__/chart-locale.test.tsx`:

```tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { IGRPI18nProvider } from "../../../i18n/context.js"
import { ChartTooltipContent } from "../chart.js"

// Recharts hands the tooltip its payload; render the content directly with one.
const payload = [{ name: "sales", value: 1234.5, color: "#000", dataKey: "sales", payload: {} }] as never

describe("ChartTooltipContent number formatting", () => {
  it("formats with the design-system locale (en-GB)", () => {
    render(
      <IGRPI18nProvider locale="en-GB">
        <ChartTooltipContent active payload={payload} />
      </IGRPI18nProvider>
    )
    expect(screen.getByText("1,234.5")).toBeInTheDocument()
  })

  it("formats with pt-PT when no provider is mounted", () => {
    render(<ChartTooltipContent active payload={payload} />)
    expect(screen.getByText((1234.5).toLocaleString("pt-PT"))).toBeInTheDocument()
  })
})
```

If `ChartTooltipContent` requires a `ChartContainer` context, wrap both renders in `<ChartContainer config={{ sales: { label: "Sales" } }}>` from the same module; the assertion is unchanged.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/i18n/__tests__/date-fns-locale.test.ts src/components/primitives/__tests__/chart-locale.test.tsx`
Expected: FAIL. `date-fns-locale.js` missing; the chart renders the runtime locale, not `en-GB`.

- [ ] **Step 3: Implement the mapping**

`packages/design-system/src/i18n/date-fns-locale.ts`:

```ts
import { enGB, enUS, fr, frCA, pt, ptBR, type Locale } from "date-fns/locale"

/** Region-specific date-fns locales, matched on the whole tag first. */
const EXACT: Record<string, Locale> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "fr-CA": frCA,
}

/** Fallback per language for every other region (`pt-CV`, `en-GB`, `fr-FR`, …). */
const BY_LANGUAGE: Record<string, Locale> = {
  pt,
  en: enGB,
  fr,
}

/**
 * date-fns locale for a BCP-47 tag, used by the calendar when no `locale`
 * prop is given. Exact tag first, then language; `undefined` for a language
 * the platform does not ship, which lets react-day-picker use its default.
 */
export function igrpDateFnsLocale(tag: string): Locale | undefined {
  const [language = "", region] = tag.split(/[-_]/)
  const lang = language.toLowerCase()
  if (!lang) return undefined
  if (region) {
    const exact = EXACT[`${lang}-${region.toUpperCase()}`]
    if (exact) return exact
  }
  return BY_LANGUAGE[lang]
}
```

- [ ] **Step 4: Wire the calendar**

In `packages/design-system/src/components/primitives/calendar.tsx`, add imports:

```ts
import { useIGRPLocale } from "../../i18n/context.js"
import { igrpDateFnsLocale } from "../../i18n/date-fns-locale.js"
```

Inside `Calendar`, before `const defaultClassNames = getDefaultClassNames()`:

```ts
  // The design-system locale (`pt-PT` unless an IGRPI18nProvider says otherwise)
  // drives month names and weekday labels when the consumer passes no `locale`.
  const igrpLocale = useIGRPLocale()
  const resolvedLocale = locale ?? igrpDateFnsLocale(igrpLocale)
```

Then replace every use of `locale` below in that component with `resolvedLocale`: the `locale={locale}` prop on `DayPicker`, `formatMonthDropdown`'s `locale?.code`, and `DayButton: ({ ...props }) => <CalendarDayButton locale={resolvedLocale} {...props} />`. `CalendarDayButton` itself is unchanged.

- [ ] **Step 5: Wire the chart tooltip**

In `packages/design-system/src/components/primitives/chart.tsx`, add `import { useIGRPLocale } from "../../i18n/context.js"`. In the component that renders the tooltip rows (`ChartTooltipContent`), add `const locale = useIGRPLocale()` next to its other hooks, and change the value cell to:

```tsx
{typeof item.value === "number" ? item.value.toLocaleString(locale) : String(item.value)}
```

- [ ] **Step 6: Run the tests to see them pass**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system exec vitest run src/i18n src/components/primitives/__tests__/chart-locale.test.tsx`
Expected: PASS.

Run the existing calendar/date-picker suites to confirm nothing regressed: `pnpm --filter @igrp/igrp-framework-react-design-system test`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add packages/design-system/src/i18n/date-fns-locale.ts packages/design-system/src/i18n/__tests__/date-fns-locale.test.ts packages/design-system/src/components/primitives/calendar.tsx packages/design-system/src/components/primitives/chart.tsx packages/design-system/src/components/primitives/__tests__/chart-locale.test.tsx
git commit -m "feat(design-system): calendar and chart tooltip follow useIGRPLocale()"
```

---

### Task 4: Exports, docs, changeset, build

**Files:**
- Modify: `packages/design-system/src/i18n/index.ts`
- Modify: `packages/design-system/src/index.ts` (the `// i18n` export block, around line 921)
- Modify: `packages/design-system/COMPONENTS.md`
- Create: `.changeset/design-system-i18n-catalogs.md`

- [ ] **Step 1: Export the new symbols**

`packages/design-system/src/i18n/index.ts`:

```ts
export { IGRPI18nProvider, useIGRPi18n, useIGRPLocale, igrpFormatMessage } from "./context.js"
export { igrpMergeI18nStrings } from "./merge.js"
export { igrpDateFnsLocale } from "./date-fns-locale.js"
export {
  IGRP_DEFAULT_LOCALE,
  IGRP_I18N_DEFAULTS_PT,
  IGRP_I18N_DEFAULTS_PT_PT,
  type IGRPI18nStrings,
  type IGRPI18nStringsOverride,
} from "./strings.js"
export { IGRP_I18N_DEFAULTS_EN } from "./strings.en.js"
export { IGRP_I18N_DEFAULTS_FR } from "./strings.fr.js"
```

In `packages/design-system/src/index.ts`, replace the `// i18n` block with:

```ts
// i18n

export {
  IGRPI18nProvider,
  useIGRPi18n,
  useIGRPLocale,
  igrpFormatMessage,
  igrpMergeI18nStrings,
  igrpDateFnsLocale,
  IGRP_DEFAULT_LOCALE,
  IGRP_I18N_DEFAULTS_PT,
  IGRP_I18N_DEFAULTS_EN,
  IGRP_I18N_DEFAULTS_FR,
  IGRP_I18N_DEFAULTS_PT_PT,
  type IGRPI18nStrings,
  type IGRPI18nStringsOverride,
} from "./i18n/index.js"
```

- [ ] **Step 2: Document**

Append to `packages/design-system/COMPONENTS.md`:

```md
## Strings and locale (`IGRPI18nProvider`)

Every user-visible default string comes from one typed catalog, `IGRPI18nStrings`, shipped in Portuguese (`IGRP_I18N_DEFAULTS_PT`), English (`IGRP_I18N_DEFAULTS_EN`) and French (`IGRP_I18N_DEFAULTS_FR`). Mount `IGRPI18nProvider` once, near the root:

- `strings`: a full catalog, or a deep-partial override merged over `base` (pt by default).
- `locale`: the BCP-47 tag for `Intl` formatting, the calendar's date-fns locale and chart numbers. Always region-qualified (`pt-CV`, not `pt`).

Component label props still win over the provider. Strings use `{token}` placeholders substituted by `igrpFormatMessage`; there are no plurals, so wording must fit any count. Adding a key means adding it to the interface and to all three catalogs; `src/i18n/__tests__/parity.test.ts` fails otherwise. `IGRP_I18N_DEFAULTS_PT_PT` is a deprecated alias of `_PT`.
```

- [ ] **Step 3: Changeset**

`.changeset/design-system-i18n-catalogs.md`:

```md
---
'@igrp/igrp-framework-react-design-system': patch
---

i18n: English and French string catalogs (`IGRP_I18N_DEFAULTS_EN`, `IGRP_I18N_DEFAULTS_FR`) with a parity test against `IGRP_I18N_DEFAULTS_PT` (the renamed `_PT_PT`, kept as a deprecated alias). `IGRPI18nProvider` accepts a full catalog or a partial override (`strings`) over a `base`, merged generically. The calendar's date-fns locale and the chart tooltip's number formatting follow `useIGRPLocale()`.
```

- [ ] **Step 4: Lint, build, downstream check**

Run: `pnpm --filter @igrp/igrp-framework-react-design-system format && pnpm --filter @igrp/igrp-framework-react-design-system lint && pnpm --filter @igrp/igrp-framework-react-design-system typecheck && pnpm --filter @igrp/igrp-framework-react-design-system test && pnpm --filter @igrp/igrp-framework-react-design-system build`
Expected: all exit 0; `check:dist` passes.

Run: `pnpm build:framework`
Expected: exit 0 (`next-ui` and `next` still compile against the new exports; `IGRP_I18N_DEFAULTS_PT_PT` keeps their current imports valid).

- [ ] **Step 5: Commit**

```bash
git add packages/design-system/src/i18n/index.ts packages/design-system/src/index.ts packages/design-system/COMPONENTS.md .changeset/design-system-i18n-catalogs.md
git commit -m "feat(design-system): export the i18n catalogs, merge and date-fns locale helpers"
```

---

## Self-review

- Spec coverage: three canonical catalogs with the deprecated alias; provider accepts full and partial (`base` makes the partial case explicit); generic deep merge; `{token}` format kept; chart `toLocaleString(locale)`; calendar date-fns mapping with exact-then-language order; parity test; docs. All present.
- Type consistency: `igrpMergeI18nStrings(base, override?)` is the signature used in `context.tsx` and the tests; `igrpDateFnsLocale(tag)` used by `calendar.tsx` and its test.
- Review Focus 1 to 5: tests in Tasks 2, 2, 3, 3 and 1 respectively.
