# Design System DataTable API Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce `createIGRPColumnHelper<TData>()`, a unified `actions` prop, declarative column-level `filter` descriptors, a single `onQueryChange` callback for server-side mode, and a unified `pagination` prop.

**Architecture:** The column helper wraps TanStack's `createColumnHelper` with IGRP shortcuts. `IGRPDataTable` reads the column definitions to auto-render filters in the toolbar and decide action layout (≤2 → icon buttons, >2 → dropdown). All existing sub-components remain available as escape hatches. No breaking changes to the raw TanStack API — existing `ColumnDef` arrays continue to work.

**Tech Stack:** TanStack Table v8, TypeScript generics, React 19, CVA

**Prerequisite:** Run `ds-quick-cleanup` plan first (removes deleted components that would clutter diffs).

---

## File Map

**Create:**
- `packages/design-system/src/components/horizon/data-table/column-helper.ts` — `createIGRPColumnHelper`, `IGRPColumnDef`, cell-type resolution
- `packages/design-system/src/components/horizon/data-table/types.ts` — shared types for actions, filter descriptors, pagination config

**Modify:**
- `packages/design-system/src/components/horizon/data-table/index.tsx` — consume new props: `actions`, `onQueryChange`, `pagination`
- `packages/design-system/src/index.ts` — export new public API

---

### Task 1: Create shared types

**Files:**
- Create: `packages/design-system/src/components/horizon/data-table/types.ts`

- [ ] **Step 1: Write the types file**

Create `packages/design-system/src/components/horizon/data-table/types.ts`:

```ts
import type { Row } from "@tanstack/react-table"

// ─── Actions ────────────────────────────────────────────────────────────────

export type IGRPDataTableActionType = "link" | "alert" | "modal" | "custom"

export interface IGRPDataTableActionBase<TData> {
  type: IGRPDataTableActionType
  label: string
  icon?: string                         // IGRPIconName
  hidden?: (row: Row<TData>) => boolean
  disabled?: (row: Row<TData>) => boolean
}

export interface IGRPDataTableActionLink<TData> extends IGRPDataTableActionBase<TData> {
  type: "link"
  href: (row: Row<TData>) => string
}

export interface IGRPDataTableActionAlert<TData> extends IGRPDataTableActionBase<TData> {
  type: "alert"
  title: string
  description?: string
  onConfirm: (row: Row<TData>) => void | Promise<void>
}

export interface IGRPDataTableActionModal<TData> extends IGRPDataTableActionBase<TData> {
  type: "modal"
  render: (row: Row<TData>, close: () => void) => React.ReactNode
}

export interface IGRPDataTableActionCustom<TData> extends IGRPDataTableActionBase<TData> {
  type: "custom"
  render: (row: Row<TData>) => React.ReactNode
}

export type IGRPDataTableAction<TData> =
  | IGRPDataTableActionLink<TData>
  | IGRPDataTableActionAlert<TData>
  | IGRPDataTableActionModal<TData>
  | IGRPDataTableActionCustom<TData>

// ─── Filter descriptors ──────────────────────────────────────────────────────

export type IGRPDataTableFilterType =
  | "input"
  | "select"
  | "dropdown"
  | "faceted"
  | "date"
  | "range"

export interface IGRPDataTableFilterDescriptor {
  type: IGRPDataTableFilterType
  placeholder?: string
  options?: { label: string; value: string }[]  // for select/dropdown/faceted
  render?: (column: unknown) => React.ReactNode  // custom filter escape hatch
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface IGRPDataTablePaginationConfig {
  type?: "simple" | "numeric"
  pageSizeOptions?: number[]
  defaultPageSize?: number
}

// ─── Server-side query ───────────────────────────────────────────────────────

export interface IGRPDataTableQuery {
  page: number
  pageSize: number
  sorting: { id: string; desc: boolean }[]
  filters: { id: string; value: unknown }[]
}
```

- [ ] **Step 2: Verify no import errors (TypeScript check)**

```powershell
pnpm --filter @igrp/igrp-framework-react-design-system exec tsc --noEmit
```

Expected: exits 0 (or only pre-existing errors unrelated to this file).

- [ ] **Step 3: Commit**

```powershell
git add packages/design-system/src/components/horizon/data-table/types.ts
git commit -m "feat(design-system): add IGRPDataTable shared types (actions, filters, pagination, query)"
```

---

### Task 2: Create createIGRPColumnHelper

**Files:**
- Create: `packages/design-system/src/components/horizon/data-table/column-helper.ts`

This is the core of the API redesign. It wraps TanStack's `createColumnHelper` and adds `cellType` shortcuts.

- [ ] **Step 1: Write the column helper**

Create `packages/design-system/src/components/horizon/data-table/column-helper.ts`:

```ts
import { createColumnHelper, type ColumnDef, type ColumnHelper } from "@tanstack/react-table"
import type { IGRPDataTableFilterDescriptor } from "./types"

// ─── Cell type shortcuts ─────────────────────────────────────────────────────

export type IGRPCellType =
  | "text"
  | "badge"
  | "date"
  | "amount"
  | "link"
  | "tooltip"
  | "switch"
  | "checkbox"

export interface IGRPCellTypeBadgeConfig {
  cellType: "badge"
  variants?: Record<string, string>  // value → badge color/variant
}

export interface IGRPCellTypeDateConfig {
  cellType: "date"
  format?: string  // e.g. "dd/MM/yyyy"
}

export interface IGRPCellTypeAmountConfig {
  cellType: "amount"
  currency?: string  // e.g. "CVE", "EUR"
}

export interface IGRPCellTypeLinkConfig {
  cellType: "link"
  href: (row: unknown) => string
}

export interface IGRPCellTypeSimple {
  cellType?: "text" | "tooltip" | "switch" | "checkbox"
}

export type IGRPCellConfig =
  | IGRPCellTypeBadgeConfig
  | IGRPCellTypeDateConfig
  | IGRPCellTypeAmountConfig
  | IGRPCellTypeLinkConfig
  | IGRPCellTypeSimple

// ─── Extended column definition ──────────────────────────────────────────────

export type IGRPAccessorColumnDef<TData, TValue = unknown> =
  Omit<ColumnDef<TData, TValue>, "cell"> &
  IGRPCellConfig & {
    filter?: IGRPDataTableFilterDescriptor
    // Raw cell escape hatch — when provided, cellType is ignored
    cell?: ColumnDef<TData, TValue>["cell"]
  }

// ─── Column helper ───────────────────────────────────────────────────────────

export interface IGRPColumnHelper<TData> {
  /**
   * Define a column bound to a data accessor key.
   * Supports cellType shortcuts and filter descriptors.
   */
  accessor: <TValue>(
    accessor: keyof TData & string,
    column: IGRPAccessorColumnDef<TData, TValue>,
  ) => IGRPAccessorColumnDef<TData, TValue>

  /**
   * Define a display-only column (no data accessor).
   * Use for custom cells, action columns, etc.
   */
  display: ColumnHelper<TData>["display"]

  /**
   * Define a column group header.
   */
  group: ColumnHelper<TData>["group"]
}

export function createIGRPColumnHelper<TData>(): IGRPColumnHelper<TData> {
  const tanstackHelper = createColumnHelper<TData>()

  return {
    accessor: (accessor, column) => ({
      accessorKey: accessor,
      ...column,
    }),
    display: tanstackHelper.display.bind(tanstackHelper),
    group: tanstackHelper.group.bind(tanstackHelper),
  }
}

/**
 * Resolve a cellType config to a TanStack cell renderer function.
 * Called inside IGRPDataTable when rendering column cells.
 */
export function resolveCellRenderer(
  colDef: IGRPAccessorColumnDef<unknown>,
): ColumnDef<unknown>["cell"] | undefined {
  if (colDef.cell) return colDef.cell  // raw escape hatch wins
  if (!("cellType" in colDef) || !colDef.cellType || colDef.cellType === "text") return undefined

  // The actual JSX rendering happens in the table component which has
  // access to the IGRP cell components. This function returns a marker
  // the table component reads to pick the right renderer.
  // We return undefined here and let IGRPDataTable handle it.
  return undefined
}
```

- [ ] **Step 2: TypeScript check**

```powershell
pnpm --filter @igrp/igrp-framework-react-design-system exec tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```powershell
git add packages/design-system/src/components/horizon/data-table/column-helper.ts
git commit -m "feat(design-system): add createIGRPColumnHelper with cellType shortcuts and filter descriptors"
```

---

### Task 3: Add `actions` prop to IGRPDataTable

**Files:**
- Modify: `packages/design-system/src/components/horizon/data-table/index.tsx`

Rule: ≤2 actions → render as icon buttons inline in the row. >2 actions → render as a dropdown menu. One `actions` prop replaces the manual use of `IGRPDataTableButtonAlert/Link/Modal` + `IGRPDataTableDropdownMenu*`.

- [ ] **Step 1: Add `actions` to the IGRPDataTable props interface**

Open `packages/design-system/src/components/horizon/data-table/index.tsx`. Find the component's props interface (likely `IGRPDataTableProps<TData>`). Add:

```ts
import type { IGRPDataTableAction, IGRPDataTablePaginationConfig, IGRPDataTableQuery } from "./types"

interface IGRPDataTableProps<TData> {
  // ... existing props ...
  actions?: IGRPDataTableAction<TData>[]
}
```

- [ ] **Step 2: Create the unified action renderer**

Add a helper component inside the same file (not exported):

```tsx
function IGRPDataTableRowActions<TData>({
  row,
  actions,
}: {
  row: Row<TData>
  actions: IGRPDataTableAction<TData>[]
}) {
  const visibleActions = actions.filter((a) => !a.hidden?.(row))

  if (visibleActions.length === 0) return null

  if (visibleActions.length <= 2) {
    // Render as icon buttons
    return (
      <div className="flex items-center gap-1">
        {visibleActions.map((action, i) => {
          if (action.type === "link") {
            return (
              <IGRPDataTableButtonLink
                key={i}
                href={action.href(row)}
                iconName={action.icon ?? "Eye"}
                label={action.label}
                disabled={action.disabled?.(row)}
              />
            )
          }
          if (action.type === "alert") {
            return (
              <IGRPDataTableButtonAlert
                key={i}
                title={action.title}
                description={action.description}
                onConfirm={() => action.onConfirm(row)}
                iconName={action.icon ?? "Trash2"}
                label={action.label}
                disabled={action.disabled?.(row)}
              />
            )
          }
          if (action.type === "modal") {
            return (
              <IGRPDataTableButtonModal
                key={i}
                render={(close) => action.render(row, close)}
                iconName={action.icon ?? "Edit"}
                label={action.label}
                disabled={action.disabled?.(row)}
              />
            )
          }
          if (action.type === "custom") {
            return <span key={i}>{action.render(row)}</span>
          }
          return null
        })}
      </div>
    )
  }

  // >2 actions: render as dropdown
  return (
    <IGRPDataTableDropdownMenu
      items={visibleActions.map((action, i) => {
        if (action.type === "link") {
          return (
            <IGRPDataTableDropdownMenuLink
              key={i}
              href={action.href(row)}
              label={action.label}
              disabled={action.disabled?.(row)}
            />
          )
        }
        if (action.type === "alert") {
          return (
            <IGRPDataTableDropdownMenuAlert
              key={i}
              title={action.title}
              description={action.description}
              onConfirm={() => action.onConfirm(row)}
              label={action.label}
              disabled={action.disabled?.(row)}
            />
          )
        }
        if (action.type === "custom") {
          return (
            <IGRPDataTableDropdownMenuCustom key={i} label={action.label}>
              {action.render(row)}
            </IGRPDataTableDropdownMenuCustom>
          )
        }
        return null
      })}
    />
  )
}
```

- [ ] **Step 3: Wire actions into the table column definitions**

Inside `IGRPDataTable`, when `actions` is provided, append a display column:

```ts
const actionColumn = actions && actions.length > 0
  ? [
      tanstackHelper.display({
        id: "__actions__",
        header: "",
        cell: ({ row }) => (
          <IGRPDataTableRowActions row={row} actions={actions} />
        ),
        size: actions.length <= 2 ? actions.length * 44 : 44,
        enableSorting: false,
        enableHiding: false,
      }),
    ]
  : []

const allColumns = [...columns, ...actionColumn]
```

Pass `allColumns` (not `columns`) to `useReactTable`.

- [ ] **Step 4: Build**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```powershell
git add packages/design-system/src/components/horizon/data-table/index.tsx
git commit -m "feat(design-system): add unified actions prop to IGRPDataTable (≤2 icon buttons, >2 dropdown)"
```

---

### Task 4: Add filter descriptors and auto-toolbar

**Files:**
- Modify: `packages/design-system/src/components/horizon/data-table/index.tsx`

`IGRPDataTable` reads `filter` descriptors from column definitions (produced by `createIGRPColumnHelper`) and auto-renders the correct filter component in the toolbar. Manual filter wiring becomes optional.

- [ ] **Step 1: Add filter reading logic**

Inside `IGRPDataTable`, after building the table instance, extract filter descriptors from column defs:

```ts
const filterDescriptors = useMemo(() => {
  return (columns as IGRPAccessorColumnDef<TData>[])
    .filter((col) => "filter" in col && col.filter)
    .map((col) => ({
      columnId: col.accessorKey as string,
      descriptor: col.filter!,
    }))
}, [columns])
```

- [ ] **Step 2: Render auto-filters in the toolbar**

In the toolbar render area, map filter descriptors to the appropriate filter component:

```tsx
{filterDescriptors.map(({ columnId, descriptor }) => {
  const column = table.getColumn(columnId)
  if (!column) return null

  switch (descriptor.type) {
    case "input":
      return (
        <IGRPDataTableFilterInput
          key={columnId}
          column={column}
          placeholder={descriptor.placeholder}
        />
      )
    case "select":
      return (
        <IGRPDataTableFilterSelect
          key={columnId}
          column={column}
          options={descriptor.options ?? []}
        />
      )
    case "faceted":
      return (
        <IGRPDataTableFilterFaceted
          key={columnId}
          column={column}
          options={descriptor.options ?? []}
        />
      )
    case "date":
      return <IGRPDataTableFilterDate key={columnId} column={column} />
    case "range":
      return <IGRPDataTableFilterMinMax key={columnId} column={column} />
    case "dropdown":
      return (
        <IGRPDataTableFilterDropdown
          key={columnId}
          column={column}
          options={descriptor.options ?? []}
        />
      )
    default:
      return descriptor.render?.(column) ?? null
  }
})}
```

- [ ] **Step 3: Verify manually-placed filters still work**

Manually placed filter components (the old pattern) pass column references directly and don't go through this auto-toolbar. They still work as before. This is additive only.

- [ ] **Step 4: Build**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```powershell
git add packages/design-system/src/components/horizon/data-table/index.tsx
git commit -m "feat(design-system): auto-render filter toolbar from column filter descriptors"
```

---

### Task 5: Add `onQueryChange` and `pagination` props

**Files:**
- Modify: `packages/design-system/src/components/horizon/data-table/index.tsx`

- [ ] **Step 1: Add props to the interface**

```ts
interface IGRPDataTableProps<TData> {
  // ... existing + actions ...
  rowCount?: number    // total rows for server-side pagination display
  onQueryChange?: (query: IGRPDataTableQuery) => void
  pagination?: IGRPDataTablePaginationConfig
}
```

- [ ] **Step 2: Call `onQueryChange` on state changes**

Inside `IGRPDataTable`, add a `useEffect` that fires whenever pagination, sorting, or column filters change:

```ts
const { pageIndex, pageSize } = table.getState().pagination
const sorting = table.getState().sorting
const columnFilters = table.getState().columnFilters

useEffect(() => {
  if (!onQueryChange) return
  onQueryChange({
    page: pageIndex,
    pageSize,
    sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    filters: columnFilters.map((f) => ({ id: f.id, value: f.value })),
  })
}, [pageIndex, pageSize, sorting, columnFilters, onQueryChange])
```

When `onQueryChange` is provided, set `manualPagination`, `manualSorting`, and `manualFiltering` to `true` on `useReactTable`, and pass `rowCount` as `rowCount` to the table config.

```ts
const tableConfig = {
  // ... existing config ...
  manualPagination: !!onQueryChange,
  manualSorting: !!onQueryChange,
  manualFiltering: !!onQueryChange,
  rowCount: onQueryChange ? (rowCount ?? 0) : undefined,
}
```

- [ ] **Step 3: Add `pagination` prop to control pagination type**

In the pagination render area, replace the hardcoded pagination component with a switch:

```tsx
{pagination?.type === "numeric" ? (
  <IGRPDataTablePaginationNumeric
    table={table}
    pageSizeOptions={pagination.pageSizeOptions}
  />
) : (
  <IGRPDataTablePagination
    table={table}
    pageSizeOptions={pagination?.pageSizeOptions}
  />
)}
```

Default (`pagination` undefined or `type: "simple"`): renders `IGRPDataTablePagination`.

- [ ] **Step 4: Build**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```powershell
git add packages/design-system/src/components/horizon/data-table/index.tsx
git commit -m "feat(design-system): add onQueryChange server-side callback and pagination config prop to IGRPDataTable"
```

---

### Task 6: Export new public API from index.ts

**Files:**
- Modify: `packages/design-system/src/index.ts`

- [ ] **Step 1: Add exports**

In `packages/design-system/src/index.ts`, add:

```ts
export { createIGRPColumnHelper } from "./components/horizon/data-table/column-helper"
export type {
  IGRPColumnHelper,
  IGRPAccessorColumnDef,
  IGRPCellType,
  IGRPCellConfig,
} from "./components/horizon/data-table/column-helper"
export type {
  IGRPDataTableAction,
  IGRPDataTableActionLink,
  IGRPDataTableActionAlert,
  IGRPDataTableActionModal,
  IGRPDataTableActionCustom,
  IGRPDataTableFilterDescriptor,
  IGRPDataTableFilterType,
  IGRPDataTablePaginationConfig,
  IGRPDataTableQuery,
} from "./components/horizon/data-table/types"
```

- [ ] **Step 2: Build and TypeScript check**

```powershell
pnpm build:ds
pnpm --filter @igrp/igrp-framework-react-design-system exec tsc --noEmit
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```powershell
git add packages/design-system/src/index.ts
git commit -m "feat(design-system): export createIGRPColumnHelper and new DataTable types from package root"
```

---

### Task 7: Write usage example and create changeset

- [ ] **Step 1: Verify the full API works end-to-end with a minimal TypeScript example**

Create a temporary file `packages/design-system/src/__tests__/data-table-api.test.ts`:

```ts
import { createIGRPColumnHelper } from "../components/horizon/data-table/column-helper"

type User = { id: number; name: string; status: "active" | "inactive"; createdAt: string; amount: number }

const col = createIGRPColumnHelper<User>()

const columns = [
  col.accessor("name", { header: "Name", cellType: "text" }),
  col.accessor("status", {
    header: "Status",
    cellType: "badge",
    variants: { active: "success", inactive: "destructive" },
    filter: { type: "faceted", options: [{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }] },
  }),
  col.accessor("createdAt", {
    header: "Created",
    cellType: "date",
    format: "dd/MM/yyyy",
    filter: { type: "date" },
  }),
  col.accessor("amount", { header: "Total", cellType: "amount", currency: "CVE" }),
  col.display({ id: "actions", cell: ({ row }) => row.original.id }),
]

// Type check: columns is an array
const _: typeof columns = columns
```

Run:

```powershell
pnpm --filter @igrp/igrp-framework-react-design-system exec tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 2: Delete the test file**

```powershell
Remove-Item "packages/design-system/src/__tests__/data-table-api.test.ts"
```

- [ ] **Step 3: Create changeset**

```powershell
pnpm changeset
```

When prompted:
- Select `@igrp/igrp-framework-react-design-system`
- Type: `patch`
- Summary: `Add createIGRPColumnHelper with cellType shortcuts, unified actions prop, declarative filter descriptors, onQueryChange server-side callback, and pagination config prop to IGRPDataTable`

- [ ] **Step 4: Final build**

```powershell
pnpm build:ds
```

Expected: exits 0, clean output.
