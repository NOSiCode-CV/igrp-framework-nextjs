---
"@igrp/igrp-framework-react-design-system": patch
---

Route the remaining hardcoded UI strings through the i18n catalog.

The design system shipped a mixed-language UI: ~34 `aria-label`/`placeholder` literals and a dozen default prop values were English, while neighbouring strings in the same files were already pt-PT (`data-table/filter.tsx` had an English `notFoundText` default and a pt-PT `aria-label` in one file). `i18n/strings.ts` states the rule — never hardcode a user-visible string in a component — so this brings the components in line with it.

`IGRPI18nStrings` gains groups for `button`, `datePicker`, `inputSelect`, `inputUrl`, `combobox`, `alertDialog`, `banner`, `notification`, `avatar`, `chat`, `imageCropper`, `stepper`, `tabs`, `pageHeader`, `pdfViewer`, and `dataTable` is extended with sorting, selection, pagination and column-visibility strings. All are overridable through `IGRPI18nProvider`.

**Behavioural:** components that previously rendered English now render pt-PT by default — the data-table pagination and sorting controls, the column-visibility menu, the password/date-picker/select/url/stepper/tabs aria-labels, `IGRPButton`'s loading text, and the `IGRPAlertDialog` / `IGRPBanner` / `IGRPImageCropper` / `IGRPPdfViewer` / `IGRPCombobox` default labels. Props that previously carried an English default (`actionLabel`, `cancelLabel`, `loadingText`, `notFoundText`, `selectLabel`, `searchText`, `optionsLabel`, `ariaLabel`, `loadErrorLabel`, `notFoundLabel`, `cropLabel`, …) still exist and still win when passed; their defaults now resolve from the catalog. Wrap the app in `IGRPI18nProvider` to restore English.
