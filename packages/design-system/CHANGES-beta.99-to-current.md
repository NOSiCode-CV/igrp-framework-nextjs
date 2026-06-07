# Design System — Component Changes: `0.1.0-beta.99` → current

Comparison of `@igrp/igrp-framework-react-design-system` between the published version **0.1.0-beta.99** (compiled `dist` declarations) and the **current source** (`packages/design-system/src`).

For every rename the format is **`old name` → `new name`** (same for props).

---

## Table of contents

1. [Structural / folder changes](#1-structural--folder-changes)
2. [Custom layer](#2-custom-layer)
3. [Experimental layer](#3-experimental-layer)
4. [Horizon layer](#4-horizon-layer)
5. [Primitives layer](#5-primitives-layer)
6. [Quick rename index](#6-quick-rename-index-old--new)

---

## 1. Structural / folder changes

| Old | New | Note |
|---|---|---|
| `components/exprimental/` | `components/experimental/` | Typo fixed; folder is now **empty** + build-excluded (`--ignore "**/components/experimental/**"`) |
| `horizon/proccess/` | `horizon/process/` | Typo fixed; junk files (`_stepper`, `stepper copy`) removed |
| `horizon/loading-spiner.tsx` | `horizon/loading-spinner.tsx` | Filename typo fixed (export name unchanged) |
| `horizon/charts/radial.d.ts` (single file) | `horizon/charts/radial/` (folder) | Split into a folder |
| — | `horizon/charts/*-chart-inner.tsx` | New internal split files (public API unchanged) |
| — | `src/i18n/` | **New** internationalization folder (did not exist in beta.99) |

---

## 2. Custom layer

Four components, all present in both versions: `stats-card-mini`, `stats-card-top-border-colored`, `user-avatar`, `status-banner`.

### Renamed

| Old | New |
|---|---|
| `StatsCardMini` (component) | `IGRPStatsCardMini` |
| `StatsCardMiniProps` (type) | `IGRPStatsCardMiniProps` |

> Aligned with the `IGRP*` naming convention. Prop **shape unchanged** — only the names changed.

### Added (net-new exported types)

- `IGRPStatsCardTopBorderColoredProps` — previously the props were declared inline and not exported.

### Unchanged

`IGRPStatsCardTopBorderColored`, `IGRPUserAvatar` (`IGRPUserAvatarProps`), `IGRPStatusBanner` (`IGRPStatusBannerProps`) — prop shapes identical.

---

## 3. Experimental layer

The entire `experimental` folder is **emptied** in the current version. None of these were exported from the package index (internal prototypes). Several **graduated** to stable layers under new names.

### Removed outright (no replacement)

| Old export(s) | Old location |
|---|---|
| `Component` (appointment picker) | `appointment-picker.tsx` |
| `IGRPTimeline`, `IGRPTimelineContent`, `IGRPTimelineDate`, `IGRPTimelineHeader`, `IGRPTimelineIndicator`, `IGRPTimelineItem`, `IGRPTimelineSeparator`, `IGRPTimelineTitle` | `timeline/` |
| `collapsible-documents` (was already empty) | `collapsible-documents.tsx` |

### Graduated / relocated

| Old (experimental) | New (current) | Note |
|---|---|---|
| `IGRPBanner`, `IGRPBanner2` — `experimental/banner.tsx` | `IGRPBanner` — `horizon/banner.tsx` | Reimplemented with full props (old had none). **`IGRPBanner2` dropped**. |
| `Component`, `Component2`, `Component3` (default), `Component4` — `experimental/cropper-image.tsx` | `IGRPImageCropper` (+ `IGRPImageCropperProps`, `IGRPImageCropperVariant`) — `horizon/image-cropper.tsx` | Four propless prototypes consolidated into one variant-driven component |
| `IGRPBreadcrumb`, `IGRPBreadcrumbList`, `IGRPBreadcrumbItem`, `IGRPBreadcrumbLink`, `IGRPBreadcrumbPage`, `IGRPBreadcrumbSeparator`, `BreadcrumbEllipsis` — `experimental/breadcrumb.tsx` | `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis` — `primitives/breadcrumb.tsx` | Opinionated `IGRP*` breadcrumb (props `variant`, `homeIcon`, `iconName`, `items`, `collapsed`, `maxItems`, `size`) **dropped** in favour of thin shadcn primitives |
| `IGRPSheet` (+ `IGRPSheetProps`) — `experimental/sheet/` | `Sheet`, … — `primitives/sheet.tsx` | Demoted to standard primitive; opinionated props (`labelTrigger`, `openSheet`, `useTrigger`, `side`) dropped |
| `ProgressIGRP` (+ `ProgressIGRPProps`) — `experimental/progress/` | `Progress` — `primitives/progress.tsx` | Demoted to standard primitive |
| `dropzone/` (no exports) | `horizon/input/file.tsx` `variant="dropzone"` | Folded into the file input as a variant |

### `IGRPBanner` prop change (old → new)

The name survives but the component is entirely new:

- **Old:** `IGRPBanner()` — **no props**.
- **New:** `IGRPBanner(props: IGRPBannerProps)` with:
  - `variant: "cookie" | "announcement"` (required)
  - `message: string` (required)
  - `learnMoreHref?`, `learnMoreLabel?` (default `"Learn more"`), `acceptLabel?` (default `"Accept"`), `declineLabel?` (default `"Decline"`)
  - `onAccept?`, `onDecline?`, `onDismiss?`, `className?`

---

## 4. Horizon layer

Largest category. Shared base types (`IGRPInputProps`, `IGRPCalendarProps`, `IGRPDatePickerBaseProps`, `IGRPCalendarTimeProps`, `IGRPBaseAttributes`) live in the types package in both versions.

### 4.1 Components added

| Component / export | Location |
|---|---|
| `IGRPBanner` (+ `IGRPBannerProps`) | `banner.tsx` |
| `IGRPImageCropper` (+ `IGRPImageCropperProps`, `IGRPImageCropperVariant`) | `image-cropper.tsx` |
| `IGRPMenubar` family: `IGRPMenubarPortal`, `IGRPMenubarMenu`, `IGRPMenubarTrigger`, `IGRPMenubarContent`, `IGRPMenubarGroup`, `IGRPMenubarSeparator`, `IGRPMenubarLabel`, `IGRPMenubarItem`, `IGRPMenubarShortcut`, `IGRPMenubarCheckboxItem`, `IGRPMenubarRadioGroup`, `IGRPMenubarRadioItem`, `IGRPMenubarSub`, `IGRPMenubarSubTrigger`, `IGRPMenubarSubContent` | `menubar.tsx` |
| `createIGRPColumnHelper` (+ `IGRPColumnHelper`, `IGRPCellType`, `IGRPCellConfig`, `IGRPCellBadgeConfig`, `IGRPCellDateConfig`, `IGRPCellAmountConfig`, `IGRPCellLinkConfig`, `IGRPCellSimpleConfig`, `IGRPAccessorColumnDef`) | `data-table/column-helper.ts` |
| `IGRPDataTableRowActionsCell` | `data-table/row-actions-cell.tsx` |
| `useFilterState` | `data-table/hooks/use-filter-state.ts` |
| Data-table types: `IGRPDataTableAction`, `IGRPDataTableActionType`, `IGRPDataTableActionBase`, `IGRPDataTableActionLink`, `IGRPDataTableActionAlert`, `IGRPDataTableActionModal`, `IGRPDataTableActionCustom`, `IGRPDataTableFilterType`, `IGRPDataTableFilterDescriptor`, `IGRPDataTablePaginationConfig`, `IGRPDataTableQuery` | `data-table/types.ts` |
| `FileWithProgress` (type) | `input/file.tsx` |

### 4.2 Components removed

| Removed | Old location | Note |
|---|---|---|
| `IGRPCalendar` (component) (+ deprecated calendar) | `calendar/calendar.d.ts` | Component file gone; `IGRPCalendarProps` type still lives in the types package |
| `IGRPStandaloneList` (+ `IGRPStandaloneListProps`) | `form/standalone-list.d.ts` | |
| `IGRPRepetitiveComponent` (+ `IGRPRepetitiveComponentProps`) | `repetitive-component.d.ts` | |
| `IGRPCustomIconProps` (type) | `icon/custom.d.ts` | Now inlined; `IGRPCircleFull` still exported |
| `IGRPDataTableTooltipProvider` re-export | `data-table/action-button-icon.d.ts` | Provider still exists in `tooltip-provider.tsx`; just no longer re-exported here |
| `multiColumnFilterFn` | `data-table/lib/filters-utils` | Was `@deprecated`; now removed |

### 4.3 Components renamed (old → new) — all typo fixes

| Old | New | Location |
|---|---|---|
| `IGPRDataTableToggleVisibility` | `IGRPDataTableToggleVisibility` | `data-table/toggle-visibility` |
| `IGPRDataTableVisibilityProps` (type) | `IGRPDataTableVisibilityProps` | `data-table/toggle-visibility` |
| `IGRPFormFielProps` (interface) | `IGRPFormFieldProps` | `form/form-field` |

### 4.4 Prop changes

#### data-table

- **`IGRPDataTableProps`** (`data-table/index`) — **added**: `onFiltersCleared?: () => void`, `actions?: IGRPDataTableAction<TData>[]`, `rowCount?: number`, `onQueryChange?: (query: IGRPDataTableQuery) => void`, `pagination?: IGRPDataTablePaginationConfig`.
- **`IGRPDataTableActionProps`** (`row-actions`) — **added**: `disabled?: boolean`.
- **`IGRPDataTableDialogProps`** (`row-actions`) — **added**: `render?: (close: () => void) => ReactNode`.
- **`IGRPDataTableCellExpanderProps`** (`cell`) — now `extends React.ComponentProps<typeof Button>`; prop `field: string` → `field?: string` (now optional + `@deprecated`); **added** `label?: string`.

#### form

- **`IGRPFormProps`** (`form/index`) — **added**: `resetKey?: React.Key`.
- **`IGRPFormHandle`** (`form/index`) — generic middle type param `any` → `unknown`.
- **`IGRPFormListProps`** (`form/form-list`) — **added**: `renderRemoveAction?: (params) => React.ReactNode`, `onItemRemove?: (item: TItem, index: number) => void`.

#### input

| Component | Change |
|---|---|
| `IGRPCheckboxProps` (`input/checkbox`) | **Removed** `gridSize` from the `Pick<IGRPInputProps, …>` |
| `IGRPSwitchProps` (`input/switch`) | **Removed** `gridSize` from the Pick |
| `IGRPTextareaProps` (`input/textarea`) | **Removed** `gridSize` from the Pick |
| `IGRPInputColorProps` (`input/color`) | **Removed** `showHexValue?: boolean`; **added** `format?: ColorFormat`, `defaultFormat?: ColorFormat`, `showFormatValue?: boolean` (multi-format color replaces hex-only toggle) |
| `IGRPInputFileProps` (`input/file`) | **Added** dropzone mode: `variant?: "default" \| "dropzone"`, `maxSize?`, `maxFiles?`, `acceptTypes?`, `dropzoneLabel?`, `dropzoneHint?`, `removeLabel?`, `removeAllLabel?`, `dragActiveLabel?`, `dragRejectLabel?`, `maxSizeLabel?`, `maxFilesLabel?`, `rejectedAlertTitle?`, `onFilesChange?: (files: File[]) => void` |
| `IGRPDatePicker` / `IGRPDatePickerProps` (`input/date-picker`) | **Reworked.** Old: single `@deprecated` component, `IGRPDatePickerProps = IGRPCalendarProps & IGRPDatePickerBaseProps`. New: non-deprecated dispatcher with discriminated union `IGRPDatePickerProps = IGRPDatePickerSingleModeProps \| IGRPDatePickerRangeModeProps`, selected via required `mode: "single" \| "range"` (delegates to `IGRPDatePickerSingle` / `IGRPDatePickerRange`) |
| `IGRPRadioGroupProps` (`input/radio-group`) | Shape unchanged; `gridSize` deprecation note wording changed |
| `IGRPInputNumberProps` (`input/number`) | Shape unchanged; `step?` gained `@deprecated` note |

#### Other additive changes

- **`loading-spinner`** — **added** `label?: string` (default "Loading…"); now exports `IGRPLoadingSpinnerProps`.
- **`IGRPPageHeaderProps`** (`page-header`) — **added** `headlineContentClassName?: string`, `pageHeaderContentClassName?: string`.

#### Charts — no prop changes

`IGRPAreaChart`, `IGRPLineChart`, `IGRPPieChart`, `IGRPRadarChart`, `IGRPHorizontalBarChart`, `IGRPVerticalBarChart`, `IGRPRadialBarChart` and `charts/types.ts` shapes are identical (interfaces just physically moved into `*-chart-inner.tsx`).

---

## 5. Primitives layer

Near-zero churn. **No** components added, removed, or renamed (all 55 files share identical export names). Only two prop changes:

| Component | Change |
|---|---|
| `Button` (`size` variant) | **Added** `"icon-xs"`. Old: `default \| xs \| sm \| lg \| icon \| icon-sm \| icon-lg` → New adds `icon-xs` |
| `DialogContent` | **Added** prop `showCloseButtonClassName?: string`; `showCloseButton` now defaults to `true` |

---

## 6. Quick rename index (old → new)

| Old | New | Layer |
|---|---|---|
| `StatsCardMini` | `IGRPStatsCardMini` | Custom |
| `StatsCardMiniProps` | `IGRPStatsCardMiniProps` | Custom |
| `IGPRDataTableToggleVisibility` | `IGRPDataTableToggleVisibility` | Horizon |
| `IGPRDataTableVisibilityProps` | `IGRPDataTableVisibilityProps` | Horizon |
| `IGRPFormFielProps` | `IGRPFormFieldProps` | Horizon |
| `IGRPBanner` + `IGRPBanner2` (experimental, propless) | `IGRPBanner` (horizon, full props; `IGRPBanner2` dropped) | Experimental → Horizon |
| `Component`/`Component2`/`Component3`/`Component4` (cropper-image) | `IGRPImageCropper` | Experimental → Horizon |
| `IGRPBreadcrumb*` (experimental, opinionated) | `Breadcrumb*` (primitives, shadcn) | Experimental → Primitives |
| `IGRPSheet` | `Sheet` | Experimental → Primitives |
| `ProgressIGRP` | `Progress` | Experimental → Primitives |

### Renamed props

| Component | Old prop | New prop |
|---|---|---|
| (see prop sections above — most prop changes are additions/removals, not renames) | | |

> Note on props: the changes between these versions are predominantly **added** and **removed** props rather than direct prop renames. The notable prop removals are `gridSize` (checkbox/switch/textarea Picks) and `showHexValue` (color input → replaced by `format`/`defaultFormat`/`showFormatValue`).
