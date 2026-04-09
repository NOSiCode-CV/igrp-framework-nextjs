# IGRPDataTable API Reference

## Import

```tsx
import { IGRPDataTable, type IGRPDataTableProps } from '@igrp/igrp-framework-react-design-system';
import type { ColumnDef } from '@tanstack/react-table';
```

## IGRPDataTableProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `ColumnDef<TData, TValue>[]` | - | TanStack Table column definitions |
| `data` | `TData[]` | - | Table rows |
| `showPagination` | `boolean` | `false` | Show pagination |
| `isNumericPagination` | `boolean` | `false` | Numeric page selector |
| `pageSizePagination` | `number[]` | `[50,100,150,200]` | Page size options |
| `showFilter` | `boolean` | `false` | Show filter UI |
| `clientFilters` | `IGRPDataTableClientFilterListProps[]` | - | Client filter configs |
| `showToggleColumn` | `boolean` | `false` | Column visibility toggle |
| `isServerSide` | `boolean` | `false` | Server-side mode |
| `serverFilterComponent` | `ReactNode` | - | Custom filter for server mode |
| `notFoundLabel` | `string` | `'Nenhum registo encontrado.'` | No rows message |
| `getRowCanExpand` | `(row) => boolean` | `() => false` | Row expandable |
| `renderSubComponent` | `(row) => ReactElement` | - | Expanded row content |
