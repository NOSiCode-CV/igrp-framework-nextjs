# Horizon layer (`IGRP*`)

Opinionated, app-ready components. **Default for everything.** Built on Primitives + Radix, but add labels, icons, loading states, error rendering, and form-context wiring.

All exports are at the root of `@igrp/igrp-framework-react-design-system`. Every consuming file needs `'use client'`.

## Shared prop foundation

Most `IGRPInput*` and many display components extend a common base:

- `IGRPBaseAttributes`: `label`, `labelClassName`, `helperText`, `showIcon`, `iconName`, `iconSize`, `iconPlacement` (`"start" | "end"`), `iconClassName`, `name`
- `IGRPInputProps` (extends base + native input attrs): adds `inputClassName`, `error`

So `label="Email"`, `helperText="We never share it"`, `iconName="Mail"`, `iconPlacement="start"` work on virtually every input.

## Buttons & actions

| Component | Notes |
| --- | --- |
| `IGRPButton` | Variants via `Button` primitive; props of interest: `loading`, `loadingText`, `iconName`, `iconPlacement`, `iconClassName`, `asChild`. Icon size auto-scales per button size. |
| `IGRPCopyTo` | One-click copy with success state. |
| `IGRPLink` | Token-aware link with variants (`IGRPLinkVariants`). |

## Surfaces / chrome

| Component | Notes |
| --- | --- |
| `IGRPCard` | Includes `CardHeader/CardTitle/CardDescription/CardContent/CardFooter` slots via primitive composition. |
| `IGRPCardDetails` | Label/value key-list inside a card. |
| `IGRPStatsCard` | Numeric KPI with icon + trend. |
| `IGRPContainer` | Max-width responsive container. |
| `IGRPSeparator` | Token-aware divider. |
| `IGRPBanner` | Top-of-page announcement. |
| `IGRPAlert` | Inline alert; status variants. |
| `IGRPBadge` | Status pill; variants via `igrpBadgeVariants`. |
| `IGRPAvatar` / `IGRPUserAvatar` (custom) | Avatar with image + initials fallback. |

## Page structure

| Component | Notes |
| --- | --- |
| `IGRPPageHeader` | Title, description, breadcrumbs, action slot. |
| `IGRPPageFooter` | Sticky footer slot. |
| `IGRPHeadline` / `IGRPText` | Typography primitives with variants. |
| `IGRPMenuNavigation` | Top-nav menus. |

## Overlays & dialogs

| Component | Notes |
| --- | --- |
| `IGRPModalDialog` | + `IGRPModalDialogContent` (size: `sm`/`md`/`lg`/`xl`/`full`), `IGRPModalDialogHeader` (stickyHeader), `IGRPModalDialogFooter` (stickyFooter), `IGRPModalDialogTrigger`, `IGRPModalDialogClose`. |
| `IGRPAlertDialog` | Confirm prompt. |
| `IGRPCommand` | Command palette / search. |
| `IGRPDropdownMenu` | Action menu (use for row actions on tables if `IGRPDataTableDropdownMenu` doesn't fit). |
| `IGRPNotification` / `IGRPTemplateNotifications` (in next-ui) | Toast/notif system; toaster mounted via `Toaster` primitive. |

## Forms & inputs

See `references/forms.md` — heavy enough to deserve its own file. Quick list of what's available:

- Container: `IGRPForm`, `IGRPFormField`, `IGRPFormList`, `IGRPFieldDescription`, `IGRPLabel`
- Text-like: `IGRPInputText`, `IGRPInputNumber`, `IGRPInputPassword`, `IGRPInputPhone`, `IGRPInputSearch`, `IGRPInputUrl`, `IGRPTextarea`, `IGRPInputAddOn`
- Choice: `IGRPSelect`, `IGRPCombobox`, `IGRPRadioGroup`, `IGRPCheckbox`, `IGRPSwitch`
- Specialty: `IGRPInputColor`, `IGRPInputFile`, `IGRPInputHidden`, `IGRPInputTime`, `IGRPDateTimeInput`, `IGRPDatePicker`, `IGRPDatePickerSingle`, `IGRPDatePickerRange`
- Calendars (not form-bound): `IGRPCalendarSingle`, `IGRPCalendarSingleTime`, `IGRPCalendarRange`, `IGRPCalendarRangeTime`, `IGRPCalendarMultiple`

## Data display

| Component | Notes |
| --- | --- |
| `IGRPDataTable` | TanStack Table-based. See `references/data-table.md`. |
| `IGRPTable` | Lightweight static table (no TanStack); for simple tabular display. |
| `IGRPTabs` | `items: IGRPTabItem[]` API. |
| `IGRPAccordion` | `items: IGRPAccordionItem[]` API. |
| `IGRPInfoCard` | Title/desc/icon presentation card. |

## Charts

See `references/charts.md`. Components: `IGRPAreaChart`, `IGRPHorizontalBarChart`, `IGRPVerticalBarChart`, `IGRPLineChart`, `IGRPPieChart`, `IGRPRadarChart`, `IGRPRadialBarChart`.

## Specialty / media

| Component | Notes |
| --- | --- |
| `IGRPImage` | Aspect-ratio aware image (`IGRPRatioType`). |
| `IGRPPdfViewer` | PDF embed with `IGRPDocumentItem[]`. |
| `IGRPChat` | Chat thread with `IGRPChatMessage[]`. |
| `IGRPLoadingSpinner` | Token-colored spinner. |

## Naming convention

- Main component always `IGRP*`. Props interface is `IGRP*Props`.
- Sub-components and exports keep the `IGRP*` prefix (`IGRPModalDialogContent`, `IGRPFormField`, `IGRPDataTableDropdownMenu`) so a single import statement is greppable.
- Variant constants exported alongside: `igrpBadgeVariants`, `igrpHeadlineVariants`, `igrpTextVariants`, `IGRPLinkVariants`.

## When Horizon is the wrong choice

If you find yourself fighting a Horizon prop (e.g. you need a button that renders a plain anchor without any of the Button variants, or you need a card with absolutely no padding), drop to the matching Primitive and apply tokens directly. See `references/primitives.md`.
