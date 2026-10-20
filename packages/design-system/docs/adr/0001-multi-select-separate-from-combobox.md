---
status: accepted
---

# Multi-value selection is its own component, not a combobox variant

Multi-value choice fields get a dedicated `IGRPMultiSelect` whose value is always a selection (`string[]`), and `IGRPCombobox variant="multiple"` is deprecated (dev warning now, removed at 0.1.0 stable). The single and multiple modes shared almost nothing but the popover: a `string | string[]` value union let each mode mishandle the other's shape, and rendering the selection as removable chips inside the trigger nested buttons inside a button — the root of the defects in consumer request §11 (`docs/11-igrp-multi-select.md`).

## Considered Options

- **Fix `variant="multiple"` in place** — rejected: keeps the value union and a trigger layout that cannot hold per-chip remove controls without invalid nesting.
- **New component with the variant delegating to it** — rejected: two public names for one behaviour, and the delegate still has to type its value as the union.

## Consequences

- Chips render below the trigger, never inside it; single-mode `IGRPCombobox` keeps its trigger unchanged.
- The combobox's single-mode defects found alongside (modal popover, field never touched, cosmetic `disabled`, `errorText` ignored when form-bound) are fixed in the combobox itself, not by this split.
