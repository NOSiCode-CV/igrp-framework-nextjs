---
"@igrp/igrp-framework-react-design-system": patch
---

Dates, file sizes, chart values and phone country names now follow the `IGRPI18nProvider` locale: date pickers and the data-table date cell pass the matching date-fns locale, `IGRPInputFile` formats sizes with `Intl` units, chart axis and tooltip values use compact `Intl` notation (`formatChartValue` takes an optional `locale` third argument), and `IGRPInputPhone` lists country names in the locale. `formatDateToString`, `formatDateRange`, `parseStringToDate`, `parseStringToRange` and `parseDateInput` take an optional date-fns `locale`. The calendar only trusts a consumer locale's code for `Intl` when it carries a region. `IGRPDataTableCellAmount` no longer defaults to USD: without `currency`, a `currency` cell renders as a plain number.
