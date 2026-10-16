# IGRPDataTable

TanStack Table v8 under the hood. Use it for tables that sort, filter, page, expand or have row actions. For a static display table, `IGRPTable` (`horizon.md`) is lighter.

Row selection can't be read or controlled yet (`packages/design-system/KNOWN-ISSUES.md`).

Row selection can't be read or controlled yet (`packages/design-system/KNOWN-ISSUES.md`).

Row selection can't be read or controlled yet (`packages/design-system/KNOWN-ISSUES.md`).

Import the TanStack types from the DS (`ColumnDef`, `Row`, `Column`, `SortingState`, …), not from `@tanstack/react-table`.

## Example

```tsx
"use client"

import { useMemo } from "react"
import {
  createIGRPColumnHelper,
  IGRPDataTable,
  type IGRPDataTableAction,
  IGRPDataTableCellBadge,
  IGRPDataTableCellDate,
  IGRPDataTableFacetedFilterFn,
  IGRPDataTableHeaderSortToggle,
} from "@igrp/igrp-framework-react-design-system"

type User = { id: string; name: string; email: string; status: "active" | "blocked"; createdAt: string }

const col = createIGRPColumnHelper<User>()

// Module scope = referentially stable. The table requires stable columns/data/actions.
const columns = [
  col.accessor("name", {
    header: ({ column }) => <IGRPDataTableHeaderSortToggle column={column} title="Nome" />,
    filter: { type: "input", placeholder: "Procurar nome" },
  }),
  col.accessor("email", { header: "Email" }),
  col.accessor("status", {
    header: "Estado",
    filterFn: IGRPDataTableFacetedFilterFn,
    filter: { type: "faceted", options: [{ label: "Ativo", value: "active" }, { label: "Bloqueado", value: "blocked" }] },
    cell: ({ row }) => (
      <IGRPDataTableCellBadge
        label={row.original.status === "active" ? "Ativo" : "Bloqueado"}
        color={row.original.status === "active" ? "success" : "destructive"}
        variant="soft"
      />
    ),
  }),
  col.accessor("createdAt", {
    header: "Criado em",
    cell: ({ row }) => <IGRPDataTableCellDate date={row.original.createdAt} />,
  }),
]

export function UsersTable({ data, onDelete }: { data: User[]; onDelete: (u: User) => Promise<void> }) {
  const actions = useMemo<IGRPDataTableAction<User>[]>(
    () => [
      { type: "link", label: "Ver", icon: "Eye", href: (row) => `/users/${row.original.id}` },
      {
        type: "alert",
        label: "Eliminar",
        icon: "Trash2",
        title: "Eliminar utilizador",
        description: "Esta ação é irreversível.",
        onConfirm: (row) => onDelete(row.original),
      },
    ],
    [onDelete],
  )

  return <IGRPDataTable columns={columns} data={data} actions={actions} showFilter showPagination notFoundLabel="Sem utilizadores." />
}
```

## Columns

- **Stability is required.** `columns`, `data` and `actions` must be referentially stable, either at module scope or in `useMemo`. The table opts out of the React Compiler (`"use no memo"`), so it can't stabilise them for you.
- **`createIGRPColumnHelper<T>()`.**
  - `accessor(key, def)` is `{ accessorKey: key, ...def }`. It doesn't infer `TValue`, so `getValue()` is `unknown`. Read `row.original.x` instead.
  - It only adds `filter` (below) to the column def. `cellType`, `variants`, `format`, `currency` and `href` are typed but **not implemented**, so render with `cell` instead.
  - `display` and `group` are TanStack's.
  - The result goes straight into `columns`. Plain `ColumnDef<T>[]` literals with `accessorKey` also work, but they can't carry `filter`.
- **Sorting has no automatic UI.** Put `IGRPDataTableHeaderSortToggle` or `IGRPDataTableHeaderSortDropdown` (`{ column, title }`) in `header`. Sort removal is off: clicking cycles asc ↔ desc.
- **Headers:** `IGRPDataTableHeaderDefault` (`{ title }`) and `IGRPDataTableHeaderRowsSelect` (`{ table }`, the select-all checkbox).

## `IGRPDataTable` props

| Prop | Default | Notes |
| --- | --- | --- |
| `columns`, `data` | — | Stable references. |
| `actions?: IGRPDataTableAction<T>[]` | | Row actions. See below. |
| `showPagination` | `false` | The footer only shows when the row count is greater than the page size. |
| `pageSizePagination` | `[50, 100, 150, 200]` | The page-size options; the first is the initial size. `pagination={{ type, pageSizeOptions, defaultPageSize }}` is the grouped form and wins. |
| `isNumericPagination` | `false` | Numbered pages instead of prev/next. |
| `showFilter` / `showToggleColumn` | `false` | Turn on the filter bar / column-visibility toggle. Filters don't render without one of them. |
| `clientFilters`, `clientClearLabel`, `onFiltersCleared` | | Custom filter UI (see Filters). |
| `onQueryChange`, `rowCount`, `isServerSide`, `serverFilterComponent` | | Server mode (see below). |
| `getRowCanExpand`, `renderSubComponent` | `() => false` | Row expansion. Pair it with `IGRPDataTableCellExpander`. |
| `notFoundLabel` | i18n `dataTable.notFound` | |
| `className`, `filterClassName`, `tableClassName`, `tableHeaderClassName`, `tableBodyClassName`, `paginationClassName`, `id` | | |

**Row selection can't be read or controlled.** The checkbox and switch cells only toggle internal state, so don't build bulk actions on them. Hold your own selected-ids state with `IGRPCheckbox` in a display column instead.

## Row actions: `IGRPDataTableAction<T>`

A union discriminated by `type`. Every action has `label`, `icon?` and `hidden?(row)` / `disabled?(row)`.

| `type` | Fields | Works in the dropdown? |
| --- | --- | --- |
| `"link"` | `href: (row) => string` | Yes |
| `"alert"` | `title`, `description?`, `onConfirm: (row) => void \| Promise<void>` | Yes |
| `"modal"` | `render: (row, close) => ReactNode` | Yes. A menu item opens the dialog, and `close` works. |
| `"custom"` | `render: (row) => ReactNode` | Yes. The returned element becomes the menu item and its `onClick` runs on select. |

- **Inline vs dropdown:** up to 2 *visible* actions (after `hidden`) render as icon buttons. With 3 or more they collapse into a dropdown, where `icon` and `disabled` are ignored. This is decided per row.
- **`custom` in the dropdown:** return **one element** (e.g. an `IGRPButton` with `onClick`). Any overlay it opens must live outside the menu, because the menu closes on select.
- **`modal`:** the dialog shows a cancel button, so put your own submit controls inside `render` and call `close` after saving.
- **Default icons:** link `Eye`, alert `Trash2`, modal `Edit`.
- **Dialog buttons** use the i18n catalog (`Cancelar` / `Continuar`).

## Cell renderers

| Component | Props |
| --- | --- |
| `IGRPDataTableCellBadge` | `label` + `IGRPBadge` props (`variant: solid \| soft \| outline`, `color: IGRPColorVariants`, `size`, `badgeClassName`). |
| `IGRPDataTableCellDate` | `date: string \| Date`, `language?` (defaults to the provider locale), `dateOptions?: Intl.DateTimeFormatOptions`. `dateFormat` is deprecated. |
| `IGRPDataTableCellAmount` | `field: string` (the numeric value **as a string**, `parseFloat`'d), `currency = "USD"` (**pass `"CVE"` / `"EUR"`**), `language?`, `formatStyle: currency \| decimal \| percent \| unit`. |
| `IGRPDataTableCellLink` | `IGRPLink` props (`href`, `children`, …). |
| `IGRPDataTableCellTooltip` | `text`, `side`, `align`. It renders the text truncated with a tooltip; it doesn't wrap children. |
| `IGRPDataTableCellExpander` | `row`, `label?`. Renders nothing when the row can't expand. |
| `IGRPDataTableCellCheckbox` / `IGRPDataTableCellSwitch` | `row` + primitive props. Internal selection only (see above). |

## Filters

There are two mechanisms. Neither uses `meta`.

**1. Column descriptor** (via the helper): `filter: { type, placeholder?, ariaLabel?, options?, render? }`.

| `type` | Writes | Column needs |
| --- | --- | --- |
| `"input"` | `string` | — (or `filterFn: IGRPDataTableTextFilterFn` for case-insensitive contains) |
| `"select"` | `string` (single; "all" clears) | `options` |
| `"dropdown"` | `string` (**single**, searchable) | `options` |
| `"faceted"` | `string[]` | `options` + **`filterFn: IGRPDataTableFacetedFilterFn`** |
| `"date"` | `{ from, to }` | **`filterFn: IGRPDataTableDateRangeFilterFn`**, with ISO date strings in the cell |
| `"range"` | `[min, max]` | — |

Without the matching `filterFn`, faceted and date filters silently match nothing or everything.

**2. `clientFilters`**: `{ columnId: keyof T; component: ({ column }) => JSX.Element }[]`. Use it for a fully custom filter control. The building blocks are exported: `IGRPDataTableFilterInput`, `…FilterSelect`, `…FilterDropdown`, `…FilterFaceted`, `…FilterDate` and `…FilterMinMax`.

## Server-side mode

**Setting `onQueryChange` is what makes the table manual.** It turns on manual pagination, sorting and filtering, and enables `rowCount`. `isServerSide` only swaps the `clientFilters` UI for `serverFilterComponent`.

```tsx
const handleQuery = useCallback((q: IGRPDataTableQuery) => {
  startTransition(() => router.replace(`?page=${q.page + 1}&size=${q.pageSize}`))
}, [router])

<IGRPDataTable columns={columns} data={pageRows} rowCount={total} onQueryChange={handleQuery} showPagination />
```

- `IGRPDataTableQuery = { page, pageSize, sorting: { id, desc }[], filters: { id, value }[] }`. **`page` is 0-based.**
- **`onQueryChange` must be stable (`useCallback`).** It fires on mount and on every change, so an inline arrow that sets parent state re-renders forever.
- Changing the sort or filters resets the page to 0.
