# Skill: Create Table

## Use when user requests

- tables
- data table
- datatable
- list with columns
- sortable table

## Rules

1. Use IGRPDataTable for data with columns, sorting, filtering
2. Use IGRPTable for simple static tables
3. Define columns with ColumnDef from @tanstack/react-table
4. Use IGRPDataTableCell* for cell rendering (Link, Badge, Date, Amount, etc.)

## Example

```tsx
import {
  IGRPDataTable,
  type ColumnDef,
} from '@igrp/igrp-framework-react-design-system';

type User = { id: string; name: string; email: string };

const columns: ColumnDef<User>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
];

<IGRPDataTable columns={columns} data={users} />
```

## See also

- .cursor/skills/igrp-design-system/ (Cursor skill)
- docs/ai/components/datatable.md
- examples/datatable-basic.tsx
