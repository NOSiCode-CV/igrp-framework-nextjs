---
"@igrp/igrp-framework-react-design-system": patch
---

DataTable date-range filter guards invalid/unparseable dates instead of
silently dropping every row; `formatChartValue` abbreviates negative
magnitudes (`-2.5M`); `getChartHeight`/`getChartWidth` honor an explicit `0`
and drop their no-op ternaries.
