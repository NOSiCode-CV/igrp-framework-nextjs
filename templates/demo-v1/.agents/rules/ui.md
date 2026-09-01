# UI rules — IGRP design system

> Canonical. Every AI tooling bridge in this template (`AGENTS.md`, `.cursor/`,
> `.trae/`, `.github/`) points here. Edit this file, not the copies.

All UI in this project comes from `@igrp/igrp-framework-react-design-system`.
The full component reference — the three-layer picker and source-verified prop
shapes — is the skill at `.agents/skills/igrp-design-system/SKILL.md`. Read it
before writing any form, table, chart, modal, or design-system import.

## Hard rules (non-negotiable)

- **All UI from `@igrp/igrp-framework-react-design-system`.** Never raw shadcn,
  MUI, Mantine, Chakra, Ant Design, or any other kit.
- **`'use client'`** on every file that imports from the design system — the
  package is wrapped in a client boundary.
- **Forms are always `IGRPForm` + Zod.** Never a raw `<form>` and never
  `react-hook-form` directly. `IGRPInput*` components auto-wire to the form via
  context using their `name` prop.
- **Semantic tokens only**: `bg-background`, `text-foreground`,
  `text-muted-foreground`, `border-input`, `bg-primary`, `bg-destructive`, …
  Never a raw palette colour (`bg-blue-500`, `text-red-600`).
- **No manual `dark:` overrides** in app code — tokens handle dark mode.
- **`cn()`** from the design system for class merging, not `clsx` or
  `classnames` directly.
- **`size-N`** when width equals height (`size-10`, not `w-10 h-10`).
- **`flex gap-N`** for spacing, not `space-x-N` / `space-y-N`.
- **Import tokens only**, never the removed `/styles` bundle:
  `@import "@igrp/igrp-framework-react-design-system/tokens";`

## Three-layer picker

| Layer | Prefix | When |
| --- | --- | --- |
| Horizon | `IGRP*` | Default for all app UI. Opinionated — labels, icons, loading, `IGRPForm` wiring built in. |
| Custom | `IGRP*` (e.g. `IGRPStatsCard`) | Domain pieces built on Horizon. |
| Primitives | unprefixed (`Button`, `Card`, `Input`) | Escape hatch only, when Horizon is too opinionated. |

Horizon first, always. Don't mix layers in one component without a reason.

## Component cheat sheet

| You want… | Use |
|---|---|
| Text input bound to a form | `IGRPInputText name="…"` inside `IGRPForm` |
| Button | `IGRPButton` — has `loading`, `loadingText`, `iconName`, `iconPlacement`, `asChild` |
| Modal | `IGRPModalDialog` + `IGRPModalDialogContent` (sizes: `sm`/`md`/`lg`/`xl`/`full`) |
| Confirm prompt | `IGRPAlertDialog` |
| Table | `IGRPDataTable` with `createIGRPColumnHelper<TRow>()`; row actions via the `actions` prop |
| Chart | `IGRPAreaChart` / `IGRPLineChart` / etc.; colours from `IGRP_CHART_COLORS` |
| Card | `IGRPCard` + separate exports `IGRPCardHeader` / `IGRPCardTitle` / `IGRPCardDescription` / `IGRPCardContent` / `IGRPCardFooter` (NOT dot notation) |
| Page header | `IGRPPageHeader` |
| Class merge | `cn(...)` from the design system root |

## Deep references

Alongside the skill at `.agents/skills/igrp-design-system/references/` — load
only the family in scope:

- `forms.md` — `IGRPForm` + Zod + all `IGRPInput*` (any form work)
- `data-table.md` — `IGRPDataTable`, `createIGRPColumnHelper`, row actions
- `charts.md` — `IGRPAreaChart` / `IGRPVerticalBarChart` / `IGRPLineChart` / …
- `horizon.md` — shared `IGRPInputProps`, naming conventions
- `primitives.md` — when to drop down, CVA variants
- `utilities.md` — `cn()`, `IGRPColors`, hooks
- `custom.md` — domain pieces

## Do not run `npx shadcn add`

The design system already vends every shadcn primitive plus the Horizon layer.
Adding one drops a colliding `components/ui/*.tsx`, skips Horizon wiring, and
duplicates dependencies the design system already manages. Use the Horizon
component, drop to the primitive from the design system root, or request the
component upstream.
