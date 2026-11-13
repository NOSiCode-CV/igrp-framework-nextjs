---
"@igrp/igrp-framework-react-design-system": patch
---

Data table and form input fixes.

- **Clearing now writes `null`.** `IGRPInputNumber` writes `null` to the form when cleared (it wrote `undefined`, so `useWatch` brought the default back), and `IGRPDatePickerSingle` / `IGRPDatePickerRange` write `null` when the selected day is clicked again. Schemas for these fields need `.nullable()`, or `.nullish()` for a number whose untouched default is `undefined` (`z.number().optional()` now fails on a cleared field). A form-bound `IGRPInputNumber` also calls `onChange(undefined)` on clear, as documented.
- `IGRPInputNumber` without `formatOptions` reads the locale decimal comma: pt-PT "1,5" is 1.5, not 15.
- `IGRPDatePickerRange` and `IGRPDatePickerMultiple` can be cleared by a controlling parent passing `date={undefined}`.
- `IGRPDataTableDateRangeFilterFn` reads date-only cells at local midnight and includes the whole last day, so rows no longer drop out of range west of UTC or when they carry a time.
- `IGRPDataTable` moves back to the last real page when `data` shrinks under the current one, and keeps the pagination (with its page-size selector) while the row count exceeds the smallest page-size option.
- Numeric pagination no longer shows ellipses when every page fits.
- `IGRPInputFile` applies `maxFiles` across drops: files past the limit go to the rejected list.
- `IGRPDataTableCellAmount` renders nothing for a non-numeric value instead of "NaN", and `formatStyle` no longer accepts `"unit"` (it always threw).
- Removed unused exports: `formatDateRange`, `parseStringToRange`, `IGRPCellType` and `IGRPCellConfig`, plus the unimplemented `cellType`, `variants`, `format`, `currency` and `href` fields on `IGRPAccessorColumnDef`. Render cells with `cell`.
