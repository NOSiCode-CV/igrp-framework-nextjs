---
"@igrp/igrp-framework-react-design-system": patch
---

Data table, input and chart fixes.

- `IGRPDataTable` shows the pagination when the row count exceeds the current page size or the smallest option, so a `defaultPageSize` below every option (or empty `pageSizeOptions`) no longer hides rows past the first page.
- In server mode (`onQueryChange`), `IGRPDataTable` no longer jumps back to page 1 while `rowCount` is `0` during a refetch.
- `IGRPServerDataTable` shows the pagination while `totalElements > 0`, so an empty page past the end (after a delete) keeps the way back.
- Row actions in the dropdown (3 or more) keep `disabled` and show `icon`. A disabled link item does not navigate, and a disabled alert or modal item does not open its dialog.
- Sort, expand and pagination buttons in the data table, and the filter's clear button, are `type="button"`, so they no longer submit an enclosing form.
- `IGRPInputPhone` writes `""` when cleared (it wrote `undefined`, so `useWatch` brought the default back).
- `IGRPInputUrl` writes `""` for an empty address instead of a bare `"https://"`, and a protocol typed or pasted into the address, in any case (`HTTPS://`), replaces the selected one instead of doubling it.
- `IGRPInputTime` and `IGRPInputPassword` render an empty `value` for an unset field instead of switching between uncontrolled and controlled.
- `IGRPSelect` search ignores accents ("sao" finds "São Vicente"), clears when the dropdown closes, and shows "Nenhuma opção encontrada." when nothing matches.
- `IGRPPieChart` keeps an explicit `0` for `startAngle` / `endAngle` (`endAngle: 0` was replaced by 360).
- The pie and radial chart legend fallback for a row without a name is the new catalog key `charts.itemFallback` ("Item {index}"); it was hardcoded English.
- `IGRPMenuNavigation` escapes the section id in its scroll lookup, so an id with quotes or other CSS-special characters no longer throws.
- `IGRPInputNumber`: no behaviour change, but note that a cleared field is `null`, and `z.coerce.number()` turns it into `0`. A required number needs `z.number({ error })` (not coerce), or a `z.preprocess` that maps `null` to `undefined`.
- `igrpColorText` returns the coloured text class (`text-success`), not the near-white on-fill foreground, so status dots in `IGRPSelect`, `IGRPCombobox` and `IGRPMultiSelect`, and `IGRPLink` without a variant, are visible on a light background again.
- `IGRPLineChart`, `IGRPAreaChart`, `IGRPRadarChart`, `IGRPPieChart` and `IGRPRadialChart` keep their `size` height instead of growing 40 px per data point (a year of daily points made a 14,630 px chart). Only the horizontal bar chart still grows with its rows.
- `IGRPAreaChart` gradient ids are unique per chart and safe for any `dataKey`, so two area charts with the same `dataKey` no longer share one gradient, and a `dataKey` with spaces no longer breaks the fill.
- An explicit `0` is kept for `fillOpacity` (area, radar), `strokeWidth` (line, radar), `labelOffset` (line) and `cx` / `cy` (pie).
- `IGRPFormList` inside a disabled `IGRPForm` disables its add button. In standalone mode `renderItem` always gets its `onChange`, also without `defaultItem`, and rows that arrived through `value` keep their identity when one is removed.
- `IGRPRichTextEditor`: a link typed without a scheme (`www.gov.cv`) gets `https://` instead of becoming a relative link, and an address the editor refuses keeps the popover open with "Endereço inválido." (new catalog key `richText.linkInvalid`).
- `IGRPInputColor` in a form shows an empty swatch and value for an unset or `null` field, instead of `#000000` or the previous colour.
- Area and bar charts work with any `dataKey`: the colour variable name is sanitized the same way in the chart style and in the series (`"Receita Total"` becomes `--color-Receita_Total`), so a key with spaces or dots is no longer drawn black with an invisible legend swatch. `ChartStyle` also strips `<`, `>`, `;`, `{` and `}` from colours, so a key or colour cannot close the `<style>` tag.
- `IGRPFormList` in standalone mode no longer repeats a React key when the parent appends a row after one was removed from a list that arrived through `value`.
- `IGRPInputColor`: after the field is cleared, picking the colour it held before is written again (the native picker kept that colour, so the browser reported no change).
