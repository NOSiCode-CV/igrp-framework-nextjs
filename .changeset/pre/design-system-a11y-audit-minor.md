---
'@igrp/igrp-framework-react-design-system': patch
---

Accessibility fixes for the Minor items of the WCAG 2.1 AA audit of 2026-11-26:

- **Screen-reader text:**
  - Every chart renders its values in a visually hidden data table.
  - `IGRPAlert` and `IGRPNotification` start with the severity ("Erro:", "Aviso:", "Sucesso:", "Informação:").
  - The default link text of `IGRPAlert` is "Saber mais" (`alert.link`), no longer "link".
- **New optional props:**
  - `statusLabel` on options (`IGRPOptionsProps`) gives the select, combobox and multi-select status dot a text alternative.
  - `statusLabel` and `iconLabel` on `IGRPAvatar` override the default status and icon names.
  - `caption` on `IGRPTable`, `IGRPDataTable` and the server data table names the table.
- **Accessible names:**
  - An icon-only `IGRPBadge` has `role="img"`, so its `aria-label` is announced.
  - The rich-text editor is named "Editor de texto" when no `label` is passed.
  - The file upload progress bar is named after its file.
  - The carousel region has a name.
  - The cookie banner is a named region.
  - Column-visibility items show the column header text when it is a string.
- **Structure:**
  - `IGRPCardDetails` lists its fields as `<dl>`, not `<h3>`.
  - `IGRPCardDetails` and `IGRPInfoCard` titles are level-2 headings.
  - `StepperTitle` renders a `<span>` (it sits inside the step button).
  - The stepper indicator announces "concluído" and the loading state.
  - The `steps` list is an `<ol>`.
  - Lists carry `role="list"`.
  - The active sidebar item has `aria-current="page"`.
  - `IGRPMenuNavigation` uses `aria-current="true"`.
  - `BreadcrumbPage` is no longer a disabled link.
  - The pagination and breadcrumb ellipsis text is read.
  - `Skeleton` is `aria-hidden`.
  - The time calendars no longer give two elements the same id.
  - Their time fields are labelled "Hora de início" / "Hora de fim".
- **Keyboard and focus:**
  - `IGRPCopyTo` keeps focus after copying.
  - The "Selecionar tudo" and "Limpar" buttons in `IGRPMultiSelect` work with Enter.
  - A truncated table cell with a tooltip is a focusable button.
  - A disabled step in `IGRPProcessStepper` is disabled.
  - After a failed submit, `IGRPFormList` opens the items that have errors.
- **Announcements:**
  - The textarea counter is silent until it nears the limit.
  - The data-table empty state is a status message.
  - The file input exposes `aria-required`.
- **Contrast:** the data-table sort icons now meet 3:1 in light mode.

New i18n keys: `carousel.label`, `inputFile.uploadProgress`, `richText.editorLabel`, `banner.cookieLabel`, `charts.category`, `severity.*`, `alert.link`. The values of `datePicker.startDate` / `endDate` changed to time labels.
