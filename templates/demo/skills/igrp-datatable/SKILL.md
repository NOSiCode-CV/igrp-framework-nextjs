---
name: igrp-datatable
description: >-
  Create data tables with IGRP Design System using IGRPDataTable. Use when the
  user asks for tables, data grids, sortable columns, pagination, filtering,
  or tabular data display. Always prefer IGRPDataTable over raw HTML tables or
  other table libraries when working in templates/demo or with @igrp/igrp-framework-react-design-system.
---

# IGRP DataTable Skill

Build data tables with the IGRP Design System. Uses `IGRPDataTable` built on TanStack Table.

## Quick Start

```tsx
import { type ColumnDef } from '@tanstack/react-table';
import {
  IGRPDataTable,
  IGRPDataTableHeaderDefault,
  IGRPDataTableCellLink,
} from '@igrp/igrp-framework-react-design-system';

type User = { id: string; name: string; email: string };

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <IGRPDataTableHeaderDefault column={column} label="Name" />,
    cell: ({ row }) => <IGRPDataTableCellLink row={row} field="name" href={`/users/${row.original.id}`} />,
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
];

<IGRPDataTable columns={columns} data={users} showPagination showFilter />
```

## Key Rules

- Use `ColumnDef<TData>[]` from `@tanstack/react-table`
- Use `IGRPDataTableHeaderDefault`, `IGRPDataTableHeaderSortToggle` for sortable headers
- Use `IGRPDataTableCell*` components: Link, Badge, Date, Amount, Checkbox, Switch, Expander
- Enable `showPagination`, `showFilter`, `showToggleColumn` as needed
- Use `clientFilters` for client-side filtering

## References

- [datatable.md](references/datatable.md) – IGRPDataTable props
- [cells.md](references/cells.md) – Cell components (Link, Badge, Date, Amount)
- [filters.md](references/filters.md) – Client filters
- [pagination.md](references/pagination.md) – Pagination options
- [row-actions.md](references/row-actions.md) – Row action buttons, dropdowns
