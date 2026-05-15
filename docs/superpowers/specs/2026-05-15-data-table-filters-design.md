# Data Table Filters — Bug Fix + filterVariant Meta Pattern

**Date:** 2026-05-15
**Package:** `packages/design-system` — `@igrp/igrp-framework-react-design-system`
**Scope:** `src/components/horizon/data-table/`

---

## Problem

The data table filter system has three outright bugs (visible to end users), three correctness gaps (keyboard/state/type issues), and an architectural issue where consumers must pass verbose factory functions for standard filter shapes.

### Critical bugs
1. `IGRPDataTableFilterSelect` maps `options` with variable named `value` over objects — `String(value)` renders `[object Object]` for every option.
2. `IGRPDataTableFilterSelect` binds controlled value to the placeholder string when no filter is active; the `SelectItem` with `value="all"` never matches, so the Select shows blank after clearing.
3. `IGRPDataTableFilterDateContent` calls `column.setFilterValue(undefined)` during render — a side effect in the render phase that violates React's render-phase purity.

### Correctness gaps
4. `IGRPDataTableFilterFaceted` initialises a local `Set` from column state at mount; external calls to `table.resetColumnFilters()` clear the column filter but the local `Set` stays stale — checkboxes remain ticked.
5. `IGRPDataTableFilterFaceted` `CommandItem` entries have no `onSelect` prop — keyboard `Enter` does nothing, only mouse clicks on the `Checkbox` work.
6. `IGRPDataTableFilterFaceted` is missing a `CommandList` wrapper — `CommandEmpty` and `CommandGroup` sit directly inside `Command`, breaking scroll containment and ARIA role management.
7. `IGRPDataTableFacetedFilterFn` is typed as `filterValue: string[]` but `IGRPDataTableFilterFaceted` passes `(string | number)[]`; numeric values never match string cell values via `includes`.

### Quality issues
8. `IGRPDataTableFilterInput` has `aria-label="Filtar"` (missing 'r').
9. The "clear all filters" button in `client-filter.tsx` is fully implemented but commented out — the `filterLabel` prop is accepted and silently dropped.
10. `NotFoundRowSubComponent` in `index.tsx` is rebuilt as a new JSX tree on every render.
11. `autoResetPageIndex` is not set — filtering does not reset the user to page 1.
12. `IGRPDataTableDateRangeFilterFn` normalises `filterValue.to` with `new Date()` but uses `filterValue.from` raw.

---

## Solution: Fix + `filterVariant` Meta Pattern

### What we are NOT doing
- No implementation of the date-range filter UI (the `IGRPDataTableFilterDate` component remains a placeholder returning `null`; the `IGRPDataTableDateRangeFilterFn` utility is fixed and kept for when a date picker is wired up).
- No filter bar with chips / individual clear buttons (separate future spec).

---

## Architecture

### Current flow
```
IGRPDataTable (showFilter=true, isServerSide=false)
  └─ IGRPDataTableClientFilter
       └─ clientFilters.map(({ columnId, component }) => component({ column }))
```

### New flow
```
IGRPDataTable (showFilter=true, isServerSide=false)
  └─ IGRPDataTableClientFilter
       ├─ table.getAllLeafColumns() filtered to filterable columns
       │    ├─ column has clientFilters entry → render custom component (override wins)
       │    └─ column has meta.filterVariant  → render matching built-in component
       └─ if any column filter active → show "Clear all" button
```

### Rendering precedence
Column definition order. For any column that appears in both `clientFilters` and has `meta.filterVariant`, the `clientFilters` entry renders (custom override wins). `clientFilters` entries whose column has no `meta.filterVariant` also render (pure escape hatch for custom components such as future date pickers).

### `filterVariant` values
| Value | Renders |
|---|---|
| `'text'` | `IGRPDataTableFilterInput` |
| `'select'` | `IGRPDataTableFilterSelect` |
| `'faceted'` | `IGRPDataTableFilterFaceted` |
| `'range'` | `IGRPDataTableFilterMinMax` |
| `'dropdown'` | `IGRPDataTableFilterDropdown` |

### Consumer API

**Before** — factory function per filter:
```typescript
clientFilters={[{
  columnId: 'status',
  component: ({ column }) => (
    <IGRPDataTableFilterFaceted column={column} options={STATUS_OPTIONS} />
  )
}]}
```

**After** — declare in column definition:
```typescript
columnHelper.accessor('status', {
  meta: {
    filterVariant: 'faceted',
    filterProps: { options: STATUS_OPTIONS }
  }
})
```

**Custom component (escape hatch — unchanged API):**
```typescript
clientFilters={[{
  columnId: 'startDate',
  component: ({ column }) => <MyDatePicker column={column} />
}]}
```

`clientFilters` prop stays on `IGRPDataTableProps` unchanged. Zero breaking changes.

---

## Files Changed

### `data-table/types.ts` *(new file)*
Module augmentation for `ColumnMeta`. Keeps the declaration isolated from the component files.

```typescript
import type { RowData } from '@tanstack/react-table'
import type { IGRPOptionsProps } from '../../../types'
import type { IGRPIconName } from '../icon'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'select' | 'faceted' | 'range' | 'dropdown'
    filterProps?: {
      options?: IGRPOptionsProps[]
      placeholder?: string
      placeholderMax?: string
      iconName?: IGRPIconName | string
      showFilter?: boolean
      labelFilter?: string
      labelSearchField?: string
      notFoundText?: string
    }
  }
}
```

### `lib/filters-utils.ts`
- `IGRPDataTableDateRangeFilterFn`: normalise `filterValue.from` with `new Date()`.
- `IGRPDataTableFacetedFilterFn`: signature becomes `filterValue: (string | number)[]`; comparison uses `filterValue.map(String).includes(String(cellValue))`.

### `filter.tsx`

#### `IGRPDataTableFilterDateContent`
Move `setFilterValue(undefined)` from render body into `useEffect`:
```typescript
useEffect(() => {
  column?.setFilterValue(undefined)
}, [column])
return null
```

#### `IGRPDataTableFilterSelect`
- Rename map variable `value` → `option`; use `option.value` / `option.label`.
- Controlled value: `columnFilterValue?.toString() ?? "all"` (was `?? placeholder`).

#### `IGRPDataTableFilterFaceted`
- Remove `selectedValues` local `Set` state entirely.
- Derive checked state from column during render:
  ```typescript
  const filterValues = (column?.getFilterValue() as (string | number)[]) ?? []
  const isChecked = filterValues.map(String).includes(String(option.value))
  ```
- `handleSelect` reads + writes column state directly:
  ```typescript
  const handleSelect = useCallback((value: string | number) => {
    const current = (column?.getFilterValue() as (string | number)[]) ?? []
    const next = current.map(String).includes(String(value))
      ? current.filter(v => String(v) !== String(value))
      : [...current, value]
    column?.setFilterValue(next.length ? next : undefined)
  }, [column])
  ```
- Add `onSelect={() => handleSelect(option.value)}` to each option `CommandItem`.
- Wrap `CommandEmpty` + both `CommandGroup` blocks inside `CommandList`.
- `handleClear` becomes `column?.setFilterValue(undefined)` (no local state to clear).

#### `IGRPDataTableFilterInput`
- `aria-label="Filtrar"` (fix typo).
- Wrap `onChange` in `useCallback`.

### `client-filter.tsx`
- Restore clear-filter button: un-comment `isFiltered`, `handleCleanFilter`, and the `IGRPButton` render.
- `filterLabel` prop becomes active (drives the clear button label).
- Auto-wire `filterVariant` columns: iterate `table.getAllLeafColumns()`, skip columns in `clientFilters`, render the matching built-in component for the rest using `filterProps` from `column.columnDef.meta`.

### `index.tsx`
- Add `autoResetPageIndex: true` to `useReactTable`.
- Move `NotFoundRowSubComponent` to module-level constant outside the component.
- Remove commented-out dead code (`rowSelection` params, `TableRow` className comment blocks).

---

## Data Flow: Faceted Filter (After Fix)

```
column.getFilterValue()   ←──────────────────────────────────┐
        │                                                     │
        ▼                                                     │
filterValues = [...] or []                                    │
        │                                                     │
        ▼                                                     │
isChecked = filterValues.map(String).includes(String(opt.value))
        │                                                     │
  [Checkbox checked={isChecked}]                              │
  [CommandItem onSelect → handleSelect(opt.value)]            │
                    │                                         │
                    ▼                                         │
             compute next array                               │
                    │                                         │
                    └── column.setFilterValue(next) ──────────┘
```
TanStack Table is the single source of truth. No local state mirror.

---

## Error Handling & Edge Cases

- `options` is always optional on filter components — if `undefined`, no items render.
- `column` is optional on all filter components — all access is guarded with `?.`.
- `filterVariant` columns with no `filterProps.options` (for `select`, `faceted`, `dropdown`) render the component with no options — the consumer sees an empty list, not a crash.
- The `filterLabel` clear button only appears when `table.getState().columnFilters.length > 0`, unchanged from the commented-out original.

---

## Out of Scope

- Date-range filter UI implementation (separate spec needed; date picker component must be ready first).
- Filter bar with per-filter chips and individual clear buttons.
- Server-side filter wiring (`isServerSide=true` path is unchanged).
- Storybook stories / visual regression tests (handled in `packages/design-system-storybook`).
