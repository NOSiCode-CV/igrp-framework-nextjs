---
name: igrp-design-system
description: >-
  Master skill for building all UI with the IGRP Design System (@igrp/igrp-framework-react-design-system).
  Covers every component layer: Horizon (IGRPButton, IGRPCard, IGRPForm, IGRPDataTable, IGRPInputText, etc.),
  UI (Button, Card, Input, etc.), and Custom domain components (IGRPStatsCard, IGRPUserAvatar, etc.).
  Use when the user asks to create any UI — forms, tables, modals, cards, charts, layouts, navigation, inputs, buttons, or dashboards — in ./ or any project that uses @igrp/igrp-framework-react-design-system.
  Always prefer IGRP components over raw HTML, Tailwind divs, or other UI libraries.
---

# IGRP Design System

All UI is built with `@igrp/igrp-framework-react-design-system`. All exports are client-side (`'use client'`).

> **IMPORTANT:** Components import from a single entry point: `@igrp/igrp-framework-react-design-system`

## Component Layers

| Layer | Naming | Use When |
| ------- | -------- | ---------- |
| **Horizon** | `IGRP*` | Default for all app UI. Has labels, icons, form wiring, loading states. |
| **UI** | `Button`, `Card`, `Input`, etc. (no prefix) | Custom composition, full control needed. |
| **Custom** | `IGRPStatsCard`, `IGRPUserAvatar`, etc. | Domain-specific components. |

**Always prefer Horizon. Use UI only when Horizon doesn't fit.**

## Critical Rules

### Styling → [rules/styling.md](./rules/styling.md)

- **Use `cn()` for class merging.** Import from `@igrp/igrp-framework-react-design-system`.
- **Semantic tokens only.** Use `bg-background`, `text-foreground`, `text-muted-foreground` — not raw Tailwind colors like `bg-blue-500`.
- **No manual `dark:` overrides.** Tokens handle dark mode.
- **`size-*` when width equals height.** `size-10` not `w-10 h-10`.
- **`flex gap-*` for spacing.** Not `space-x-*` or `space-y-*`.

### Forms & Inputs → [rules/forms.md](./rules/forms.md)

- **Always use `IGRPForm` + Zod.** Never raw `<form>` or react-hook-form directly.
- **IGRP inputs auto-wire** inside `IGRPForm`. Do not pass `register()` manually.
- **`IGRPFormField` only for custom/ui inputs.** Pass `control` from `useIGRPFormContext().form.control`.
- **`formRef` is required** (`useRef<IGRPFormHandle<typeof schema> | null>(null)`).

### Component Structure → [rules/composition.md](./rules/composition.md)

- **Card always uses full composition:** `IGRPCard` > `IGRPCardHeader` > `IGRPCardTitle` / `IGRPCardContent` / `IGRPCardFooter`.
- **Tabs:** `IGRPTabs` takes a `tabs` array prop — do not compose `TabsList`/`TabsTrigger` manually.
- **Sidebar:** use `IGRPSidebarProvider` wrapping `IGRPSidebar`.
- **DataTable:** pass `columns` (TanStack `ColumnDef[]`) and `data` to `IGRPDataTable`.
- **Icons:** `<IGRPIcon iconName="Check" size={16} />`. Icon names are Lucide names.

## Component Selection

| Need | Use |
| ------ | ----- |
| Button / action | `IGRPButton` (`variant`, `size`, `loading`, `showIcon`, `iconName`) |
| Text input | `IGRPInputText` |
| Number input | `IGRPInputNumber` |
| Password input | `IGRPInputPassword` |
| Search input | `IGRPInputSearch` |
| Textarea | `IGRPTextarea` |
| Select dropdown | `IGRPSelect` |
| Combobox | `IGRPCombobox` |
| Checkbox | `IGRPCheckbox` |
| Radio group | `IGRPRadioGroup` |
| Switch / toggle | `IGRPSwitch` |
| Date picker (single) | `IGRPDatePickerSingle` |
| Date picker (range) | `IGRPDatePickerRange` |
| Date picker (multiple) | `IGRPDatePickerMultiple` |
| Date + time | `IGRPDateTimeInput` |
| Time only | `IGRPInputTime` |
| File upload | `IGRPInputFile` |
| Phone input | `IGRPInputPhone` |
| URL input | `IGRPInputUrl` |
| Color picker | `IGRPInputColor` |
| Input with addons | `IGRPInputAddOn` |
| Card layout | `IGRPCard` + `IGRPCardHeader` + `IGRPCardContent` + `IGRPCardFooter` |
| Card with key/value | `IGRPCardDetails` |
| Form | `IGRPForm` + `IGRPFormField` (Zod) |
| Data table | `IGRPDataTable` |
| Modal / dialog | `IGRPModalDialog` |
| Alert dialog (confirm) | `IGRPAlertDialog` |
| Tabs | `IGRPTabs` |
| Navigation menu | `IGRPMenuNavigation` |
| Dropdown menu | `IGRPDropdownMenu` |
| Sidebar | `IGRPSidebar` + `IGRPSidebarProvider` |
| Page header | `IGRPPageHeader` |
| Page footer | `IGRPPageFooter` |
| Container | `IGRPContainer` |
| Area chart | `IGRPAreaChart` |
| Line chart | `IGRPLineChart` |
| Bar chart (vertical) | `IGRPVerticalBarChart` |
| Bar chart (horizontal) | `IGRPHorizontalBarChart` |
| Pie chart | `IGRPPieChart` |
| Radar chart | `IGRPRadarChart` |
| Radial bar chart | `IGRPRadialBarChart` |
| Alert / callout | `IGRPAlert` |
| Notification | `IGRPNotification` |
| Badge | `IGRPBadge` |
| Toast | `IGRPToaster` + `useIGRPToast` |
| Loading spinner | `IGRPLoadingSpinner` |
| Avatar | `IGRPAvatar` |
| Stats card (full) | `IGRPStatsCard` |
| Stats card (mini) | `IGRPStatsCardMini` |
| Stats card (top border) | `IGRPStatsCardTopBorderColored` |
| Status banner | `IGRPStatusBanner` |
| User avatar | `IGRPUserAvatar` |
| Icon | `IGRPIcon` (Lucide icon names) |
| Command palette / ⌘K | `IGRPCommand`, `IGRPCommandDialog`, `IGRPCommandInput`, `IGRPCommandList`, `IGRPCommandGroup`, `IGRPCommandItem` |
| Simple static table | `IGRPTable` (no sort/filter; for small read-only tables) |
| Field helper text / error | `IGRPFieldDescription` (outside `IGRPForm` only) |
| Typography / heading | `IGRPHeadline` |
| Body text | `IGRPText` |
| Link | `IGRPLink` |
| Text list | `IGRPTextList` |
| Separator | `IGRPSeparator` |
| Accordion | `IGRPAccordion` |
| Info card | `IGRPInfoCard` |
| Copy-to-clipboard | `IGRPCopyTo` |
| Chat UI | `IGRPChat` |
| PDF viewer | `IGRPPdfViewer` |
| Video embed | `IGRPVideoEmbed` |
| Image | `IGRPImage` |
| Stepper / process | `IGRPStepperProcess` |
| Repetitive fields | `IGRPRepetitiveComponent` |
| Standalone list | `IGRPStandaloneList` |
| Form list (dynamic) | `IGRPFormList` |

## Key Patterns

```tsx
// Form with validation
import { z } from 'zod';
import { useRef } from 'react';
import { IGRPForm, IGRPInputText, IGRPButton, type IGRPFormHandle } from '@igrp/igrp-framework-react-design-system';

const schema = z.object({ name: z.string().min(1), email: z.string().email() });

function MyForm() {
  const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null);
  return (
    <IGRPForm schema={schema} formRef={formRef} onSubmit={async (v) => console.log(v)}>
      <IGRPInputText name="name" label="Name" required />
      <IGRPInputText name="email" label="Email" type="email" required />
      <IGRPButton type="submit">Submit</IGRPButton>
    </IGRPForm>
  );
}
```

```tsx
// Button variants
<IGRPButton variant="default" size="md">Save</IGRPButton>
<IGRPButton variant="outline" size="sm">Cancel</IGRPButton>
<IGRPButton variant="destructive" loading loadingText="Deleting...">Delete</IGRPButton>
<IGRPButton showIcon iconName="ArrowRight" iconPlacement="end">Next</IGRPButton>
```

```tsx
// Card layout
import { IGRPCard, IGRPCardHeader, IGRPCardTitle, IGRPCardContent, IGRPCardFooter } from '@igrp/igrp-framework-react-design-system';
<IGRPCard>
  <IGRPCardHeader><IGRPCardTitle>Title</IGRPCardTitle></IGRPCardHeader>
  <IGRPCardContent>Content here</IGRPCardContent>
  <IGRPCardFooter>Footer</IGRPCardFooter>
</IGRPCard>
```

```tsx
// Data table
import { IGRPDataTable, type ColumnDef } from '@igrp/igrp-framework-react-design-system';
const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
];
<IGRPDataTable columns={columns} data={users} />
```

```tsx
// Toast
import { useIGRPToast, IGRPToaster } from '@igrp/igrp-framework-react-design-system';
// In layout: <IGRPToaster />
const { toast } = useIGRPToast();
toast({ title: 'Saved!', description: 'Record updated.', variant: 'success' });
```

```tsx
// Icon usage
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';
<IGRPIcon iconName="Check" size={16} className="text-green-500" />
```

## CSS Setup & Utilities

See [references/overview.md](./references/overview.md) for utility exports, key types, re-exported external types, and deprecated components.

See [references/theming.md](./references/theming.md) for full CSS/token setup, dark mode, and theme variants.

Quick reference for globals.css:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@custom-variant dark (&:is(.dark *));
@source "../**/*.{ts,tsx,js,jsx}";
@source "../../node_modules/@igrp/igrp-framework-react-design-system/dist/**/*.{js,jsx,ts,tsx,mjs,cjs}";
@import '@igrp/igrp-framework-react-design-system/tokens';
@import './themes.css';
```

**Do NOT** import `@igrp/*/styles.css`.

## Workflow

1. **Identify the UI need** → use the Component Selection table above to pick the right IGRP component.
2. **Apply Critical Rules** (styling, forms, composition) as you write code.
3. **Use Horizon first.** Only drop to UI for custom patterns Horizon doesn't cover.
4. **For deep API details**, load the relevant sub-skill below.
5. **All files importing design system components** need `'use client'`.

## Deep Dive — Component References

All component references live inside `components/`. Read the relevant file(s) when you need full API details — you do not need to read them all upfront.

### Button

- [components/button/button.md](./components/button/button.md) — variants, sizes, icons, loading state

### Form

- [components/form/form.md](./components/form/form.md) — IGRPForm API, IGRPFormHandle, validation modes
- [components/form/form-field.md](./components/form/form-field.md) — IGRPFormField props, render function
- [components/form/form-list.md](./components/form/form-list.md) — IGRPFormList dynamic field arrays
- [components/form/standalone-list.md](./components/form/standalone-list.md) — IGRPStandaloneList
- [components/form/field-description.md](./components/form/field-description.md) — IGRPFieldDescription (helper text + error for custom fields)

### Inputs

- [components/inputs/input-text.md](./components/inputs/input-text.md) — IGRPInputText, password, search, URL
- [components/inputs/select.md](./components/inputs/select.md) — IGRPSelect with options, groups, search
- [components/inputs/checkbox.md](./components/inputs/checkbox.md) — IGRPCheckbox, IGRPSwitch, IGRPRadioGroup
- [components/inputs/combobox.md](./components/inputs/combobox.md) — IGRPCombobox (multi-select)
- [components/inputs/date-picker.md](./components/inputs/date-picker.md) — IGRPDatePickerSingle/Range/Multiple
- [components/inputs/number.md](./components/inputs/number.md) — IGRPInputNumber, phone, amount
- [components/inputs/textarea.md](./components/inputs/textarea.md) — IGRPTextarea

### Calendar & Date/Time

- [components/calendar-datepicker/calendar.md](./components/calendar-datepicker/calendar.md) — standalone calendar components
- [components/calendar-datepicker/date-picker.md](./components/calendar-datepicker/date-picker.md) — date picker input variants
- [components/calendar-datepicker/time.md](./components/calendar-datepicker/time.md) — IGRPInputTime, IGRPDateTimeInput

### Data Table

- [components/datatable/datatable.md](./components/datatable/datatable.md) — IGRPDataTable props, columns
- [components/datatable/table-simple.md](./components/datatable/table-simple.md) — IGRPTable (lightweight static table, no TanStack)
- [components/datatable/cells.md](./components/datatable/cells.md) — cell renderers (badge, date, link, switch…)
- [components/datatable/row-actions.md](./components/datatable/row-actions.md) — row action patterns
- [components/datatable/filters.md](./components/datatable/filters.md) — filter components
- [components/datatable/pagination.md](./components/datatable/pagination.md) — client & server-side pagination

### Card

- [components/card/card.md](./components/card/card.md) — IGRPCard full composition
- [components/card/card-details.md](./components/card/card-details.md) — IGRPCardDetails key/value layout

### Charts

- [components/charts/area-line-bar.md](./components/charts/area-line-bar.md) — IGRPAreaChart, IGRPLineChart, IGRPVerticalBarChart, IGRPHorizontalBarChart
- [components/charts/pie-radar-radial.md](./components/charts/pie-radar-radial.md) — IGRPPieChart, IGRPRadarChart, IGRPRadialBarChart
- [components/charts/types.md](./components/charts/types.md) — shared chart types, config shapes, colors

### Modal & Dialogs

- [components/modal/modal-dialog.md](./components/modal/modal-dialog.md) — IGRPModalDialog API
- [components/modal/alert-dialog.md](./components/modal/alert-dialog.md) — IGRPAlertDialog (confirm pattern)

### Layout

- [components/layout/page-header.md](./components/layout/page-header.md) — IGRPPageHeader
- [components/layout/page-footer.md](./components/layout/page-footer.md) — IGRPPageFooter
- [components/layout/container.md](./components/layout/container.md) — IGRPContainer
- [components/layout/sidebar.md](./components/layout/sidebar.md) — IGRPSidebarProvider, IGRPSidebar

### Navigation

- [components/navigation/menu-navigation.md](./components/navigation/menu-navigation.md) — IGRPMenuNavigation
- [components/navigation/dropdown-menu.md](./components/navigation/dropdown-menu.md) — IGRPDropdownMenu
- [components/navigation/tabs.md](./components/navigation/tabs.md) — IGRPTabs

### Feedback

- [components/feedback/alert.md](./components/feedback/alert.md) — IGRPAlert
- [components/feedback/notification.md](./components/feedback/notification.md) — IGRPNotification
- [components/feedback/badge.md](./components/feedback/badge.md) — IGRPBadge
- [components/feedback/toaster.md](./components/feedback/toaster.md) — IGRPToaster, useIGRPToast
- [components/feedback/icon.md](./components/feedback/icon.md) — IGRPIcon, IGRPIconObject, IGRPIconList, IGRPIconName

### Command Palette

- [components/command/command.md](./components/command/command.md) — IGRPCommand family (inline + dialog ⌘K)

### Custom Domain

- [components/custom/stats-card.md](./components/custom/stats-card.md) — IGRPStatsCard, IGRPStatsCardMini
- [components/custom/stats-card-top-border.md](./components/custom/stats-card-top-border.md) — IGRPStatsCardTopBorderColored
- [components/custom/status-banner.md](./components/custom/status-banner.md) — IGRPStatusBanner
- [components/custom/user-avatar.md](./components/custom/user-avatar.md) — IGRPUserAvatar

### UI

- [components/ui/ui-overview.md](./components/ui/ui-overview.md) — all shadcn ui components for custom composition

### Rules & General References

- [rules/forms.md](./rules/forms.md) — IGRPForm rules, IGRPFormHandle API, validation
- [rules/styling.md](./rules/styling.md) — semantic tokens, cn(), spacing, dark mode
- [rules/composition.md](./rules/composition.md) — Card, Tabs, Modal, Sidebar, DataTable, Toast patterns
- [references/overview.md](./references/overview.md) — types, utilities, deprecated components
- [references/theming.md](./references/theming.md) — CSS setup, tokens, dark mode, theme variants
