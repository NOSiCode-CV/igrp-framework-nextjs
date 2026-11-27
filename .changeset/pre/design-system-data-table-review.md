---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTable` filters, pagination, selection and tooltips:

- New `selection` prop on `IGRPDataTable`: `"checkbox"` or `"switch"` adds a row-selection column with a select-all checkbox in the header.
- The `dropdown` filter has a "Limpar filtro" item once a value is set.
- `IGRPDataTableFilterSelect` shows its placeholder when no filter is set. The trigger was empty.
- Filter descriptors pass `placeholder` to the `select`, `faceted`, `dropdown` and `date` filters, not only to `input`.
- A column with a `faceted` or `date` descriptor and no `filterFn` now gets `IGRPDataTableFacetedFilterFn` or `IGRPDataTableDateRangeFilterFn`. Before, these filters matched nothing or everything. A column's own `filterFn` still wins.
- The `dropdown` and `faceted` filters search the option label as well as the value.
- One click on a `faceted` option toggles it once. The checkbox is visual only, and the option carries `aria-checked`. The trigger uses `size="sm"`, like the other filters.
- `IGRPDataTablePagination` wraps on narrow screens and hides the first/last buttons below `sm`. An empty table shows `0-0`, not `1-0`.
- `IGRPDataTablePaginationNumeric` uses smaller page buttons below `sm`, and the page-size select gets a unique `id` instead of the fixed `results-per-page`.
- `IGRPDataTableCellTooltip` uses `IGRPTooltip`, so it shares the nearest provider instead of mounting one per cell. `IGRPCopyTo` also reuses an `IGRPTooltipProvider` in scope, and the rich-text toolbar's provider is now an `IGRPTooltipProvider`.
- `IGRPTooltip`'s `delayDuration` now applies inside an `IGRPTooltipProvider` too. Before, a provider in scope ignored it.
