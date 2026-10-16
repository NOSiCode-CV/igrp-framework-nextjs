---
name: design-system
description: Source-verified usage reference for @igrp/igrp-framework-react-design-system, the UI kit of IGRP apps. Use when building, editing or reviewing UI in an IGRP app, template or demo, covering forms, data tables, charts, dialogs, cards, page layout and styling, or when choosing between an `IGRP*` component and a primitive. Prefer it over generic shadcn/React knowledge, because the prop shapes differ from upstream.
---

# IGRP Design System

`@igrp/igrp-framework-react-design-system` has three layers. Pick the highest one that fits:

| Layer | Names | Role |
| --- | --- | --- |
| **Horizon** | `IGRP*` | The default. It adds labels, helper text, i18n defaults and form binding. |
| **Custom** | `IGRPUserAvatar`, `IGRPStatsCardMini`, `IGRPStatsCardTopBorderColored`, `IGRPStatusBanner` | Fixed IGRP compositions built on Horizon. |
| **Primitives** | unprefixed (`Button`, `Sheet`, `Tooltip`) | The escape hatch, for needs no `IGRP*` covers. |

The order matters most inside forms: a primitive `Input` inside `IGRPForm` neither binds nor validates.

## Hard rules

1. **All UI comes from this package.** If something is missing, use the DS primitive or ask for it in the DS. Never add another UI kit or run `npx shadcn add`.
2. **`'use client'` goes on every file that renders DS components with functions** (handlers, render props, `cell`, `renderItem`), which in practice means any interactive screen. The barrel itself is server-safe, so server files may import plain values (`IGRP_META_THEME_COLORS`) and `cn` from `/cn`.
3. **Forms are `IGRPForm` + a Zod schema** with `IGRP*` fields bound by `name`. See `forms.md`.
4. **Colour comes only from semantic tokens** (`bg-primary`, `text-muted-foreground`, `bg-success`, `border-input`, `var(--chart-n)`). Dark mode comes from the tokens, so app code never writes `dark:`. When a role is missing, add a token in the DS.
5. **Use `cn()` for class merging.** Import it from the root in client files and from `@igrp/igrp-framework-react-design-system/cn` in server files.
6. **Layout:** `size-N` for equal width and height, `flex gap-N` / `grid gap-N` for spacing.
7. **CSS** is `@import "@igrp/igrp-framework-react-design-system/tokens";` only (`/styles` was removed). Tailwind compiles in the app.
8. **Built-in labels come from the i18n catalog** (pt by default; see `utilities.md`). Pass a label prop only for screen-specific copy, never to translate.

## Entry points

| Import | Contains |
| --- | --- |
| `@igrp/igrp-framework-react-design-system` | Every component, hook, helper and type |
| `…/cn` | `cn` only. Guaranteed server-safe. |
| `…/rich-text` | `IGRPRichTextEditor`, `IGRPRichTextView`. Kept separate so TipTap stays out of other bundles. |
| `…/tokens` | CSS variables |

These are the only entry points. Imports from `dist/` break.

## References

Read the reference for the family you're about to write, before you write it. Each one lists the real prop names, the value each field writes, and the props that are accepted but ignored.

- **`references/forms.md`**: covers `IGRPForm`, every field, `IGRPFormList`, `IGRPFormField`, rich text, date pickers and server-action submission. Read it for any form or field.
- **`references/data-table.md`**: covers `IGRPDataTable`, columns, row actions, cells, filters and server mode. Read it for any table with behaviour.
- **`references/charts.md`**: covers the seven `IGRP*Chart`s, series configs, colours and number formatting.
- **`references/horizon.md`**: everything else in `IGRP*`, including buttons, cards, alerts, badges, page header, modal and alert dialogs, tabs, accordion, toasts, typography, media and `IGRPTable`.
- **`references/custom.md`**: the four Custom components. Their props are not what their names suggest.
- **`references/primitives.md`**: the primitive catalog and when dropping to that layer is right.
- **`references/utilities.md`**: `cn`, `IGRPColors`, the tokens list, helpers, hooks, i18n and re-exported types.

## Picking a component

| Need | Use |
| --- | --- |
| Form + fields | `IGRPForm` + `IGRPInputText` / `IGRPInputNumber` / `IGRPSelect` / `IGRPCombobox` / `IGRPMultiSelect` / `IGRPRadioGroup` / `IGRPCheckbox` / `IGRPSwitch` / `IGRPDatePickerSingle` / … |
| Table with sort, filter, paging or actions | `IGRPDataTable` (static display: `IGRPTable`) |
| Chart | `IGRPVerticalBarChart`, `IGRPHorizontalBarChart`, `IGRPLineChart`, `IGRPAreaChart`, `IGRPPieChart`, `IGRPRadarChart`, `IGRPRadialBarChart` |
| Button / link | `IGRPButton` (with `type="submit"` in forms) / `IGRPLink` |
| Card | `IGRPCard` + `IGRPCardHeader` / `IGRPCardTitle` / `IGRPCardDescription` / `IGRPCardContent` / `IGRPCardFooter` (separate exports) |
| KPI tile | `IGRPStatsCard`, `IGRPStatsCardMini`, `IGRPStatsCardTopBorderColored` |
| Modal | `IGRPModalDialog` + `IGRPModalDialogContent size` + `IGRPModalDialogTitle` |
| Confirmation | `IGRPAlertDialog` (controlled: `open` / `onOpenChange`) |
| Toast | `useIGRPToast()`. The toaster is already mounted. |
| Inline message | `IGRPAlert`. Top bar or cookie notice: `IGRPBanner`. |
| Page title + actions | `IGRPPageHeader` |
| Tabs / accordion | `IGRPTabs items` / `IGRPAccordion items` |
| Side panel, tooltip, popover, breadcrumb, skeleton, empty state | Primitives: `Sheet`, `Tooltip`, `Popover`, `Breadcrumb`, `Skeleton`, `Empty` |

## Traps that hit almost every screen

- **`IGRPButton` icons:** `iconName` renders only with `showIcon`. Icon-size buttons need an `aria-label`.
- **Submit button state:** `IGRPButton` doesn't watch the form. Take `loading` from `useIGRPFormContext().isSubmitting` in a child component.
- **Loading another record:** pass `resetKey={record.id}` (it resets values and dirty state to the new `defaultValues`).
- **Date pickers write `null` when cleared,** so schemas need `.nullable()`. `IGRPInputNumber` writes `undefined`.
- **Table row actions** go in the `actions` prop. With 3 or more they collapse into a dropdown, where a `custom` action must return a single element.
- **Table** `columns` / `data` / `actions` / `onQueryChange` must be stable references (module scope, `useMemo`, `useCallback`).
- **Charts:** every chart requires `categoryKey`, and Pie / RadialBar also need `nameKey`. `valueFormatter` is a function. Leave out `color` and the themed palette applies.
