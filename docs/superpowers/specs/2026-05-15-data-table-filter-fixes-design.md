# Data Table Filter Fixes — Design Spec

**Date:** 2026-05-15  
**Package:** `packages/design-system` — `@igrp/igrp-framework-react-design-system`  
**Scope:** Bug fixes + faceted state refactor + real date range filter + clear-all callback

---

## Problem Summary

A code review of `packages/design-system/src/components/horizon/data-table/` identified six correctness issues:

| # | Severity | File | Issue |
|---|---|---|---|
| 1 | Critical | `filter.tsx:55–58` | `IGRPDataTableFilterDateContent` calls `setFilterValue` during render — infinite re-render loop in React 19 StrictMode |
| 2 | Critical | `filter.tsx:228` | `CommandItem` in `IGRPDataTableFilterFaceted` has no `onSelect` — clicking the row text does nothing |
| 3 | Critical | `filter.tsx:388–391` | `IGRPDataTableFilterSelect` renders `[object Object]` for every option — `String(value)` on the whole object instead of `opt.value`/`opt.label` |
| 4 | High | `filter.tsx:180–196` | `IGRPDataTableFilterFaceted` keeps a local `Set` copy of filter state — desyncs when external code resets filters |
| 5 | High | `filter.tsx:229–235` | Checkbox has no `<label>` association — clicking option text does not toggle the checkbox |
| 6 | High | `filters-utils.ts:19` | `IGRPDataTableDateRangeFilterFn` normalizes `end` but not `start` — string/Date mixed comparison gives wrong results |

Additional issues: `aria-label` typo in `IGRPDataTableFilterInput`, `disabled` implemented via CSS only in `IGRPDataTableFilterDropdown`, dead `filterLabel` prop (clear button was commented out), dead `multiColumnFilterFn` commented code.

---

## Chosen Approach: Surgical fixes + `useFilterState` hook

**Approach B** was selected: fix all issues in place, extract a `useFilterState` hook to own cross-column filter state (is-filtered flag and clear-all action). TanStack column state remains the single source of truth — no filter component keeps a local copy.

The date picker uses the raw `Calendar` primitive + `Popover` (Primitives layer) for full control over range rendering.

The clear-all button is restored and promoted with an `onFiltersCleared` callback on `IGRPDataTable`.

---

## Files Changed

```
packages/design-system/src/components/horizon/data-table/
  hooks/
    use-filter-state.ts        ← NEW
  lib/
    filters-utils.ts           ← fix date normalization, faceted number support, remove dead code
  client-filter.tsx            ← restore clear button, wire useFilterState, add onFiltersCleared
  filter.tsx                   ← fix all 5 filter variants
  index.tsx                    ← add onFiltersCleared prop, thread to IGRPDataTableClientFilter
```

---

## Design

### 1. `hooks/use-filter-state.ts` (new)

Owns only cross-column concerns: whether any column has an active filter, and the coordinated clear action.

```ts
function useFilterState<TData>(
  table: Table<TData>,
  onFiltersCleared?: () => void,
): { isFiltered: boolean; handleClear: () => void }
```

- `isFiltered` — `useMemo` derived from `table.getState().columnFilters.length > 0`
- `handleClear` — `useCallback` that calls `table.resetColumnFilters()` then `onFiltersCleared?.()`
- Does NOT carry `"use no memo"` — only `index.tsx` (TanStack table instance) needs that directive

### 2. `filter.tsx` — per-component fixes

#### `IGRPDataTableFilterDate` — real date range picker

Replace the broken render-phase mutation placeholder with:
- `Popover` trigger (`IGRPButton` with `CalendarDays` icon)
- Trigger label shows formatted date range when selected, placeholder when empty
- `PopoverContent` contains a `Calendar` in `mode="range"`
- `onSelect` writes `{ from, to }` object to `column.setFilterValue()`, or `undefined` when cleared
- `clearDates` key-trick retained for external clear signal
- Date formatting via `Intl.DateTimeFormat` with `{ day: "2-digit", month: "2-digit", year: "numeric" }` — locale-aware, no new dependencies. `Calendar` uses `react-day-picker` which is already a transitive dep via the existing `Calendar` primitive.

#### `IGRPDataTableFilterFaceted` — derived state, row click, label association

- Remove `useState<Set<string | number>>` entirely
- Replace with `useMemo(() => new Set(column?.getFilterValue() ?? []), [column?.getFilterValue()])` — TanStack is the single source of truth; external resets (e.g. `table.resetColumnFilters()`) now correctly clear checkboxes. The `column?.getFilterValue()` dep requires `// eslint-disable-next-line react-hooks/exhaustive-deps` because ESLint cannot statically verify the dep is stable — this suppression is intentional and correct.
- `handleSelect` writes only to `column.setFilterValue()` — no local state update
- `CommandItem` gains `onSelect={() => handleSelect(option.value)}` — clicking anywhere on the row toggles
- `<label htmlFor={...} className="cursor-pointer flex-1">` wraps option text — clicking label toggles checkbox
- `Checkbox` gains `aria-label={option.label}` as fallback

#### `IGRPDataTableFilterSelect` — correct option rendering

```tsx
// Before: String(value) on the whole object → "[object Object]"
// After:
<SelectItem key={String(opt.value)} value={String(opt.value)}>
  {opt.label}
</SelectItem>
```

#### `IGRPDataTableFilterDropdown` — native `disabled`

- Remove `disabled && "cursor-not-allowed pointer-events-none opacity-50"` from `className`
- Pass `disabled={disabled}` directly to `IGRPButton` — native attribute, screen-reader announced

#### `IGRPDataTableFilterInput` — typo fix

- `aria-label="Filtar"` → `aria-label="Filtrar"`

### 3. `lib/filters-utils.ts` — three fixes

**`IGRPDataTableDateRangeFilterFn`:** normalize `start` with `new Date(filterValue.from)` — same as `end` — preventing mixed string/Date comparison.

**`IGRPDataTableFacetedFilterFn`:** string-normalize both sides for comparison so numeric column values match string filter values:
```ts
return filterValue.some((v) => String(v) === String(cellValue))
```

**Dead code:** Delete the commented-out `multiColumnFilterFn` block entirely.

### 4. `client-filter.tsx` — restore clear button + callback

- Import and call `useFilterState(table, onFiltersCleared)`
- Restore `IGRPButton` clear button, shown when `isFiltered === true`
- `IGRPDataTableFilterClientProps` gains `onFiltersCleared?: () => void`

### 5. `index.tsx` — thread `onFiltersCleared`

- `IGRPDataTableProps` gains `onFiltersCleared?: () => void`
- Passed to `IGRPDataTableClientFilter` — no other changes

---

## Public API Changes (additive only, no breaking changes)

| Symbol | Change |
|---|---|
| `IGRPDataTableProps` | `+onFiltersCleared?: () => void` |
| `IGRPDataTableFilterClientProps` | `+onFiltersCleared?: () => void` |
| `IGRPDataTableFilterDate` | renders real date range UI (was broken placeholder) |
| `IGRPDataTableFilterSelect` | renders `opt.label` correctly (was `[object Object]`) |
| `IGRPDataTableFilterDropdown` | `disabled` is now native attribute + CSS visual |

---

## Data Flow

```
IGRPDataTable
  └─ IGRPDataTableClientFilter
       ├─ useFilterState(table, onFiltersCleared)
       │    ├─ isFiltered  ← derived from table.getState().columnFilters
       │    └─ handleClear → table.resetColumnFilters() + onFiltersCleared?.()
       └─ filter components (per column)
            ├─ IGRPDataTableFilterFaceted   ← useMemo from column.getFilterValue()
            ├─ IGRPDataTableFilterInput     ← unchanged (already reads column directly)
            ├─ IGRPDataTableFilterDropdown  ← fix: native disabled
            ├─ IGRPDataTableFilterSelect    ← fix: opt.label rendering
            ├─ IGRPDataTableFilterMinMax    ← unchanged
            └─ IGRPDataTableFilterDate      ← real Calendar + Popover
```

TanStack column state is the single source of truth. No filter component holds a local copy of filter values.

---

## Out of Scope

- Server-side filter coordination (`isServerSide` path) — unchanged
- Global filter / fuzzy filter — not part of this component
- Virtualization, column pinning, resizing — unrelated
- Storybook stories — handed off to `packages/design-system-storybook`
