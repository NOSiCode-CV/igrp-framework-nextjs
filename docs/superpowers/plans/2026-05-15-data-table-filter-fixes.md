# Data Table Filter Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix six correctness bugs in the data-table filter system, extract a `useFilterState` hook, implement a real date range picker, and restore the clear-all button with an `onFiltersCleared` callback.

**Architecture:** TanStack column state is made the single source of truth — no filter component holds a local copy of filter values. A new `useFilterState` hook owns cross-column concerns (is-filtered flag, clear-all action). All other fixes are surgical edits to their respective components.

**Tech Stack:** React 19, TanStack Table v8, react-day-picker v9 (already a dep via `Calendar` primitive), Radix UI Popover, Tailwind CSS v4, `cn()` from `../../../lib/utils`.

**Design spec:** `docs/superpowers/specs/2026-05-15-data-table-filter-fixes-design.md`

**Build command (run from repo root):** `pnpm build:ds`
**TypeScript check:** `pnpm --filter @igrp/igrp-framework-react-design-system build:types`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `packages/design-system/src/components/horizon/data-table/hooks/use-filter-state.ts` | **Create** | Cross-column filter state bridge (is-filtered, clear-all) |
| `packages/design-system/src/components/horizon/data-table/lib/filters-utils.ts` | **Modify** | Fix date normalization, fix faceted number comparison, remove dead code |
| `packages/design-system/src/components/horizon/data-table/filter.tsx` | **Modify** | Fix all 5 filter variants |
| `packages/design-system/src/components/horizon/data-table/client-filter.tsx` | **Modify** | Wire `useFilterState`, restore clear button, add `onFiltersCleared` |
| `packages/design-system/src/components/horizon/data-table/index.tsx` | **Modify** | Add `onFiltersCleared` prop, thread to `IGRPDataTableClientFilter` |

---

## Task 1: Fix `filters-utils.ts`

**Files:**
- Modify: `packages/design-system/src/components/horizon/data-table/lib/filters-utils.ts`

- [ ] **Step 1: Fix `IGRPDataTableDateRangeFilterFn` — normalize `start` to `Date`**

Open `packages/design-system/src/components/horizon/data-table/lib/filters-utils.ts`.

Replace lines 18–19:
```ts
// BEFORE
const start = filterValue.from
const end = filterValue.to ? new Date(filterValue.to) : undefined

// AFTER
const start = new Date(filterValue.from)
const end = filterValue.to ? new Date(filterValue.to) : undefined
```

- [ ] **Step 2: Fix `IGRPDataTableFacetedFilterFn` — support number column values**

Replace lines 37–39:
```ts
// BEFORE
const status = row.getValue(columnId) as string
return filterValue.includes(status)

// AFTER
const cellValue = row.getValue(columnId)
return filterValue.some((v) => String(v) === String(cellValue))
```

- [ ] **Step 3: Remove dead commented-out `multiColumnFilterFn`**

Delete lines 71–79 (the entire commented-out `multiColumnFilterFn` block including the `@deprecated` JSDoc):
```ts
// DELETE everything from:
// /**
//  * Multi-column filter function...
// ...through...
// };
```

The file should end after the closing brace of `IGRPDataTableTextFilterFn`.

- [ ] **Step 4: Commit**

```bash
git add packages/design-system/src/components/horizon/data-table/lib/filters-utils.ts
git commit -m "fix(design-system): fix date normalization and faceted number comparison in filter utils"
```

---

## Task 2: Create `hooks/use-filter-state.ts`

**Files:**
- Create: `packages/design-system/src/components/horizon/data-table/hooks/use-filter-state.ts`

- [ ] **Step 1: Create the hook file**

Create `packages/design-system/src/components/horizon/data-table/hooks/use-filter-state.ts` with this exact content:

```ts
"use client"

import { useCallback, useMemo } from "react"
import { type Table } from "@tanstack/react-table"

function useFilterState<TData>(
  table: Table<TData>,
  onFiltersCleared?: () => void,
): { isFiltered: boolean; handleClear: () => void } {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isFiltered = useMemo(
    () => table.getState().columnFilters.length > 0,
    [table.getState().columnFilters],
  )

  const handleClear = useCallback(() => {
    table.resetColumnFilters()
    onFiltersCleared?.()
  }, [table, onFiltersCleared])

  return { isFiltered, handleClear }
}

export { useFilterState }
```

Note: the `eslint-disable` on `useMemo` is intentional — ESLint cannot statically verify that `table.getState().columnFilters` is a stable dep, but TanStack replaces the array reference on every change so this is correct.

- [ ] **Step 2: Verify TypeScript is happy**

```powershell
pnpm --filter @igrp/igrp-framework-react-design-system build:types
```

Expected: no errors. If you see "columnFilters is not assignable", check that `Table` is imported from `@tanstack/react-table` (not a re-export).

- [ ] **Step 3: Commit**

```bash
git add packages/design-system/src/components/horizon/data-table/hooks/use-filter-state.ts
git commit -m "feat(design-system): add useFilterState hook for cross-column filter state"
```

---

## Task 3: Fix `IGRPDataTableFilterSelect` — `[object Object]` rendering

**Files:**
- Modify: `packages/design-system/src/components/horizon/data-table/filter.tsx` (lines 388–391)

- [ ] **Step 1: Fix the `options` map in `IGRPDataTableFilterSelect`**

In `filter.tsx`, find `IGRPDataTableFilterSelect` (~line 388). Replace the `options?.map` block:

```tsx
// BEFORE
{options?.map((value) => (
  <SelectItem key={String(value)} value={String(value)}>
    {String(value)}
  </SelectItem>
))}

// AFTER
{options?.map((opt) => (
  <SelectItem key={String(opt.value)} value={String(opt.value)}>
    {opt.label}
  </SelectItem>
))}
```

`options` is typed as `IGRPOptionsProps[]` which has `{ label: string; value: string | number; color?: string }`. `String(value)` on the whole object produced `[object Object]`.

- [ ] **Step 2: Commit**

```bash
git add packages/design-system/src/components/horizon/data-table/filter.tsx
git commit -m "fix(design-system): fix IGRPDataTableFilterSelect rendering [object Object] for options"
```

---

## Task 4: Fix `IGRPDataTableFilterDropdown` disabled + `IGRPDataTableFilterInput` aria-label typo

**Files:**
- Modify: `packages/design-system/src/components/horizon/data-table/filter.tsx`

- [ ] **Step 1: Fix native `disabled` on `IGRPDataTableFilterDropdown`**

In `filter.tsx`, find the `<IGRPButton>` inside `IGRPDataTableFilterDropdown` (~line 112). Replace it:

```tsx
// BEFORE
<IGRPButton
  variant="outline"
  role="combobox"
  aria-expanded={open}
  aria-controls={listId}
  size="sm"
  className={cn(
    "w-full justify-between",
    className,
    disabled && "cursor-not-allowed pointer-events-none opacity-50",
  )}
>

// AFTER
<IGRPButton
  variant="outline"
  role="combobox"
  aria-expanded={open}
  aria-controls={listId}
  size="sm"
  disabled={disabled}
  className={cn("w-full justify-between", className)}
>
```

The `disabled` prop on `IGRPButton` handles both the native `disabled` attribute (screen-reader-announced) and the visual appearance — the manual CSS was redundant and incomplete.

- [ ] **Step 2: Fix `aria-label` typo in `IGRPDataTableFilterInput`**

Find `aria-label="Filtar"` (~line 290) and change it:

```tsx
// BEFORE
aria-label="Filtar"

// AFTER
aria-label="Filtrar"
```

- [ ] **Step 3: Commit**

```bash
git add packages/design-system/src/components/horizon/data-table/filter.tsx
git commit -m "fix(design-system): fix native disabled on FilterDropdown and aria-label typo in FilterInput"
```

---

## Task 5: Fix `IGRPDataTableFilterFaceted` — derived state + row click + label association

**Files:**
- Modify: `packages/design-system/src/components/horizon/data-table/filter.tsx`

This is the most substantial single-component change. Read the full `IGRPDataTableFilterFaceted` function before starting (~lines 167–263).

- [ ] **Step 1: Remove `useState` and replace with `useMemo`**

At the top of `IGRPDataTableFilterFaceted`, find:

```tsx
const [selectedValues, setSelectedValues] = useState<Set<string | number>>(
  () => new Set((column?.getFilterValue() as string[]) ?? []),
)
```

Replace with:

```tsx
// eslint-disable-next-line react-hooks/exhaustive-deps
const selectedValues = useMemo(
  () => new Set<string | number>((column?.getFilterValue() as (string | number)[]) ?? []),
  [column?.getFilterValue()],
)
```

The `eslint-disable` is intentional — same reason as `useFilterState`: `column?.getFilterValue()` is not a stable reference but changes on every filter update, which is exactly what we want to track.

- [ ] **Step 2: Update `handleSelect` to write only to TanStack (remove `setSelectedValues`)**

Replace the existing `handleSelect`:

```tsx
// BEFORE
const handleSelect = useCallback(
  (value: string | number) => {
    const next = new Set(selectedValues)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    setSelectedValues(next)
    const filterValues = Array.from(next)
    column?.setFilterValue(filterValues.length ? filterValues : undefined)
  },
  [column, selectedValues],
)

// AFTER
const handleSelect = useCallback(
  (value: string | number) => {
    const next = new Set(selectedValues)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    const filterValues = Array.from(next)
    column?.setFilterValue(filterValues.length ? filterValues : undefined)
  },
  [column, selectedValues],
)
```

- [ ] **Step 3: Update `handleClear` (no `setSelectedValues` needed)**

Replace:

```tsx
// BEFORE
const handleClear = useCallback(() => {
  column?.setFilterValue(undefined)
  setSelectedValues(new Set())
}, [column])

// AFTER
const handleClear = useCallback(() => {
  column?.setFilterValue(undefined)
}, [column])
```

- [ ] **Step 4: Keep `useState` import — it is still used by `IGRPDataTableFilterDropdown`**

`IGRPDataTableFilterDropdown` uses `useState` for the `open` popover state (~line 93). Do NOT remove the `useState` import from line 2 — only remove `setSelectedValues` from the `IGRPDataTableFilterFaceted` function body. The import line stays unchanged.

- [ ] **Step 5: Fix `CommandItem` — add `onSelect`, fix label association**

Find the `options?.map` inside `IGRPDataTableFilterFaceted` (~line 226). Replace the entire `CommandItem` block:

```tsx
// BEFORE
{options?.map((option, i) => {
  return (
    <CommandItem className={cn("justify-between", className)} key={option.value}>
      <div className={cn("flex items-center gap-2")}>
        <Checkbox
          id={`${id}-${i}`}
          checked={selectedValues.has(option.value)}
          onCheckedChange={() => handleSelect(option.value)}
          className={cn("border-foreground")}
        />
      </div>
      <span>{option.label}</span>
      <span className={cn("ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs")}>
        {facets?.get(option.value) || 0}
      </span>
    </CommandItem>
  )
})}

// AFTER
{options?.map((option, i) => (
  <CommandItem
    key={String(option.value)}
    value={String(option.value)}
    onSelect={() => handleSelect(option.value)}
    className={cn("gap-2", className)}
  >
    <Checkbox
      id={`${id}-${i}`}
      checked={selectedValues.has(option.value)}
      onCheckedChange={() => handleSelect(option.value)}
      aria-label={option.label}
      className={cn("border-foreground")}
    />
    <label htmlFor={`${id}-${i}`} className="cursor-pointer flex-1">
      {option.label}
    </label>
    <span className="ml-auto font-mono text-xs">
      {facets?.get(option.value) ?? 0}
    </span>
  </CommandItem>
))}
```

Changes:
- `key={String(option.value)}` — consistent with `value` prop
- `onSelect={() => handleSelect(option.value)}` — clicking anywhere on the row now toggles
- `<label htmlFor={...}>` wraps the text — clicking the label text toggles the checkbox
- `aria-label={option.label}` on `Checkbox` — screen-reader fallback
- `?? 0` instead of `|| 0` — `|| 0` would replace a legitimate `0` count

- [ ] **Step 6: Commit**

```bash
git add packages/design-system/src/components/horizon/data-table/filter.tsx
git commit -m "fix(design-system): fix IGRPDataTableFilterFaceted dual-state desync, row click, and label association"
```

---

## Task 6: Implement `IGRPDataTableFilterDate` with real Calendar + Popover

**Files:**
- Modify: `packages/design-system/src/components/horizon/data-table/filter.tsx`

The current `IGRPDataTableFilterDate` / `IGRPDataTableFilterDateContent` is a broken placeholder that calls `setFilterValue` during render. This task replaces it entirely.

- [ ] **Step 1: Add `Calendar` import**

At the top of `filter.tsx`, add to the existing imports:

```tsx
import { Calendar } from "../../primitives/calendar"
```

`Calendar` wraps `react-day-picker` v9 `DayPicker` and passes `...props` through — `mode="range"`, `selected`, and `onSelect` work directly.

- [ ] **Step 2: Add `formatDate` helper above `IGRPDataTableFilterDate`**

Insert this private helper immediately before the `IGRPDataTableFilterDate` function definition:

```tsx
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}
```

`undefined` locale uses the browser's default locale. No new dependencies.

- [ ] **Step 3: Delete `IGRPDataTableFilterDateContent` entirely**

Remove the internal `IGRPDataTableFilterDateContent` function (the one with the render-phase `setFilterValue`). It is only used by `IGRPDataTableFilterDate` and will be replaced.

- [ ] **Step 4: Replace `IGRPDataTableFilterDate` with the real implementation**

```tsx
/** Date range filter. Opens a popover with a range calendar. */
function IGRPDataTableFilterDate<TData>({
  column,
  clearDates,
  placeholder = "Selecionar data...",
}: Omit<IGRPDataTableFilterProps<TData>, "options" | "placeholderMax">) {
  const value = column?.getFilterValue() as { from?: Date; to?: Date } | undefined

  return (
    <Popover key={clearDates ? "cleared" : "active"}>
      <PopoverTrigger asChild>
        <IGRPButton variant="outline" size="sm" className="justify-start">
          <IGRPIcon iconName="CalendarDays" />
          {value?.from
            ? value.to
              ? `${formatDate(value.from)} – ${formatDate(value.to)}`
              : formatDate(value.from)
            : placeholder}
        </IGRPButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={{ from: value?.from, to: value?.to }}
          onSelect={(range) =>
            column?.setFilterValue(range?.from ? range : undefined)
          }
        />
      </PopoverContent>
    </Popover>
  )
}
```

Key points:
- `key={clearDates ? "cleared" : "active"}` on `<Popover>` remounts the component when `clearDates` toggles, resetting the popover open state along with the filter — same mechanism the original used.
- `column?.setFilterValue(range?.from ? range : undefined)` — sets `undefined` when the user clears (no `from` date), which triggers `IGRPDataTableDateRangeFilterFn` to return all rows.
- The `onSelect` type from react-day-picker v9 range mode: `(range: DateRange | undefined) => void` where `DateRange = { from: Date | undefined; to?: Date | undefined }`.

- [ ] **Step 5: Verify the `"use no memo"` is NOT on this file**

`filter.tsx` does not have `"use no memo"` at the top — confirm this is still the case. Do not add it. Only `index.tsx` carries that directive.

- [ ] **Step 6: Build to catch any type errors**

```powershell
pnpm build:ds
```

If you see a type error on `mode="range"` or `selected`, check that `Calendar` is imported from `../../primitives/calendar` (not from the horizon layer). The primitive passes `...props` to `DayPicker` directly.

- [ ] **Step 7: Commit**

```bash
git add packages/design-system/src/components/horizon/data-table/filter.tsx
git commit -m "feat(design-system): implement IGRPDataTableFilterDate with real Calendar range picker"
```

---

## Task 7: Update `client-filter.tsx` — wire `useFilterState` + restore clear button

**Files:**
- Modify: `packages/design-system/src/components/horizon/data-table/client-filter.tsx`

- [ ] **Step 1: Add imports**

At the top of `client-filter.tsx`, add these imports (the `IGRPButton` import is currently commented out):

```tsx
import { useFilterState } from "./hooks/use-filter-state"
import { IGRPButton } from "../button"
```

Remove the commented-out `// import { IGRPButton } from '../button';` line.

- [ ] **Step 2: Add `onFiltersCleared` to `IGRPDataTableFilterClientProps`**

```tsx
interface IGRPDataTableFilterClientProps<TData> {
  table: Table<TData>
  filterList: IGRPDataTableClientFilterListProps<TData>[]
  filterLabel: string
  onFiltersCleared?: () => void   // ← add this
}
```

- [ ] **Step 3: Destructure `onFiltersCleared` and wire `useFilterState`**

Replace the component signature and body:

```tsx
function IGRPDataTableClientFilter<TData>({
  table,
  filterList,
  filterLabel,
  onFiltersCleared,
}: IGRPDataTableFilterClientProps<TData>) {
  const { isFiltered, handleClear } = useFilterState(table, onFiltersCleared)

  return (
    <div className={cn("flex md:items-center gap-2 flex-col md:flex-row")}>
      {filterList.map(({ columnId, component }) => {
        const column = table.getColumn(columnId as string)
        return (
          column && (
            <Fragment key={columnId as string}>{component({ column })}</Fragment>
          )
        )
      })}

      {isFiltered && (
        <IGRPButton onClick={handleClear} variant="ghost" showIcon iconName="X">
          {filterLabel}
        </IGRPButton>
      )}
    </div>
  )
}
```

Remove all the commented-out `handleCleanFilter` and `isFiltered` blocks — they are fully replaced by `useFilterState`.

- [ ] **Step 4: Commit**

```bash
git add packages/design-system/src/components/horizon/data-table/client-filter.tsx
git commit -m "feat(design-system): restore clear-all filter button and add onFiltersCleared callback"
```

---

## Task 8: Update `index.tsx` — thread `onFiltersCleared`

**Files:**
- Modify: `packages/design-system/src/components/horizon/data-table/index.tsx`

- [ ] **Step 1: Add `onFiltersCleared` to `IGRPDataTableProps`**

In `IGRPDataTableProps` (~line 40), add after the existing `id` prop:

```tsx
/** Called after all client-side column filters are cleared via the clear button. */
onFiltersCleared?: () => void
```

- [ ] **Step 2: Destructure `onFiltersCleared` in `IGRPDataTable`**

In the function signature (~line 127), add `onFiltersCleared` to the destructured props:

```tsx
function IGRPDataTable<TData, TValue>({
  // ... existing props ...
  id,
  onFiltersCleared,    // ← add this
}: IGRPDataTableProps<TData, TValue>) {
```

- [ ] **Step 3: Pass `onFiltersCleared` to `IGRPDataTableClientFilter`**

Find the `<IGRPDataTableClientFilter .../>` usage (~line 267) and add the prop:

```tsx
<IGRPDataTableClientFilter
  table={table}
  filterList={clientFilters || []}
  filterLabel={clientClearLabel}
  onFiltersCleared={onFiltersCleared}
/>
```

- [ ] **Step 4: Full build + type check**

```powershell
pnpm build:ds
```

Expected: clean build, no type errors. If you see TS errors about `onFiltersCleared` not existing on `IGRPDataTableFilterClientProps`, check Task 7 Step 2 was applied correctly.

- [ ] **Step 5: Commit**

```bash
git add packages/design-system/src/components/horizon/data-table/index.tsx
git commit -m "feat(design-system): add onFiltersCleared callback to IGRPDataTable"
```

---

## Task 9: Final build verification + changeset

- [ ] **Step 1: Full clean build**

```powershell
pnpm build:ds
```

Expected: exits 0. If any step's changes weren't committed, stash/stage now.

- [ ] **Step 2: TypeScript declarations only (catches hidden type errors the SWC pass may miss)**

```powershell
pnpm --filter @igrp/igrp-framework-react-design-system build:types
```

Expected: no errors.

- [ ] **Step 3: Create a changeset**

```powershell
pnpm changeset
```

When prompted:
- Select `@igrp/igrp-framework-react-design-system`
- Type: **patch** (never major or minor — repo is in beta pre-release mode)
- Summary: `fix(data-table): fix filter state desync, date range picker, clear-all button, select rendering, and a11y issues`

- [ ] **Step 4: Commit the changeset**

```bash
git add .changeset/
git commit -m "chore: add changeset for data-table filter fixes"
```

---

## Verification Checklist

After all tasks complete, manually verify in Storybook (`pnpm storybook`) or the demo (`pnpm dev:demo`):

| Scenario | Expected |
|---|---|
| `IGRPDataTableFilterSelect` with options array | Each option shows its `label`, not `[object Object]` |
| `IGRPDataTableFilterFaceted` — click row text | Checkbox toggles |
| `IGRPDataTableFilterFaceted` — `table.resetColumnFilters()` | All checkboxes clear |
| `IGRPDataTableFilterDropdown` with `disabled={true}` | Button has native `disabled` attribute in DOM |
| `IGRPDataTableFilterDate` | Popover opens with range calendar; trigger shows selected range |
| `IGRPDataTableFilterDate` with `clearDates` toggle | Calendar resets |
| `onFiltersCleared` callback | Fires once after clear button click |
| Clear button | Only visible when at least one column filter is active |
