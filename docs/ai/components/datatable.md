# IGRPDataTable

## Description

Data table with columns, sorting, filtering, pagination. Uses @tanstack/react-table.

## Props

| Prop | Type | Required |
|------|------|----------|
| columns | ColumnDef<T>[] | yes |
| data | T[] | yes |
| ... | Table options | no |

## Column Definition

```tsx
const columns: ColumnDef<RowType>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <IGRPDataTableCellBadge value={row.getValue('status')} />,
  },
];
```

## Cell Components

- IGRPDataTableCellLink
- IGRPDataTableCellBadge
- IGRPDataTableCellDate
- IGRPDataTableCellAmount
- IGRPDataTableCellCheckbox
- IGRPDataTableCellExpander
- IGRPDataTableCellTooltip

## Example

```tsx
import {
  IGRPDataTable,
  type ColumnDef,
} from '@igrp/igrp-framework-react-design-system';

<IGRPDataTable columns={columns} data={data} />
```

## Structured

```yaml
component: IGRPDataTable
props:
  columns:
    type: ColumnDef<T>[]
    from: @tanstack/react-table
  data:
    type: T[]
```
