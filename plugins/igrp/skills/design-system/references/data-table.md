# IGRPDataTable

Built on TanStack Table v8. Use this for any non-trivial tabular UI in the repo — sortable columns, filtering, pagination, row selection, row actions, server-side data.

`IGRPDataTable` opts out of the React Compiler internally (`"use no memo"`) because TanStack mutates state in ways the compiler can't model. You don't need to do anything about that; just don't wrap the call site in aggressive memoization.

## Imports

```ts
import {
  IGRPDataTable,
  type IGRPDataTableAction,
  createIGRPColumnHelper,
  IGRPDataTableCellBadge,
  IGRPDataTableCellDate,
  IGRPDataTableCellCheckbox,
  IGRPDataTableCellSwitch,
} from "@igrp/igrp-framework-react-design-system"
```

## Minimum example

```tsx
"use client"

import { useMemo } from "react"
import {
  IGRPDataTable,
  type IGRPDataTableAction,
  createIGRPColumnHelper,
  IGRPDataTableCellBadge,
  IGRPDataTableCellDate,
} from "@igrp/igrp-framework-react-design-system"

type User = { id: string; name: string; email: string; status: "active" | "blocked"; createdAt: string }

export function UsersTable({
  data,
  onEdit,
  onDelete,
}: {
  data: User[]
  onEdit?: (u: User) => void
  onDelete?: (u: User) => void | Promise<void>
}) {
  const columnHelper = useMemo(() => createIGRPColumnHelper<User>(), [])

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", { header: "Nome" }),
      columnHelper.accessor("email", { header: "Email" }),
      columnHelper.accessor("status", {
        header: "Estado",
        cell: ({ row }) => (
          <IGRPDataTableCellBadge
            label={row.original.status === "active" ? "Ativo" : "Bloqueado"}
            color={row.original.status === "active" ? "success" : "destructive"}
            variant="soft"
          />
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Criado em",
        cell: ({ row }) => <IGRPDataTableCellDate date={row.original.createdAt} language="pt-PT" />,
      }),
    ],
    [columnHelper],
  )

  const actions = useMemo<IGRPDataTableAction<User>[]>(
    () => [
      {
        type: "custom",
        label: "Editar",
        icon: "Pencil",
        render: (row) => (
          <IGRPButton variant="ghost" size="icon-sm" iconName="Pencil" onClick={() => onEdit?.(row.original)} />
        ),
      },
      {
        type: "alert",
        label: "Eliminar",
        icon: "Trash2",
        title: "Eliminar utilizador",
        description: "Esta acção é irreversível.",
        onConfirm: async (row) => { await onDelete?.(row.original) },
      },
    ],
    [onEdit, onDelete],
  )

  return (
    <IGRPDataTable
      columns={columns}
      data={data}
      actions={actions}
      showPagination
      showFilter
      notFoundLabel="Sem utilizadores."
    />
  )
}
```

## `IGRPDataTable` key props

- `columns: ColumnDef<TData, TValue>[]` — TanStack column defs. Build with `createIGRPColumnHelper<TData>()`.
- `data: TData[]`.
- `actions?: IGRPDataTableAction<TData>[]` — row actions. **The recommended way to add Edit/Delete/etc. per row.** ≤2 actions render as inline icon buttons; >2 collapse into a dropdown.
- `showPagination?` / `isNumericPagination?` / `pageSizePagination?: number[]`.
- `showFilter?` / `clientFilters?` / `clientClearLabel?` / `onFiltersCleared?`.
- `showToggleColumn?` / `toggleLabel?` / `toggleOptionsLabel?`.
- `notFoundLabel?` — message when no rows match.
- Server-side: `isServerSide?` + `onQueryChange?: (q: IGRPDataTableQuery) => void` + `rowCount?` + `serverFilterComponent?`.
- Expansion: `getRowCanExpand?` + `renderSubComponent?`.

## Row actions — `IGRPDataTableAction<TData>`

A discriminated union by `type`. Common fields: `label`, `icon`, `hidden?(row)`, `disabled?(row)`.

| `type` | Extra fields | Use for |
| --- | --- | --- |
| `"link"` | `href: (row) => string` | Navigate to a detail page. |
| `"alert"` | `title`, `description?`, `onConfirm: (row) => void \| Promise<void>` | Confirm-then-act (delete, archive). |
| `"modal"` | `render: (row, close) => ReactNode` | Open a modal with custom content. Note: when collapsed into the dropdown (>2 actions), the `close` callback is a no-op. |
| `"custom"` | `render: (row) => ReactNode` | Anything else (e.g. an inline button calling a handler). |

> Don't try to render row actions inside a `display` column's `cell` — pass them as `actions={...}` on the table. The table handles inline-vs-dropdown layout for you.

## Cell renderers

Use these inside `cell: ({ row }) => ...` — they enforce token consistency and consistent locale.

| Component | Props |
| --- | --- |
| `IGRPDataTableCellBadge` | `label: string` + `IGRPBadgeProps` (`variant`, `color`, `size`, `badgeClassName`). |
| `IGRPDataTableCellDate` | `date: string \| Date`, `language?: string` (e.g. `"pt-PT"`), `dateOptions?: Intl.DateTimeFormatOptions`. |
| `IGRPDataTableCellCheckbox` | `row` + props passed through to the primitive `Checkbox`. Use as the selection cell. |
| `IGRPDataTableCellSwitch` | Same shape with a `Switch`. |
| `IGRPDataTableCellExpander` | `row`, `label?`. Toggle for `getRowCanExpand` rows. |
| `IGRPDataTableCellLink` | Inline `IGRPLink` cell. |
| `IGRPDataTableCellTooltip` | Wrap with a tooltip. |
| `IGRPDataTableCellAmount` | Currency-formatted number. |

For free-form content, return any JSX from `cell`.

## Filters

Filter UI is configured per-column via `clientFilters` on the table (or by the matching column meta). Available filter types (see `IGRPDataTableFilterType`):

- `"input"` — text contains
- `"select"` — single-value select
- `"dropdown"` — multi-value dropdown
- `"faceted"` — multi-value with counts
- `"date"` — date or date-range
- `"range"` — numeric min/max

Underlying components (rarely instantiated directly): `IGRPDataTableFilterInput`, `IGRPDataTableFilterSelect`, `IGRPDataTableFilterDropdown`, `IGRPDataTableFilterFaceted`, `IGRPDataTableFilterDate`, `IGRPDataTableFilterMinMax`.

## Server-side mode

Set `isServerSide` and provide `onQueryChange` — you receive an `IGRPDataTableQuery` (`{ page, pageSize, sorting, filters }`) whenever the user paginates, sorts, or filters. Pass back the page slice plus `rowCount` for the pagination footer.

## Column helper

`createIGRPColumnHelper<TData>()` is a thin wrapper over TanStack's `createColumnHelper` — same `.accessor(...)` / `.display(...)` API, plus IGRP-friendly defaults. Always use it instead of writing `ColumnDef<TData>[]` literals by hand.

## When NOT to use `IGRPDataTable`

- For a small static table with no interactivity, use `IGRPTable` (Horizon) — much lighter, no TanStack.
- For a simple list (no columns/sort), render cards or a flex column instead. A table is the wrong primitive for non-tabular data.
