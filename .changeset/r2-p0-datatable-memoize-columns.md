---
"@igrp/igrp-framework-react-design-system": patch
---

Memoize `IGRPDataTable`'s column helper, derived `allColumns`, and
`filterDescriptors` (keyed on `columns`/`actions`). The component opts out of
the React Compiler (`"use no memo"`, required by `useReactTable`), so these
were rebuilt on every render and forced TanStack to reset its column model on
any unrelated parent re-render. Documents in `IGRPDataTableProps` that callers
must keep `data` and `columns` referentially stable.
