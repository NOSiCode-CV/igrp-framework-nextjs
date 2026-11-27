# IGRPDataTable

TanStack Table v8 under the hood. Use it for tables that sort, filter, page, expand or have row actions. For a static display table, `IGRPTable` (`horizon.md`) is lighter.

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
  - It only adds `filter` (below) to the column def. Render cells with `cell`.
  - `display` and `group` are TanStack's.
  - The result goes straight into `columns`. Plain `ColumnDef<T>[]` literals with `accessorKey` also work, but they can't carry `filter`.
- **Sorting has no automatic UI.** Put `IGRPDataTableHeaderSortToggle` or `IGRPDataTableHeaderSortDropdown` (`{ column, title }`) in `header`. Sort removal is off: clicking cycles asc ↔ desc.
- **Headers:** `IGRPDataTableHeaderDefault` (`{ title }`) and `IGRPDataTableHeaderRowsSelect` (`{ table }`, the select-all checkbox).

## `IGRPDataTable` props

| Prop | Default | Notes |
| --- | --- | --- |
| `columns`, `data` | — | Stable references. |
| `actions?: IGRPDataTableAction<T>[]` | | Row actions. See below. |
| `showPagination` | `false` | The footer only shows when the row count is greater than the page size. Without it, client mode renders every row on one page. |
| `pagination` | | `{ type: "simple" \| "numeric", pageSizeOptions, defaultPageSize }`. Default options `[50, 100, 150, 200]`; the first is the initial size unless `defaultPageSize` is set. |
| `pageSizePagination`, `isNumericPagination` | | **Deprecated**: use `pagination.pageSizeOptions` / `pagination.type: "numeric"`. |
| `toolbar` | | A node rendered in the toolbar row next to the filters (search box, custom filters, buttons). Shown with or without `showFilter`. |
| `showFilter` / `showToggleColumn` | `false` | Turn on the filter bar / column-visibility toggle. Filters don't render without one of them. |
| `clientFilters`, `clientClearLabel`, `onFiltersCleared` | | Custom filter UI (see Filters). |
| `layout` | `"auto"` | `"fixed"` adds `table-fixed` and honours `ColumnDef.size`. See Column layout. |
| `onQueryChange`, `rowCount` | | Server mode (see below). |
| `isServerSide`, `serverFilterComponent` | | **Deprecated**: they only swap the filter UI. Use `IGRPServerDataTable` (or `onQueryChange`) for server mode and `toolbar` for custom filter UI. A dev warning fires for `isServerSide` without `onQueryChange`. |
| `getRowCanExpand`, `renderSubComponent` | `() => false` | Row expansion. Pair it with `IGRPDataTableCellExpander`. |
| `getRowId` | row index | Stable row id (`(row) => row.id`). Pass it whenever you use `renderSubComponent`: by index, expanded state follows the position when `data` is reordered (refetch, server paging or sorting) and opens a different record. Dev warning otherwise. |
| `notFoundLabel` | i18n `dataTable.notFound` | |
| `rowSelection`, `onRowSelectionChange` | internal | Controlled selection in TanStack's shape (`{ [rowId]: true }`, updater callback); `useState`'s setter fits. See Row selection. |
| `onSelectionChange` | | `(rows: TData[]) => void` with the selected rows' data on every change (not on mount). |
| `selection` | | `"checkbox" \| "switch"`: adds the row-selection column. See Row selection. |
| `caption` | | Accessible table name, rendered as a visually hidden `<caption>`. |
| `className`, `filterClassName`, `tableClassName`, `tableHeaderClassName`, `tableBodyClassName`, `paginationClassName`, `id` | | |

### Row selection

Pass `selection="checkbox"` or `selection="switch"` and `IGRPDataTable` adds the selection column before `columns`: a checkbox or switch per row, and a select-all checkbox in the header. To build it yourself, put `IGRPDataTableHeaderRowsSelect` in a display column's `header` and `IGRPDataTableCellCheckbox` (or `IGRPDataTableCellSwitch`) in its `cell`. Don't do both. Select-all toggles the **current page** only. Pass `getRowId` so selection keys are record ids, not row positions.

```tsx
const [selection, setSelection] = useState<RowSelectionState>({})
<IGRPDataTable
  columns={columns}
  data={rows}
  getRowId={(row) => row.id}
  rowSelection={selection}
  onRowSelectionChange={setSelection}
  onSelectionChange={(selected) => setBulkTargets(selected)}
/>
```

Use `onSelectionChange` alone when you only need to read the selection.

## Row actions: `IGRPDataTableAction<T>`

A union discriminated by `type`. Every action has `label`, `icon?` and `hidden?(row)` / `disabled?(row)`.

| `type` | Fields | Works in the dropdown? |
| --- | --- | --- |
| `"link"` | `href: (row) => string` | Yes |
| `"alert"` | `title`, `description?`, `onConfirm: (row) => void \| Promise<void>` | Yes |
| `"modal"` | `render: (row, close) => ReactNode` | Yes. A menu item opens the dialog, and `close` works. |
| `"custom"` | `render: (row) => ReactNode` | Yes. The returned element becomes the menu item and its `onClick` runs on select. |

- **Inline vs dropdown:** up to 2 *visible* actions (after `hidden`) render as icon buttons. With 3 or more they collapse into a dropdown, which keeps `disabled` (a disabled link item does not navigate) and shows `icon` on link, alert and modal items (a `custom` item is the node you render). This is decided per row.
- **`custom` in the dropdown:** return **one element** (e.g. an `IGRPButton` with `onClick`). Any overlay it opens must live outside the menu, because the menu closes on select.
- **`modal`:** the dialog shows a cancel button, so put your own submit controls inside `render` and call `close` after saving.
- **Default icons:** link `Eye`, alert `Trash2`, modal `Edit`.
- **Dialog buttons** use the i18n catalog (`Cancelar` / `Continuar`).

## Cell renderers

| Component | Props |
| --- | --- |
| `IGRPDataTableCellBadge` | `label` + `IGRPBadge` props (`variant: solid \| soft \| outline`, `color: IGRPColorVariants`, `size`, `badgeClassName`). |
| `IGRPDataTableCellDate` | `date: string \| Date`, `language?` (defaults to the provider locale), `dateOptions?: Intl.DateTimeFormatOptions`. `dateFormat` is deprecated. |
| `IGRPDataTableCellAmount` | `field: string` (the numeric value **as a string**, `parseFloat`'d), `currency?` (without it a currency cell renders as a plain number; pass `"CVE"` / `"EUR"`), `language?`, `formatStyle: currency \| decimal \| percent`. Renders nothing when `field` is not a number. |
| `IGRPDataTableCellLink` | `IGRPLink` props (`href`, `children`, …). |
| `IGRPDataTableCellTooltip` | `text`, `side`, `align`. It renders the text truncated with a tooltip; it doesn't wrap children. |
| `IGRPDataTableCellExpander` | `row`, `label?`. Renders nothing when the row can't expand. |
| `IGRPDataTableCellCheckbox` / `IGRPDataTableCellSwitch` | `row` + primitive props. See Row selection. |

## Filters

There are two mechanisms. Neither uses `meta`.

**1. Column descriptor** (via the helper): `filter: { type, placeholder?, ariaLabel?, options?, render? }`. `ariaLabel` names the `"input"` and `"select"` controls for screen readers (default "Filtrar"); set it when a table has more than one.

| `type` | Writes | Column needs |
| --- | --- | --- |
| `"input"` | `string` | — (or `filterFn: IGRPDataTableTextFilterFn` for case-insensitive contains) |
| `"select"` | `string` (single; "all" clears) | `options` |
| `"dropdown"` | `string` (**single**, searchable) | `options` |
| `"faceted"` | `string[]` | `options` (`filterFn` defaults to `IGRPDataTableFacetedFilterFn`) |
| `"date"` | `{ from, to }` | ISO date strings in the cell (`filterFn` defaults to `IGRPDataTableDateRangeFilterFn`) |
| `"range"` | `[min, max]` | — |

`IGRPDataTable` sets those two defaults only for descriptor columns without their own `filterFn`. With `clientFilters` or `toolbar` filters, set the `filterFn` yourself: without it, faceted and date filters match nothing or everything.

**2. `clientFilters`**: `{ columnId: keyof T; component: ({ column }) => JSX.Element }[]`. Use it for a fully custom filter control. The building blocks are exported: `IGRPDataTableFilterInput`, `…FilterSelect`, `…FilterDropdown`, `…FilterFaceted`, `…FilterDate` and `…FilterMinMax`.

## Server-side mode

**Setting `onQueryChange` is what makes the table manual.** It turns on manual pagination, sorting and filtering, and enables `rowCount`. The deprecated `isServerSide` only swaps the `clientFilters` UI for `serverFilterComponent`; put your own filter controls in `toolbar` instead.

```tsx
const handleQuery = useCallback((q: IGRPDataTableQuery) => {
  startTransition(() => router.replace(`?page=${q.page + 1}&size=${q.pageSize}`))
}, [router])

<IGRPDataTable columns={columns} data={pageRows} rowCount={total} onQueryChange={handleQuery} showPagination />
```

- `IGRPDataTableQuery = { page, pageSize, sorting: { id, desc }[], filters: { id, value }[] }`. **`page` is 0-based.**
- **`onQueryChange` must be stable (`useCallback`).** It fires on mount and on every change, so an inline arrow that sets parent state re-renders forever.
- Changing the sort or filters resets the page to 0.

## `IGRPServerDataTable`

A controlled table for server-paginated data. The caller owns the page index; the table never moves until `pagination` changes. Pick it over `IGRPDataTable` + `onQueryChange` when the page index lives in your state (a fetch hook, a `useState`), not in the table.

| Prop | Default | Notes |
| --- | --- | --- |
| `columns`, `data` | | Stable references. `data` is the current page's rows. |
| `pagination: IGRPServerPaginationState` | | `{ pageIndex (0-based), pageSize, totalElements, totalPages }`. |
| `onPaginationChange(pageIndex, pageSize)` | | Flat arguments. |
| `pageSizeOptions` | `[5, 10, 30, 50]` | |
| `enablePagination` | `true` | The bar shows whenever `totalElements > 0`, so an empty page past the end (after a delete) still offers the way back. |
| `paginationType` | `"simple"` | `"numeric"` for numbered pages. |
| `isLoading` | `false` | Spinner overlay and `aria-busy`; rows stay rendered. The pagination bar stays interactive, so guard in the parent if needed. |
| `sorting`, `onSortingChange` | | Manual sorting only when both are given; otherwise rows sort client-side within the page. |
| `layout` | `"auto"` | See Column layout. |
| `getRowId`, `getRowCanExpand`, `renderSubComponent` | | Row expansion. |
| `toolbar` | | A node rendered above the table (search box, filters, buttons). |
| `caption` | | Accessible table name, rendered as a visually hidden `<caption>`. |
| `notFoundLabel`, `id`, `className`, `tableClassName`, `tableHeaderClassName`, `tableBodyClassName`, `paginationClassName` | | |

```tsx
const [filter, setFilter] = useState("")
const [pagination, setPagination] = useState<IGRPServerPaginationState>({
  pageIndex: 0, pageSize: 10, totalElements: 0, totalPages: 0,
})
// fetch rows for (filter, pagination.pageIndex, pagination.pageSize), then set totals

<IGRPServerDataTable
  columns={columns}
  data={rows}
  pagination={pagination}
  onPaginationChange={(pageIndex, pageSize) => setPagination((p) => ({ ...p, pageIndex, pageSize }))}
  isLoading={loading}
  getRowId={(r) => r.id}
/>

// on filter change: setFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 }))
```

- `onPaginationChange` gets flat `(pageIndex, pageSize)`, not an updater.
- Pass `sorting` and `onSortingChange` together, or omit both.
- Pass `getRowId` with `renderSubComponent`. Without it, expanded rows follow the row's index in `data`, which breaks when data is reordered or replaced (server sort or page, refetch). A dev warning fires otherwise.

## Column layout (meta)

`ColumnDef.meta` is typed as `IGRPDataTableColumnMeta`; both `IGRPDataTable` and `IGRPServerDataTable` read it.

- `meta.isActionsColumn`: keeps the column on one line and, under `layout="auto"`, shrinks it to fit (no inline width). This is the only way actions columns are detected; `IGRPDataTable`'s generated `actions` column sets it.
- `meta.cellClassName`: replaces the column's default cell classes.
- `layout`: `"auto"` (default) lets the browser size columns; `"fixed"` uses `table-fixed` and `ColumnDef.size` widths.
- Default cells truncate below `lg` and wrap from `lg`; headers can wrap from `lg` (not under `"fixed"`).
