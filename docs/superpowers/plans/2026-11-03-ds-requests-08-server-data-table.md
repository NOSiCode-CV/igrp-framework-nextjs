# DS requests — 08 Server data table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `IGRPServerDataTable`, a controlled server-paginated table, and give it and `IGRPDataTable` one column/cell layout contract (`IGRPDataTableColumnMeta`, `layout` prop).

**Architecture:** Task 1 lifts `IGRPDataTable`'s header/body rendering into an internal module with no behaviour change. The layout contract (Tailwind classes chosen per cell from typed column `meta`) goes into that module, so both tables get it. `IGRPServerDataTable` is a sibling in `server.tsx`: it holds only expansion state, reads pagination from props on every render and reuses the shared rows, the existing pagination bars and `IGRPLoadingSpinner`.

**Tech Stack:** React 19, TanStack Table 8.21, Tailwind v4.3, Vitest + Testing Library (jsdom).

**Spec:** `packages/design-system/docs/design-system-requests/01-igrp-server-data-table.md` §1.1–§1.8. Roadmap: `docs/superpowers/plans/2026-11-03-ds-requests-roadmap.md`. Depends on plan 01 (`getRowId` on `IGRPDataTable`, plus its dev warning and `__tests__/row-id.test.tsx`).

## Global Constraints

- All paths are relative to `packages/design-system/` unless they start with `docs/`, `plugins/` or `packages/`.
- Relative imports carry a `.js` extension. Every new module under `data-table/` that renders TanStack state starts with `"use client"` then `"use no memo"`, like `index.tsx` and `pagination.tsx`. A pure-function module gets neither. `src/__tests__/client-boundaries.test.ts` checks both cases.
- Every re-export in `src/index.ts` is explicit, with no `export *` and no `as` aliasing.
- No hardcoded user-visible strings. The catalog keys this plan needs already exist: `dataTable.notFound` ("Nenhum registo encontrado."), `dataTable.notAvailable` ("N/D"), `loadingSpinner.label`. **No new i18n keys.** Gate: `pnpm lint:i18n:framework` (repo root).
- No `dark:` in Horizon and no raw palette colours (`igrp/token-policy`). No new stylesheet. Layout is done with Tailwind utilities on cells only.
- `pageSizeOptions` default for the server table: `[5, 10, 30, 50]`. `IGRPDataTable` keeps `[50, 100, 150, 200]`.
- Changesets are `patch`, package `@igrp/igrp-framework-react-design-system`. Commit messages have no `Co-Authored-By` trailer.
- Test command: `pnpm exec vitest run <file>` from `packages/design-system/`. Lint: `pnpm exec eslint <files>`. Types: `pnpm typecheck`.
- Declined and recorded in Task 6's Status line, not implemented: `paginationFromApiPage` and `useServerPaginatedResource` (both app-shaped), and the name-based actions-column heuristic (`id` ending in `actions` also matches `transactions`; consumers set `meta.isActionsColumn` instead).

## Review Focus

1. A parent that does **not** re-render after `onPaginationChange` (for example, a fetch still in flight) must leave the bar on the old page. The table has no state of its own to drift into. Covered by Task 3's "does not move until the parent does".
2. A page-size change from page 2 must report the page index TanStack derives (`floor(pageIndex*oldSize/newSize)`) rather than keeping the stale index. Task 3 covers it with the Select.
3. `data` longer than `pageSize` (a server that ignores `size`): every row renders, with no slicing. Task 3 covers it.
4. `meta.cellClassName` on the actions column itself must win over the nowrap/shrink classes. Task 2 covers it.
5. `IGRPDataTable` callers that set no `meta` and no `layout` must keep their markup except for the new cell wrap/truncate classes. Task 1's characterization tests stay green through Task 2.

---

### Task 1: Extract the shared table rows (pure refactor)

**Files:**
- Create: `src/components/horizon/data-table/table-rows.tsx`
- Modify: `src/components/horizon/data-table/index.tsx:377-382` (`NotFoundRowSubComponent`), `:454-543` (header/body/spacer JSX), plus plan 01's `getRowId` warning effect
- Test: `src/components/horizon/data-table/__tests__/table-rows.test.tsx` (create; characterization tests written **before** the move)

**Interfaces:**
- Consumes: plan 01's warning effect in `index.tsx` and its message.
- Produces (Tasks 2–3 rely on these exact names; none of them is exported from `src/index.ts`):

```ts
interface IGRPDataTableHeaderRowsProps<TData> { table: Table<TData> }
function IGRPDataTableHeaderRows<TData>(props: IGRPDataTableHeaderRowsProps<TData>): ReactElement
// renders table.getHeaderGroups() exactly as index.tsx:457-484 does today, aria-sort included

interface IGRPDataTableBodyRowsProps<TData> {
  table: Table<TData>
  /** colSpan of the empty-state cell. */
  emptyColSpan: number
  notFoundLabel: string
  renderSubComponent?: (row: Row<TData>) => ReactElement | undefined
  /** Classes for the full-width cell of an expanded row. */
  expandedCellClassName?: string
}
function IGRPDataTableBodyRows<TData>(props: IGRPDataTableBodyRowsProps<TData>): ReactElement
// renders the row Fragments + expanded row + empty row; owns NotFoundRowSubComponent (reads i18n.dataTable.notAvailable)

function useIGRPDataTableRowIdWarning(componentName: string, hasSubComponent: boolean, hasRowId: boolean): void
// plan 01's effect, moved here; message prefix becomes `${componentName}:`
```

`IGRPDataTable` keeps the `<TableHeader>`/`<TableBody>` wrappers (so `tableHeaderClassName`/`tableBodyClassName` stay where they are) and the trailing spacer `<tbody>`. It passes `emptyColSpan={allColumns.length}` and calls `useIGRPDataTableRowIdWarning("IGRPDataTable", !!renderSubComponent, !!getRowId)`.

- [ ] **Step 1: Write characterization tests against today's `IGRPDataTable`**

```tsx
// columns: an expander display column (IGRPDataTableCellExpander) + col.accessor("name", { header: ({ column }) => <IGRPDataTableHeaderSortToggle column={column} title="Nome" /> })
it("renders one empty cell spanning every column, including the actions column", () => {
  render(<IGRPDataTable columns={columns} data={[]} actions={[{ type: "link", label: "Ver", href: () => "/x" }]} />)
  const cell = screen.getByText("Nenhum registo encontrado.")
  expect(cell.tagName).toBe("TD")
  expect(cell).toHaveAttribute("colspan", "3")
})
it("renders the N/D block in a full-width row when expanded without renderSubComponent", async () => {
  render(<IGRPDataTable columns={columns} data={data} getRowCanExpand={() => true} getRowId={(r) => r.id} />)
  await userEvent.click(screen.getAllByRole("button", { name: "Expandir detalhes" })[0])
  expect(screen.getByText("N/D").closest("td")).toHaveAttribute("colspan", "2")
})
it("sets aria-sort on a sortable column header", async () => {
  render(<IGRPDataTable columns={columns} data={data} />)
  const th = screen.getByRole("columnheader", { name: /Nome/ })
  expect(th).toHaveAttribute("aria-sort", "none")
  await userEvent.click(screen.getByRole("button", { name: /Nome/ }))
  expect(th).toHaveAttribute("aria-sort", "ascending")
})
```

- [ ] **Step 2: Run them and confirm they PASS against the unrefactored code**

Run: `pnpm exec vitest run src/components/horizon/data-table`
Expected: all pass. These tests pin current behaviour, so a failure here means the test is wrong, not the code.

- [ ] **Step 3: Move the JSX into `table-rows.tsx` and switch `index.tsx` over to it**

Move it as-is: same classes, same keys, same `data-state`. Delete the commented-out `className` blocks while moving.

- [ ] **Step 4: Run the data-table suite, plan 01's row-id tests and the boundary test**

Run: `pnpm exec vitest run src/components/horizon/data-table src/__tests__/client-boundaries.test.ts`
Expected: all pass with no test edited. Then `pnpm typecheck` and `pnpm exec eslint src/components/horizon/data-table`, both clean.

- [ ] **Step 5: Commit (no changeset: nothing user-visible)**

```bash
git add packages/design-system/src/components/horizon/data-table
git commit -m "refactor(design-system): extract IGRPDataTable header and body rows into a shared module"
```

---

### Task 2: Column/cell layout contract on `IGRPDataTable`

**Files:**
- Modify: `src/components/horizon/data-table/types.ts` (add the meta type and the TanStack augmentation)
- Create: `src/components/horizon/data-table/layout.ts` (pure functions, no directive)
- Modify: `src/components/horizon/data-table/table-rows.tsx` (use them), `index.tsx:53-127` (prop `layout`), `index.tsx:288-295` (actions column gets `meta: { isActionsColumn: true }`), `index.tsx:455` (`<Table>` gets the layout class)
- Modify: `src/index.ts` (add `IGRPDataTableColumnMeta`, `IGRPDataTableLayout` to the `types.js` type export at line 615)
- Test: `src/components/horizon/data-table/__tests__/layout.test.tsx` (create)

**Interfaces:**
- Consumes: `IGRPDataTableHeaderRows`, `IGRPDataTableBodyRows` from Task 1.
- Produces:

```ts
// types.ts
export interface IGRPDataTableColumnMeta {
  /** Marks the row-actions column: nowrap, and shrink-to-fit under layout "auto". */
  isActionsColumn?: boolean
  /** Replaces the default cell classes (`truncate`/wrap, or the actions classes). */
  cellClassName?: string
}
export type IGRPDataTableLayout = "auto" | "fixed"
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TanStack's signature
  interface ColumnMeta<TData extends RowData, TValue> extends IGRPDataTableColumnMeta {}
}

// layout.ts
export function igrpDataTableCellClassName(meta: IGRPDataTableColumnMeta | undefined, layout: IGRPDataTableLayout): string
export function igrpDataTableHeadClassName(meta: IGRPDataTableColumnMeta | undefined, layout: IGRPDataTableLayout): string
export function igrpDataTableHeadStyle(column: Column<unknown, unknown>, layout: IGRPDataTableLayout): CSSProperties | undefined
export function igrpDataTableTableClassName(layout: IGRPDataTableLayout): string

// IGRPDataTableHeaderRowsProps and IGRPDataTableBodyRowsProps both gain: layout: IGRPDataTableLayout
// IGRPDataTableProps gains: /** Column sizing. "auto" fits content; "fixed" honours ColumnDef.size. Default "auto". */ layout?: IGRPDataTableLayout
```

The package does not augment `ColumnMeta` today (`grep -rn "ColumnMeta\|declare module" src` finds nothing), so this is the only augmentation. The `__igrp_actions__` column keeps its `size`.

Values:

| Function | Return value |
| --- | --- |
| `igrpDataTableCellClassName`, `meta.cellClassName` set | `meta.cellClassName` only. It replaces the default, so `truncate` and the actions classes are dropped. |
| `igrpDataTableCellClassName`, actions column, `"auto"` | `"w-px whitespace-nowrap"` |
| `igrpDataTableCellClassName`, actions column, `"fixed"` | `"whitespace-nowrap"` |
| `igrpDataTableCellClassName`, any other column | `"truncate lg:overflow-visible lg:text-clip lg:whitespace-normal lg:wrap-anywhere"` |
| `igrpDataTableHeadClassName`, actions column | the same as the cell, without `cellClassName` |
| `igrpDataTableHeadClassName`, any other column | `""` under `"fixed"`; `"lg:whitespace-normal"` under `"auto"` |
| `igrpDataTableHeadStyle` | `{ width: \`${column.getSize()}px\` }` unless the layout is `"auto"` and the column is the actions column. In that case it returns `undefined`, so `w-px` is not overridden. |
| `igrpDataTableTableClassName` | `"table-fixed"` for `"fixed"`, `""` for `"auto"` |

In `table-rows.tsx` these classes are appended after the existing `h-[inherit] p-3 [&:has([aria-expanded])]:…` cell classes. They replace the `truncate` currently in that string.

The `Table` primitive already wraps `<table>` in `overflow-x-auto` (`primitives/table.tsx:8`), so horizontal scroll below `lg` needs no shell change. Density (8px/13px) stays the app's call.

- [ ] **Step 1: Write the failing tests (classes only, no rendered layout)**

```tsx
it("truncates ordinary cells below lg and wraps them from lg", () => {
  render(<IGRPDataTable columns={columns} data={data} />)
  const td = screen.getByText("Ana").closest("td")!
  expect(td).toHaveClass("truncate", "lg:whitespace-normal", "lg:wrap-anywhere")
})
it("makes a meta.isActionsColumn column nowrap and shrink-to-fit under layout auto", () => {
  // last column: col.display({ id: "ops", meta: { isActionsColumn: true }, cell: () => "Editar" })
  const td = screen.getByText("Editar").closest("td")!
  expect(td).toHaveClass("w-px", "whitespace-nowrap")
  expect(td).not.toHaveClass("truncate")
  expect(screen.getAllByRole("columnheader").at(-1)).not.toHaveAttribute("style")
})
it("marks the generated actions column as the actions column", () => {
  render(<IGRPDataTable columns={columns} data={data} actions={[{ type: "link", label: "Ver", href: () => "/x" }]} />)
  expect(screen.getByRole("link", { name: "Ver" }).closest("td")).toHaveClass("w-px", "whitespace-nowrap")
})
it("lets meta.cellClassName win over truncate and over the actions classes", () => {
  // name column meta: { cellClassName: "text-center tabular-nums" }; ops column meta: { isActionsColumn: true, cellClassName: "text-right" }
  const nameTd = screen.getByText("Ana").closest("td")!
  expect(nameTd).toHaveClass("text-center", "tabular-nums")
  expect(nameTd).not.toHaveClass("truncate")
  const opsTd = screen.getByText("Editar").closest("td")!
  expect(opsTd).toHaveClass("text-right")
  expect(opsTd).not.toHaveClass("w-px")
})
it("layout fixed sets table-fixed and keeps every header width", () => {
  render(<IGRPDataTable columns={columnsWithOps} data={data} layout="fixed" />)
  expect(screen.getByRole("table")).toHaveClass("table-fixed")
  for (const th of screen.getAllByRole("columnheader")) expect(th.style.width).toMatch(/px$/)
})
it("accepts meta without a cast", () => {
  // compile-time: col.accessor("name", { meta: { cellClassName: "x", isActionsColumn: false } }) — `pnpm typecheck` covers it
})
```

- [ ] **Step 2: Run them and confirm they FAIL**

Run: `pnpm exec vitest run src/components/horizon/data-table/__tests__/layout.test.tsx`
Expected: the class assertions fail, and the test for the `layout` prop fails because the prop does not exist yet.

- [ ] **Step 3: Implement the types, `layout.ts` and the wiring, as in the Interfaces block**

- [ ] **Step 4: Run the data-table suite, typecheck and lint**

Run: `pnpm exec vitest run src/components/horizon/data-table src/__tests__/client-boundaries.test.ts && pnpm typecheck && pnpm exec eslint src/components/horizon/data-table`
Expected: all pass. Task 1's characterization tests stay green unchanged.

- [ ] **Step 5: Changeset and commit**

Changeset `.changeset/ds-data-table-layout.md` (patch): "`IGRPDataTable`: cells now truncate below `lg` and wrap from `lg`. Mark a column with `meta.isActionsColumn` to keep it on one line and shrink it to fit; the generated `actions` column already is. `meta.cellClassName` replaces a column's default cell classes. New `layout` prop: `"fixed"` honours `ColumnDef.size`. Column `meta` is typed as `IGRPDataTableColumnMeta`."

```bash
git add packages/design-system/src .changeset/ds-data-table-layout.md
git commit -m "feat(design-system): column layout contract for IGRPDataTable (meta.isActionsColumn, meta.cellClassName, layout)"
```

---

### Task 3: `IGRPServerDataTable` (pagination, sorting, empty, expansion)

**Files:**
- Create: `src/components/horizon/data-table/server.tsx`
- Modify: `src/components/horizon/data-table/types.ts` (add `IGRPServerPaginationState`)
- Modify: `src/index.ts` (after line 530: `export { IGRPServerDataTable, type IGRPServerDataTableProps } from "./components/horizon/data-table/server.js"`; add `IGRPServerPaginationState` to the `types.js` type export)
- Test: `src/components/horizon/data-table/__tests__/server.test.tsx` (create)

**Interfaces:**
- Consumes: Task 1's `IGRPDataTableHeaderRows`, `IGRPDataTableBodyRows` and `useIGRPDataTableRowIdWarning`. Task 2's `IGRPDataTableLayout`, `igrpDataTableTableClassName` and the `layout` prop on both row components. `IGRPDataTablePagination` from `./pagination.js`.
- Produces:

```ts
// types.ts
export interface IGRPServerPaginationState {
  /** 0-based. */
  pageIndex: number
  pageSize: number
  totalElements: number
  totalPages: number
}

// server.tsx
interface IGRPServerDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pagination: IGRPServerPaginationState
  onPaginationChange: (pageIndex: number, pageSize: number) => void
  pageSizeOptions?: number[]            // default [5, 10, 30, 50]
  enablePagination?: boolean            // default true
  paginationType?: "simple" | "numeric" // default "simple" (Task 4)
  sorting?: SortingState                // with onSortingChange ⇒ manualSorting
  onSortingChange?: (sorting: SortingState) => void
  isLoading?: boolean                   // default false (Task 4)
  layout?: IGRPDataTableLayout          // default "auto"
  getRowId?: TableOptions<TData>["getRowId"]
  getRowCanExpand?: TableOptions<TData>["getRowCanExpand"] // default () => false
  renderSubComponent?: (row: Row<TData>) => ReactElement | undefined
  notFoundLabel?: string                // default i18n.dataTable.notFound
  id?: string
  className?: string
  tableClassName?: string
  tableHeaderClassName?: string
  tableBodyClassName?: string
  paginationClassName?: string
}
function IGRPServerDataTable<TData, TValue>(props: IGRPServerDataTableProps<TData, TValue>): ReactElement
```

`useReactTable` options:
- `manualPagination: true`, `pageCount: pagination.totalPages`, `rowCount: pagination.totalElements`.
- `state.pagination` is `{ pageIndex, pageSize }` from props. There is no `getPaginationRowModel`.
- `onPaginationChange` resolves the `Updater<PaginationState>` against the props and calls `onPaginationChange(next.pageIndex, next.pageSize)`.
- `manualSorting = !!(sorting && onSortingChange)`. When it is true, pass `state.sorting = sorting` and an `onSortingChange` that resolves the updater against `sorting ?? []`. Otherwise sorting is internal: omit both and let TanStack keep it with `getSortedRowModel()`.
- `enableSortingRemoval: false`.
- `expanded` lives in `useState`. Set `onExpandedChange`, `getExpandedRowModel()` and `autoResetExpanded: false`, with the same reason as `index.tsx:336-341`.
- Pass `getRowId` and `getRowCanExpand` through. No `manualFiltering`, no row selection.

Markup:
- Root: `<div id className={cn("flex flex-col gap-4", className)}>`.
- Shell: `<div className="relative overflow-hidden rounded-md border">`, with `<Table className={cn(igrpDataTableTableClassName(layout), tableClassName)}>`.
- Body: `IGRPDataTableBodyRows` with `emptyColSpan={columns.length}` and `expandedCellClassName="p-0"`, plus the same spacer `<tbody>` as `IGRPDataTable`.
- Bar: rendered when `enablePagination && data.length > 0`, as `IGRPDataTablePagination` with `pageSize={pageSizeOptions}` and `className={cn("justify-between max-sm:flex-col max-sm:items-stretch", paginationClassName)}`.
- Call `useIGRPDataTableRowIdWarning("IGRPServerDataTable", !!renderSubComponent, !!getRowId)`.

- [ ] **Step 1: Write the failing tests**

```tsx
type R = { id: string; name: string }
const page = (n: number): R[] => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, name: `Nome ${i}` }))
const p = (o: Partial<IGRPServerPaginationState> = {}) => ({ pageIndex: 0, pageSize: 10, totalElements: 25, totalPages: 3, ...o })

it("reports the next page flat and does not move until the parent does", async () => {
  const onPage = vi.fn()
  const { rerender } = render(<IGRPServerDataTable columns={columns} data={page(10)} pagination={p()} onPaginationChange={onPage} />)
  await userEvent.click(screen.getByRole("button", { name: "Ir para a página seguinte" }))
  expect(onPage).toHaveBeenCalledWith(1, 10)
  expect(screen.getByText("1-10")).toBeInTheDocument()
  rerender(<IGRPServerDataTable columns={columns} data={page(10)} pagination={p({ pageIndex: 1 })} onPaginationChange={onPage} />)
  expect(screen.getByText("11-20")).toBeInTheDocument()
})
it("reports a page-size change with TanStack's derived page index", async () => {
  // pagination p({ pageIndex: 1 }); open the combobox, pick option "30"
  expect(onPage).toHaveBeenCalledWith(0, 30)
})
it("never paginates data itself", () => {
  render(<IGRPServerDataTable columns={columns} data={page(12)} pagination={p()} onPaginationChange={() => {}} />)
  expect(screen.getAllByRole("row")).toHaveLength(13) // header + 12 (the spacer tbody's row is aria-hidden)
})
it("sorts the loaded page and fires no callback when sorting props are omitted", async () => {
  // data [{name:"Bruno"},{name:"Ana"}]; click the "Nome" sort toggle
  expect(firstBodyCellTexts()).toEqual(["Ana", "Bruno"])
})
it("reports SortingState and keeps row order when sorting and onSortingChange are given", async () => {
  const onSort = vi.fn()
  // sorting={[]} onSortingChange={onSort}; click "Nome"
  expect(onSort).toHaveBeenCalledWith([{ id: "name", desc: false }])
  expect(firstBodyCellTexts()).toEqual(["Bruno", "Ana"])
})
it("cycles asc and desc only, never back to unsorted", async () => {
  // internal sorting; click "Nome" three times, reading the header's aria-sort each time
  expect(seen).toEqual(["ascending", "descending", "ascending"])
})
it("shows the bar for a single-page result", () => {
  render(<IGRPServerDataTable columns={columns} data={page(2)} pagination={p({ totalElements: 2, totalPages: 1 })} onPaginationChange={() => {}} />)
  expect(screen.getByRole("combobox")).toBeInTheDocument()
})
it("hides the bar when data is empty and when enablePagination is false", () => { /* two renders, queryByRole("combobox") null in both */ })
it("renders the empty row spanning every column with the catalog default", () => {
  // two columns, data []
  expect(screen.getByText("Nenhum registo encontrado.")).toHaveAttribute("colspan", "2")
})
it("uses notFoundLabel when given", () => { /* notFoundLabel="Nenhuma taxa encontrada." is the cell text */ })
it("renders the expanded row full width with no padding, and N/D without renderSubComponent", async () => {
  // getRowCanExpand={() => true} getRowId={(r) => r.id}; expand the first row
  const td = screen.getByText("N/D").closest("td")!
  expect(td).toHaveAttribute("colspan", "2")
  expect(td).toHaveClass("p-0")
})
it("keeps an expanded row bound to its record across a page change and a re-sort with getRowId", async () => {
  // page 1 data [Bruno(id b), Ana(id a)], renderSubComponent row => <p>detalhe {name}</p>; expand Bruno
  // re-sort asc → still "detalhe Bruno", no "detalhe Ana"
  // rerender with pagination pageIndex 1 and data [Carla(id c), Bruno(id b)] → "detalhe Bruno" still shown, no "detalhe Carla"
})
it("without getRowId the expansion follows the index (the regression getRowId fixes)", async () => {
  // same flow without getRowId (silence the warn spy) → after the re-sort "detalhe Ana" is shown: pins why the prop exists
})
it("warns once in development when renderSubComponent is set without getRowId", () => {
  // same shape as plan 01's test; message matches /^IGRPServerDataTable:.*getRowId/
})
```

- [ ] **Step 2: Run them and confirm they FAIL** (the module `../server.js` does not exist)

Run: `pnpm exec vitest run src/components/horizon/data-table/__tests__/server.test.tsx`

- [ ] **Step 3: Implement `IGRPServerPaginationState` and `server.tsx` as in the Interfaces block, then add the exports to `src/index.ts`**

- [ ] **Step 4: Run the suite, the boundary test, typecheck and lint**

Run: `pnpm exec vitest run src/components/horizon/data-table src/__tests__/client-boundaries.test.ts && pnpm typecheck && pnpm exec eslint src/components/horizon/data-table src/index.ts`
Expected: all pass.

- [ ] **Step 5: Commit** (the changeset goes in with Task 5 so the release note describes the finished component)

```bash
git add packages/design-system/src
git commit -m "feat(design-system): add IGRPServerDataTable, a controlled server-paginated table"
```

---

### Task 4: `paginationType` and `isLoading`

**Files:**
- Modify: `src/components/horizon/data-table/server.tsx`
- Test: `src/components/horizon/data-table/__tests__/server.test.tsx` (extend)

**Interfaces:**
- Consumes: `IGRPDataTablePaginationNumeric` from `./pagination.js`, `IGRPLoadingSpinner` from `../loading-spinner.js`.
- Produces: no new names. The two props behave as below.
  - `paginationType === "numeric"`: render `IGRPDataTablePaginationNumeric` with the same `pageSize` and `className` as the simple bar. It is shown under the same condition.
  - `isLoading`: the shell gets `aria-busy="true"`. Inside the shell, an overlay `<div className="absolute inset-0 flex items-center justify-center bg-background/60">` holds `<IGRPLoadingSpinner parentClassName="h-auto" />`. Rows stay rendered beneath it, so the page does not jump while the next one loads.

- [ ] **Step 1: Write the failing tests**

```tsx
it("renders numbered pages with paginationType numeric and reports a page click flat", async () => {
  // p({ totalPages: 3 }); click the button named "2" (IGRPDataTablePaginationNumeric's page button)
  expect(onPage).toHaveBeenCalledWith(1, 10)
})
it("overlays the loading spinner and marks the table busy while isLoading", () => {
  const { rerender } = render(<IGRPServerDataTable {...base} isLoading />)
  expect(screen.getByRole("status")).toHaveTextContent(IGRP_I18N_DEFAULTS_PT.loadingSpinner.label)
  expect(screen.getByRole("table").closest("[aria-busy]")).toHaveAttribute("aria-busy", "true")
  expect(screen.getAllByRole("row").length).toBeGreaterThan(1) // rows still rendered
  rerender(<IGRPServerDataTable {...base} />)
  expect(screen.queryByRole("status")).toBeNull()
})
```

Before writing the first test, read `pagination.tsx:150-258` to get the numeric page button's accessible name and use that name in the test.

- [ ] **Step 2: Run them and confirm they FAIL**

Run: `pnpm exec vitest run src/components/horizon/data-table/__tests__/server.test.tsx -t "numeric|isLoading"`

- [ ] **Step 3: Implement both props**

- [ ] **Step 4: Run the file again and confirm PASS. Also run `pnpm lint:i18n:framework` from the repo root (needs `pnpm build:i18n-tools`); expected: no findings.**

- [ ] **Step 5: Commit**

```bash
git add packages/design-system/src/components/horizon/data-table
git commit -m "feat(design-system): IGRPServerDataTable numeric pagination and loading overlay"
```

---

### Task 5: Docs, story, changeset

**Files:**
- Modify: `plugins/igrp/skills/design-system/references/data-table.md`. Add an `## IGRPServerDataTable` section after `## Server-side mode` (line 155), add `layout` to the props table at line 89, and add a `## Column layout (meta)` section.
- Create: `packages/design-system-storybook/src/stories/server-data-table.stories.tsx`
- Create: `.changeset/ds-server-data-table.md`

**Interfaces:**
- Consumes: every public name from Tasks 2–4.
- Produces: nothing in code.

- [ ] **Step 1: Write the skill reference**

`IGRPServerDataTable` section:
- A props table that matches Task 3's interface.
- An example with `pagination` held in `useState`, reset to `pageIndex: 0` on a filter change.
- Three rules, one line each: `onPaginationChange` gets flat `(pageIndex, pageSize)`; pass `sorting` and `onSortingChange` together or omit both; pass `getRowId` with `renderSubComponent`.
- One line on when to pick it over `IGRPDataTable` + `onQueryChange`: the caller owns the page index.

Meta section: `meta.isActionsColumn`, `meta.cellClassName`, `layout`, and the `lg` truncate/wrap rule.

- [ ] **Step 2: Write the story**

Add stories `Default`, `SinglePage`, `Expandable` (with `getRowId`), `Numeric` and `Loading`. A `render` wrapper holds `pagination` in `useState` and slices a fixture array, standing in for the server. Import from `@igrp/igrp-framework-react-design-system`, as `data-table.stories.tsx` does.

- [ ] **Step 3: Verify the story builds**

Run: `pnpm build:ds && pnpm --filter @igrp/igrp-framework-react-design-system-storybook build-storybook`
Expected: the build succeeds. New snapshots are created on the next `test-storybook:update-snapshots`. Do not update existing snapshots unless Task 2's cell classes changed them, and if they did, say so in the commit.

- [ ] **Step 4: Changeset**

`.changeset/ds-server-data-table.md` (patch): "New `IGRPServerDataTable`, a controlled, server-paginated table. The parent owns `pagination` (`IGRPServerPaginationState`) and gets `onPaginationChange(pageIndex, pageSize)`. Sorting is manual only when `sorting` and `onSortingChange` are both given. The pagination bar shows whenever there are rows. Also takes `paginationType`, `isLoading`, `layout` and `getRowId`."

- [ ] **Step 5: Commit**

```bash
git add plugins/igrp/skills/design-system/references/data-table.md packages/design-system-storybook/src/stories/server-data-table.stories.tsx .changeset/ds-server-data-table.md
git commit -m "docs(design-system): IGRPServerDataTable reference, story and changeset"
```

---

### Task 6: Investigate the hydration guard (§1.6.5) and close the request

**Files:**
- Test: `src/components/horizon/data-table/__tests__/hydration.test.tsx` (create; keep it either way, as a guard)
- Modify: `packages/design-system/docs/design-system-requests/01-igrp-server-data-table.md` (a `**Status:**` line under the title and a short finding under §1.6 item 5)

**Interfaces:**
- Consumes: `IGRPDataTable`, `IGRPServerDataTable`.
- Produces: nothing in code. If the test finds a mismatch, stop and report it. The fix is a separate change and is not part of this plan.

- [ ] **Step 1: Write the hydration test**

```tsx
it.each([
  ["IGRPDataTable", () => <IGRPDataTable columns={columns} data={data} showPagination actions={actions} />],
  ["IGRPServerDataTable", () => <IGRPServerDataTable columns={columns} data={data} pagination={p()} onPaginationChange={() => {}} />],
])("%s hydrates without a mismatch", async (_, ui) => {
  const container = document.createElement("div")
  container.innerHTML = renderToString(ui())            // react-dom/server
  document.body.append(container)
  const errors = vi.spyOn(console, "error").mockImplementation(() => {})
  const onRecoverableError = vi.fn()
  await act(async () => { hydrateRoot(container, ui(), { onRecoverableError }) })
  expect(onRecoverableError).not.toHaveBeenCalled()
  expect(errors).not.toHaveBeenCalled()
  errors.mockRestore()
})
```

Wrap both renders in the same `IGRPI18nProvider` if the default context alone differs between server and client.

- [ ] **Step 2: Run it**

Run: `pnpm exec vitest run src/components/horizon/data-table/__tests__/hydration.test.tsx`
Expected: PASS rules the guard out, and the finding is "no mismatch in the DS table; the app guard can go". On FAIL, record the error text. The finding is then "reproduced: <message>", and the fix is filed as a `KNOWN-ISSUES.md` entry per the root `CLAUDE.md`. Do not fix it here.

- [ ] **Step 3: Write the Status line and the finding**

Under the title, in the style of `11-igrp-multi-select.md:3`, write: `**Status:** resolved in the release after \`0.2.0-beta.10\` by \`IGRPServerDataTable\` and \`IGRPDataTableColumnMeta\` · **Declined:** \`paginationFromApiPage\`, \`useServerPaginatedResource\` (app-shaped), the name-based actions-column match (use \`meta.isActionsColumn\`) · **Open:** row selection (see \`packages/design-system/KNOWN-ISSUES.md\`)`. Under §1.6 item 5, add one paragraph with the finding from Step 2.

- [ ] **Step 4: Commit**

```bash
git add packages/design-system/src/components/horizon/data-table/__tests__/hydration.test.tsx packages/design-system/docs/design-system-requests/01-igrp-server-data-table.md
git commit -m "test(design-system): data tables hydrate without mismatch; close request §1"
```

---

## Open questions

1. **Row selection** stays in `KNOWN-ISSUES.md`, and `IGRPServerDataTable` ships without it. Its API (controlled `rowSelection` vs `onSelectionChange(rows)`, page-scoped select-all) is still undecided. Once `getRowId` exists on both tables, the stable-key half of that entry is done.
2. **`IGRPDataTable`'s bar gate** (`getRowCount() > pageSize`, `index.tsx:545`) is unchanged. The spec's "show whenever there are rows" is applied to the server table only. Changing it on `IGRPDataTable` is a behaviour change nobody asked for there.
3. **Bar default class.** §1.7 asks for `justify-between max-sm:flex-col max-sm:items-stretch` to become `IGRPDataTablePagination`'s default. The plan applies it only from `IGRPServerDataTable`, so existing `IGRPDataTable` bars do not move.
4. **"Trailing" actions column.** The contract applies to any column with `meta.isActionsColumn`, wherever it sits. The spec's root-level "last column" switch is not needed once the classes live on the cells.
5. **Spacer `<tbody>`** (§1.5, "spacer hack") is kept as it is in both tables. Replacing it with padding is cosmetic and would churn the Storybook snapshots.
