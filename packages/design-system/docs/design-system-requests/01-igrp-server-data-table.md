# §1. `IGRPServerDataTable` — a controlled, server-paginated data table

> Part of the SIGOVP design-system request bundle — see [README.md](README.md). Cite as `§1`.


**Local workaround.** `src/app/(myapp)/_components/server-paginated-data-table.tsx`
(`ServerPaginatedDataTable`), plus the layout helpers in
`src/app/(myapp)/_lib/data-table-layout.ts`,
the state hook `src/app/(myapp)/_hooks/use-server-paginated-resource.ts`,
the page mapper `src/app/(myapp)/_lib/pagination-from-api.ts`
and the `.simple-dt-*` rules in `src/styles/simple.css`.

**Why it exists.** `IGRPDataTable` does have a server-side mode
(`rowCount` + `onQueryChange`), but it is *uncontrolled and all-or-nothing*.
This is not an impression — it is what `horizon/data-table/index.js` does:

```js
onPaginationChange: setPagination,          // state lives in the component's reducer
onSortingChange: setSorting,
state: { sorting: state.sorting, pagination: state.pagination, … },

manualPagination: !!onQueryChange,
manualSorting:    !!onQueryChange,
manualFiltering:  !!onQueryChange,
rowCount: onQueryChange ? rowCount ?? 0 : undefined
```

The three `manual*` flags are one switch. Every SIGOVP list needs server
pagination with **client-side sorting of the loaded page** and its own filter
bar, and needs to *own* the page index — reset it to 0 on a filter change,
restore the server's actual `number`/`size` after a fetch, rehydrate it from a
URL. With pagination state held internally and `onQueryChange` reported from an
effect, none of that is reachable.

Three smaller findings from the same file, each of which independently blocks
using `IGRPDataTable` for these screens:

- **`getRowId` is never passed to `useReactTable`** and is not in
  `IGRPDataTableProps`. So the expansion-identity problem in §1.4 is not a trap
  a careful caller can avoid — it is unavoidable. `renderSubComponent` and
  `getRowCanExpand` are supported, so the component invites exactly the usage
  that breaks.
- **The pagination bar is gated on `table.getRowCount() > state.pagination.pageSize`.**
  A single-page result renders no bar at all, so the user cannot change the page
  size to see more. We need it visible whenever there are rows (§1.3, item 5).
- **`enableSortingRemoval: false` is already set**, matching what we need — so
  that is one thing we are *not* asking you to change, and §1.3 item 3 is a
  "please keep this", not a request.

---

## §1.1 Who uses it

Ten list screens, all of them `_features/<module>/components/<module>-list.tsx`:
`categorias-ocupacao`, `documentos-exigidos`, `entidades`, `fiscalizacoes`,
`licencas`, `localizacoes`, `modelos-documento`, `notificacao`, `pedidos`,
`taxas`.

Eight of the ten are the flat shape:

```tsx
<ServerPaginatedDataTable
  columns={columns}
  data={taxas}
  pagination={pagination}
  onPaginationChange={handlePaginationChange}
  tableHeaderClassName="bg-muted"
  notFoundLabel="Nenhuma taxa encontrada."
/>
```

Two (`categorias-ocupacao`, `documentos-exigidos`) add grouped/expandable rows:

```tsx
<ServerPaginatedDataTable
  columns={columns}
  data={pageGrupos}
  pagination={pagination}
  onPaginationChange={handlePaginationChange}
  getRowId={(grupo) => grupo.key}
  getRowCanExpand={() => true}
  renderSubComponent={renderCategorias}
  tableHeaderClassName="bg-muted"
  notFoundLabel="Nenhum documento exigido encontrado."
/>
```

No call site passes `sorting` / `onSortingChange` today — sorting is
client-side by decision, over the loaded page, via
`IGRPDataTableHeaderSortToggle` in the column `header`. The props exist for the
day a specific list needs a server `sort` parameter, and `taxas-list.tsx` keeps
them commented out at the call site as the reference wiring.

Callers always wrap the table in a `relative` div and overlay
`<DataLoading …/>` while a page fetch is in flight; the table itself has no
loading state (see §1.6, item 1).

---

## §1.2 Current props (the surface to preserve)

| Prop | Type | Notes |
|---|---|---|
| `columns` | `ColumnDef<TData, TValue>[]` | Caller must memoize (same contract as `IGRPDataTable`). |
| `data` | `TData[]` | One page's rows, already fetched. |
| `pagination` | `ServerPaginationState` | **Controlled**: `{ pageIndex, pageSize, totalElements, totalPages }`. |
| `onPaginationChange` | `(pageIndex: number, pageSize: number) => void` | Flat args, not a TanStack `Updater`. |
| `pageSizeOptions` | `number[]` | Defaults to `DEFAULT_SERVER_TABLE_PAGE_SIZES = [5, 10, 30, 50]`. |
| `enablePagination` | `boolean` (default `true`) | `false` renders the table only, no bar. |
| `sorting` / `onSortingChange` | `SortingState` / `(s: SortingState) => void` | **Both or neither.** Both ⇒ `manualSorting`; omitted ⇒ the table sorts the loaded page itself. |
| `getRowId` | `TableOptions<TData>["getRowId"]` | Required in practice whenever `renderSubComponent` is used — see §1.4. |
| `getRowCanExpand` | `TableOptions<TData>["getRowCanExpand"]` | Defaults to `() => false`. |
| `renderSubComponent` | `(row: Row<TData>) => ReactElement \| undefined` | Rendered in a full-width row under the expanded row. |
| `notFoundLabel` | `string` | Defaults to `"Nenhum registo encontrado."` — the DS default should be locale-neutral or English. |
| `id`, `className`, `tableClassName`, `tableHeaderClassName`, `tableBodyClassName`, `paginationClassName` | `string` | Same names/roles as `IGRPDataTableProps`. |

`ServerPaginationState` (`src/app/(myapp)/_types.ts`) is the
client mirror of Spring page metadata:

```ts
type ServerPaginationState = {
  pageIndex: number;   // 0-based
  pageSize: number;
  totalElements: number;
  totalPages: number;
};
```

---

## §1.3 Behaviour the DS component must reproduce

1. **Pagination is fully controlled.** `manualPagination: true` always;
   `pageCount: pagination.totalPages` **and** `rowCount:
   pagination.totalElements` are both fed to the table. Page index/size come
   from props on every render — the component keeps no pagination state of its
   own, so a caller can reset to page 0 on a filter change or rehydrate from a
   URL.
2. **Pagination is independent of sorting and filtering.** Server pagination
   must not force `manualSorting`/`manualFiltering`. Sorting is manual *only*
   when `sorting` and `onSortingChange` are both supplied.
3. **`enableSortingRemoval: false`** — header toggles cycle asc → desc → asc,
   never back to unsorted.
4. **Flat pagination callback.** The `Updater<PaginationState>` from TanStack is
   resolved internally against the controlled props and reported as
   `(pageIndex, pageSize)`.
5. **The bar shows whenever there are rows** (`enablePagination && data.length
   > 0`) — *not* only when `rowCount > pageSize`, which is what `IGRPDataTable`
   does today. On a single-page result the user must still be able to change
   page size.
6. **Sorting callback tolerates the functional updater** — resolve it against
   `sorting ?? []` before calling `onSortingChange`.
7. **Empty state** — one row, `colSpan={columns.length}`, `notFoundLabel`.
8. **Expanded row** — `colSpan={row.getVisibleCells().length}`, cell padding 0,
   and a literal `N/A` block when the row is expandable but no
   `renderSubComponent` was given.

---

## §1.4 The `getRowId` trap (please encode this in the DS)

Expansion state is keyed by row id, and TanStack's default row id is the row's
**index**. Without a stable `getRowId`, an expanded row stays open at that
index across a re-sort or a page change and reveals a *different* record's
sub-component. Both grouped lists pass `getRowId={(g) => g.key}` for exactly
this reason.

**This is currently reproducible in `IGRPDataTable` itself.** It accepts
`getRowCanExpand` and `renderSubComponent` but never passes `getRowId` to
`useReactTable` and does not expose it as a prop — so any consumer who combines
expandable rows with sorting or pagination has index-keyed expansion and no way
to opt out. It is worth fixing there whether or not a server-side sibling ever
ships.

Ask: expose `getRowId`, and then either require it when `renderSubComponent` is
present (type-level, via a discriminated prop pair) or warn in development when
the two are combined without it.

---

## §1.5 Column/cell layout contract

This is the part most worth lifting into the DS, because it is currently
half-component, half-app-CSS and every IGRP app re-invents it.

- **Actions column.** `isActionsColumnDef()` treats a column as the actions
  column when `columnDef.meta.isActionsColumn` is true, or its `accessorKey`/`id`
  is `actions` / ends in `actions` / ends in `_actions`. The last column being
  an actions column adds `simple-dt-has-actions` to the root, which collapses
  that column to `width: 1%; min-width: max-content; white-space: nowrap`;
  its cells also get `DATA_TABLE_ACTIONS_CELL_CLASS = "whitespace-nowrap"`.
- **Per-column cell classes.** `columnDef.meta.cellClassName` overrides the
  default cell class (used for `text-center tabular-nums` numeric columns in
  categorias, documentos-exigidos and taxas). With no override, non-actions
  cells get `truncate`.
- **Expander cell.** Any cell containing an element carrying the
  `data-land-dt-expander` attribute (set by the local
  `IGRPDataTableCellExpander`, `src/app/(myapp)/_components/expander-row.tsx`)
  collapses to `w-px`, `py-0`, `pr-0`.
- **Header widths.** `style={{ width: header.getSize() + "px" }}` on every
  `<th>` — but the app CSS then forces `width: auto !important` above
  `1024px` unless the root also carries `simple-dt-fixed` (a modifier that
  exists in CSS and is currently not emitted by any caller; a DS component
  should expose it as a `layout?: "auto" | "fixed"` prop instead of a
  class-name convention).
- **Horizontal scroll.** The table shell (`simple-dt-table-shell`) is
  `overflow-x: auto` below `1024px` and `hidden` above it, with cells switching
  from `truncate` to `overflow-wrap: anywhere` at the same breakpoint. Density
  is `padding: 8px; font-size: 13px`.
- **Spacer hack.** A trailing `<tbody aria-hidden className="table-row h-1" />`
  keeps the last row clear of the container's rounded border. A DS
  implementation should solve this with border/padding instead.

The rules above live in `src/styles/simple.css` under `.simple-dt-layout` and
are applied by `getDataTableLayoutClassName(hasActionsColumn, className, {
stacked: true })` (`stacked` adds `flex flex-col gap-4` between table and bar).
`ClientDataTable` — the app's `IGRPDataTable` wrapper — reuses the same helper
without `stacked`, so **both** tables should get this layout from the DS, not
just the server one.

---

## §1.6 Gaps to close while lifting it

1. **Loading state.** Every caller hand-rolls `relative` + `DataLoading`
   overlay. A `isLoading?: boolean` prop rendering the standard skeleton/overlay
   would remove that boilerplate from ten screens.
2. **`notFoundLabel` default** is Portuguese in the local component; the DS
   default must not be.
3. **Page-metadata mapper.** `paginationFromApiPage()` maps Spring page JSON
   (camelCase *and* snake_case, with fallbacks when the API omits totals) into
   `ServerPaginationState`. Exporting that — or a
   `useIGRPServerPagination()`/`IGRPServerPaginationState` pair — from the DS
   would stop every app from re-deriving `totalPages`.
4. **The state hook.** `useServerPaginatedResource()` is the load /
   paginate / filter / create / update / delete / toggle-status machine every
   module list wraps. It is app-shaped (it speaks `ActionResult<T>`), so it is
   probably out of scope for the DS, but the pagination half of it is not.
5. **`ClientDataTable`'s hydration guard.** The local client wrapper defers the
   first render one animation frame behind a skeleton. If that guard is working
   around something inside `IGRPDataTable`, it should be fixed there rather
   than re-implemented per app.

---

## §1.7 Proposed API

Keep the existing prop names (they already mirror `IGRPDataTableProps`), and
add the component as a sibling rather than another mode of `IGRPDataTable` —
the uncontrolled reducer and the controlled page prop do not coexist cleanly.

```ts
export type IGRPServerPaginationState = {
  pageIndex: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
};

export interface IGRPServerDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination: IGRPServerPaginationState;
  onPaginationChange: (pageIndex: number, pageSize: number) => void;
  pageSizeOptions?: number[];        // default [5, 10, 30, 50]
  enablePagination?: boolean;        // default true
  paginationType?: "simple" | "numeric";   // new: reuse IGRPDataTablePaginationNumeric
  sorting?: SortingState;            // with onSortingChange ⇒ manualSorting
  onSortingChange?: (sorting: SortingState) => void;
  isLoading?: boolean;               // new, see §1.6.1
  layout?: "auto" | "fixed";         // new, replaces the .simple-dt-fixed class
  getRowId?: TableOptions<TData>["getRowId"];
  getRowCanExpand?: TableOptions<TData>["getRowCanExpand"];
  renderSubComponent?: (row: Row<TData>) => ReactElement | undefined;
  notFoundLabel?: string;
  id?: string;
  className?: string;
  tableClassName?: string;
  tableHeaderClassName?: string;
  tableBodyClassName?: string;
  paginationClassName?: string;
}
```

Column `meta` additions to publish alongside it:

```ts
export type IGRPDataTableColumnMeta = {
  isActionsColumn?: boolean;
  cellClassName?: string;
};
```

Reuse `IGRPDataTablePagination` / `IGRPDataTablePaginationNumeric` as-is — the
local component already renders the former with `className="justify-between
max-sm:flex-col max-sm:items-stretch"`, which should become its default.

---

## §1.8 Acceptance criteria

- [ ] Changing `pagination.pageIndex`/`pageSize` from the parent moves the table
      with no internal state fighting it; the component never paginates `data`
      itself.
- [ ] With `sorting`/`onSortingChange` omitted, clicking a sortable header
      reorders only the loaded page and fires no callback.
- [ ] With both supplied, the header click reports the new `SortingState` and
      the row order does not change until new `data` arrives.
- [ ] `enableSortingRemoval` is off: asc ⇄ desc only.
- [ ] The pagination bar renders for a single-page result (so page size is
      changeable) and disappears when `data` is empty or
      `enablePagination === false`.
- [ ] An expanded row with a stable `getRowId` stays bound to its record across
      a page change and a re-sort; index-keyed expansion regressions are
      covered by a test.
- [ ] A trailing actions column stays `nowrap` and shrink-to-fit at every
      breakpoint; other cells truncate below `lg` and wrap above it.
- [ ] `meta.cellClassName` wins over both the default `truncate` and the
      actions-cell class.
- [ ] Ten SIGOVP list screens migrate by swapping the import and deleting
      `_components/server-paginated-data-table.tsx`, `_lib/data-table-layout.ts`
      and the `.simple-dt-*` block in `src/styles/simple.css`.

---

## §1.9 Reference implementation

Four TypeScript modules plus the app CSS that completes the layout contract
described in §1.5. The CSS is the part we would most like to stop maintaining:
it reaches into the rendered table with `!important` because there is no prop
for any of it.

### `src/app/(myapp)/_components/server-paginated-data-table.tsx`

```tsx
"use client";

import {
  cn,
  IGRPDataTablePagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@igrp/igrp-framework-react-design-system";
import {
  DATA_TABLE_ACTIONS_CELL_CLASS,
  DATA_TABLE_ROW_EXPANDER_ATTR,
  DATA_TABLE_TABLE_SHELL_CLASS,
  getDataTableLayoutClassName,
  hasTrailingActionsColumn,
  isActionsColumnDef,
} from "@myapp/_lib/data-table-layout";
import type { ServerPaginationState } from "@myapp/_types";
import {
  type ColumnDef,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  type PaginationState,
  type Row,
  type SortingState,
  type TableOptions,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import type { ReactElement } from "react";
import { Fragment, useCallback, useMemo, useState } from "react";

export const DEFAULT_SERVER_TABLE_PAGE_SIZES = [5, 10, 30, 50] as const;

export type ServerPaginatedDataTableProps<TData, TValue = unknown> = {
  id?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination: ServerPaginationState;
  onPaginationChange: (pageIndex: number, pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  tableClassName?: string;
  tableHeaderClassName?: string;
  tableBodyClassName?: string;
  paginationClassName?: string;
  notFoundLabel?: string;
  /** When false, only the table is rendered (no IGRP pagination bar). */
  enablePagination?: boolean;
  /**
   * Current sort, for lists that sort server-side. Pass it together with
   * `onSortingChange`: the table then stops sorting the loaded page itself
   * (`manualSorting`) and just reports header clicks, so the caller can ask
   * the API for the ordered page. Omit both to keep the default behaviour —
   * the header toggles reorder only the rows currently loaded.
   */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /**
   * Stable identity for a row, e.g. `(row) => row.key`. Expansion state is
   * keyed by row id, and the default id is the row's *index*, so without this
   * an expanded row stays open at that position when the data is re-sorted or
   * paged — revealing a different record's sub-component. Pass it whenever
   * `renderSubComponent` is used over data that can reorder.
   */
  getRowId?: TableOptions<TData>["getRowId"];
  getRowCanExpand?: TableOptions<TData>["getRowCanExpand"];
  renderSubComponent?: (row: Row<TData>) => ReactElement | undefined;
};

export function ServerPaginatedDataTable<TData, TValue>({
  id,
  columns,
  data,
  pagination,
  onPaginationChange,
  pageSizeOptions = [...DEFAULT_SERVER_TABLE_PAGE_SIZES],
  className,
  tableClassName,
  tableHeaderClassName,
  tableBodyClassName,
  paginationClassName,
  notFoundLabel = "Nenhum registo encontrado.",
  enablePagination = true,
  sorting,
  onSortingChange,
  renderSubComponent,
  getRowId,
  getRowCanExpand = () => false,
}: ServerPaginatedDataTableProps<TData, TValue>) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const manualSorting = Boolean(sorting && onSortingChange);

  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      if (!onSortingChange) return;
      const current = sorting ?? [];
      onSortingChange(
        typeof updater === "function" ? updater(current) : updater,
      );
    },
    [onSortingChange, sorting],
  );

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const current: PaginationState = {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      };
      const next = typeof updater === "function" ? updater(current) : updater;
      onPaginationChange(next.pageIndex, next.pageSize);
    },
    [onPaginationChange, pagination.pageIndex, pagination.pageSize],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: true,
    manualSorting,
    pageCount: pagination.totalPages,
    rowCount: pagination.totalElements,
    onPaginationChange: handlePaginationChange,
    ...(manualSorting ? { onSortingChange: handleSortingChange } : {}),
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
      expanded,
      ...(manualSorting ? { sorting } : {}),
    },
    onExpandedChange: setExpanded,
    ...(getRowId ? { getRowId } : {}),
    getRowCanExpand,
    enableSortingRemoval: false,
  });

  const showBar =
    enablePagination && Boolean(onPaginationChange) && data.length > 0;

  const hasActionsColumn = useMemo(
    () => hasTrailingActionsColumn(columns),
    [columns],
  );

  const layoutClassName = useMemo(
    () =>
      getDataTableLayoutClassName(hasActionsColumn, className, {
        stacked: true,
      }),
    [className, hasActionsColumn],
  );

  return (
    <div className={layoutClassName} id={id}>
      <div
        className={cn(
          DATA_TABLE_TABLE_SHELL_CLASS,
          "overflow-hidden rounded-md border",
        )}
      >
        <Table className={cn("w-full", tableClassName)}>
          <TableHeader className={tableHeaderClassName}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: `${header.getSize()}px` }}
                    className="font-semibold p-2"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={tableBodyClassName}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => {
                      const columnDef = cell.column.columnDef;
                      const cellClassNameOverride = (
                        columnDef.meta as { cellClassName?: string } | undefined
                      )?.cellClassName;
                      const isActionsCell = isActionsColumnDef(
                        columnDef as Parameters<typeof isActionsColumnDef>[0],
                      );
                      const expanderCellClass = `[&:has([${DATA_TABLE_ROW_EXPANDER_ATTR}])]:w-px [&:has([${DATA_TABLE_ROW_EXPANDER_ATTR}])]:py-0 [&:has([${DATA_TABLE_ROW_EXPANDER_ATTR}])]:pr-0`;
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "p-2 h-[inherit]",
                            expanderCellClass,
                            cellClassNameOverride ??
                              (isActionsCell
                                ? DATA_TABLE_ACTIONS_CELL_CLASS
                                : "truncate"),
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell
                        colSpan={row.getVisibleCells().length}
                        className="p-0"
                      >
                        {renderSubComponent ? (
                          renderSubComponent(row)
                        ) : (
                          <div className="flex items-center gap-2 p-3">
                            <span>N/A</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center font-semibold"
                >
                  {notFoundLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <tbody aria-hidden="true" className="table-row h-1" />
        </Table>
      </div>
      {showBar && (
        <IGRPDataTablePagination
          table={table}
          pageSize={pageSizeOptions}
          className={cn(
            "justify-between max-sm:flex-col max-sm:items-stretch",
            paginationClassName,
          )}
        />
      )}
    </div>
  );
}
```

### `src/app/(myapp)/_lib/data-table-layout.ts`

```ts
import type { ColumnDef } from "@igrp/igrp-framework-react-design-system";
import { cn } from "@/lib/utils";

export type DataTableColumnMeta = {
  isActionsColumn?: boolean;
};

export const DATA_TABLE_ACTIONS_COLUMN_META: DataTableColumnMeta = {
  isActionsColumn: true,
};

export const DATA_TABLE_ACTIONS_CELL_CLASS = "whitespace-nowrap";

export const DATA_TABLE_ROW_EXPANDER_ATTR = "data-land-dt-expander";

export const DATA_TABLE_LAYOUT_ROOT_CLASS = "simple-dt-layout";
export const DATA_TABLE_LAYOUT_ACTIONS_CLASS = "simple-dt-has-actions";
export const DATA_TABLE_TABLE_SHELL_CLASS = "simple-dt-table-shell";

function getColumnKey(col: ColumnDef<unknown, unknown>): string | undefined {
  if ("accessorKey" in col && col.accessorKey != null) {
    return String(col.accessorKey);
  }
  if ("id" in col && col.id != null) {
    return String(col.id);
  }
  return undefined;
}

export function isActionsColumnDef(col: ColumnDef<unknown, unknown>): boolean {
  const meta = col.meta as DataTableColumnMeta | undefined;
  if (meta?.isActionsColumn) return true;

  const key = getColumnKey(col);
  if (!key) return false;

  const normalized = key.toLowerCase();
  return (
    normalized === "actions" ||
    normalized.endsWith("actions") ||
    normalized.endsWith("_actions")
  );
}

export function hasTrailingActionsColumn<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
): boolean {
  const last = columns[columns.length - 1];
  if (!last) return false;
  return isActionsColumnDef(last as ColumnDef<unknown, unknown>);
}

export function getDataTableLayoutClassName(
  hasActionsColumn = false,
  className?: string,
  options?: { stacked?: boolean },
): string {
  return cn(
    options?.stacked && "flex flex-col gap-4",
    "min-w-0",
    DATA_TABLE_LAYOUT_ROOT_CLASS,
    hasActionsColumn && DATA_TABLE_LAYOUT_ACTIONS_CLASS,
    className,
  );
}
```

### `src/app/(myapp)/_lib/pagination-from-api.ts`

```ts
import type { PaginatedResponse, ServerPaginationState } from "@myapp/_types";

type ApiPage<T> = PaginatedResponse<T> & {
  total_elements?: number;
  total_pages?: number;
  total?: number;
};

/**
 * Maps Spring-style page JSON (camelCase or snake_case) into UI pagination state.
 * Falls back when the API omits totals so the pagination bar can still render.
 */
export function paginationFromApiPage<T>(
  result: ApiPage<T> | null | undefined,
  content: T[],
  pageIndex: number,
  pageSize: number,
): ServerPaginationState {
  const r = result;

  let totalElements = r?.totalElements ?? r?.total_elements ?? r?.total ?? 0;
  if (!(totalElements > 0) && content.length > 0) {
    totalElements = content.length;
  }

  let totalPages = r?.totalPages ?? r?.total_pages ?? 0;
  if (totalPages <= 0 && totalElements > 0 && pageSize > 0) {
    totalPages = Math.ceil(totalElements / pageSize);
  }
  if (totalPages <= 0) {
    totalPages = 1;
  }

  return {
    pageIndex: r?.number ?? pageIndex,
    pageSize: r?.size ?? pageSize,
    totalElements,
    totalPages: Math.max(1, totalPages),
  };
}
```

### `src/app/(myapp)/_types.ts` (excerpt)

```ts
export type ServerPaginationState = {
  pageIndex: number;   // 0-based
  pageSize: number;
  totalElements: number;
  totalPages: number;
};
```

### `src/styles/simple.css` (the `.simple-dt-*` block)

```css

/* IGRP data tables: below lg scroll horizontally; from lg fit width with wrapping cells. */
.simple-dt-layout .simple-dt-table-shell,
.simple-dt-layout > div.overflow-hidden.rounded-md {
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.simple-dt-layout thead th,
.simple-dt-layout tbody td {
  vertical-align: middle;
  padding: 8px !important;
  font-size: 13px;
}

@media (min-width: 1024px) {
  .simple-dt-layout .simple-dt-table-shell,
  .simple-dt-layout > div.overflow-hidden.rounded-md {
    overflow-x: hidden;
  }

  /* Com o modificador .simple-dt-fixed a tabela respeita `table-layout: fixed`
     e os widths por coluna (ColumnDef.size → style inline no th) em vez do
     layout auto da empresa — necessário porque o `width: auto !important`
     abaixo mata qualquer width inline. */
  .simple-dt-layout:not(.simple-dt-fixed) table {
    width: 100%;
    table-layout: auto;
  }

  .simple-dt-layout:not(.simple-dt-fixed) thead th {
    width: auto !important;
    white-space: normal;
  }

  .simple-dt-layout tbody td {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: clip !important;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .simple-dt-layout tbody td:has([data-land-dt-expander]) {
    width: 1% !important;
    white-space: nowrap !important;
    overflow-wrap: normal;
    word-break: normal;
  }

  /* Só no layout auto: com .simple-dt-fixed o `width: 1% !important` mataria o
     width inline do th de ações e, em `table-layout: fixed`, o min-width:
     max-content é ignorado — a coluna colapsava para ~1% e o espaço libertado
     inflava as restantes para lá dos `size` definidos. Tabelas fixed dimensionam
     as ações via ColumnDef.size e o nowrap via DATA_TABLE_ACTIONS_CELL_CLASS. */
  .simple-dt-layout.simple-dt-has-actions:not(.simple-dt-fixed) thead th:last-child,
  .simple-dt-layout.simple-dt-has-actions:not(.simple-dt-fixed) tbody td:last-child {
    width: 1% !important;
    min-width: max-content;
    white-space: nowrap !important;
    overflow-wrap: normal;
    word-break: normal;
  }
}

/*
  Sub-tabelas das linhas expandidas (ex.: documentos exigidos por grupo): cada
  grupo renderiza a sua própria <table> dentro do `.simple-dt-layout`, pelo que
  herdava o `table-layout: auto` acima e dimensionava as colunas pelo conteúdo
  de cada grupo — as sub-tabelas ficavam desalinhadas entre si. Com o modificador
  as larguras passam a vir do <colgroup>, que escapa ao `width: auto !important`
  que aquelas regras aplicam aos th.
*/
.simple-dt-layout .simple-subtable {
  table-layout: fixed !important;
}

.simple-dt-layout .simple-subtable thead th,
.simple-dt-layout .simple-subtable tbody td {
  vertical-align: top;
}
```
