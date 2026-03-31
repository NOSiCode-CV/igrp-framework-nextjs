# IGRP Design System Overview

## Package

- **Import**: `@igrp/igrp-framework-react-design-system`
- **Exports**: Client-side components (`'use client'`) — add `'use client'` to every file that imports them
- **Styling**: Tailwind CSS v4, design tokens via CSS variables

## Component Layers

| Layer | Naming | When to use |
|-------|--------|-------------|
| **Horizon** | `IGRP*` | Default for all app UI. Labels, icons, form wiring, loading states built in. |
| **UI** | `Button`, `Card`, `Input`, etc. (no prefix) | Custom composition, full control needed. |
| **Custom** | `IGRPStatsCard`, `IGRPUserAvatar`, etc. | Domain-specific components. |

**Always prefer Horizon. Use UI only when Horizon doesn't fit.**

## Key Types

| Type | Purpose |
|------|---------|
| `IGRPBaseAttributes` | `label`, `helperText`, `showIcon`, `iconName`, `iconPlacement`, `iconSize`, `name` |
| `IGRPInputProps` | Input props + `inputClassName`, `error`, `gridSize` |
| `IGRPSize` | `'sm' \| 'md' \| 'lg' \| 'xl'` |
| `IGRPOptionsProps` | `label`, `value`, `color`, `status`, `icon`, `group`, `description`, `image`, `flag` |
| `IGRPGridSize` | `'default' \| 'full' \| '1/2' \| '1/3' \| '2/3' \| '1/4' \| '3/4'` |
| `IGRPPlacementProps` | `'start' \| 'end' \| 'center'` |
| `IGRPIconName` | Lucide icon name string union |

## Utility Exports

```tsx
import {
  cn,                   // class merging (clsx + tailwind-merge)
  igrpGetInitials,      // "John Doe" -> "JD"
  igrpToPascalCase,     // "my-name" -> "MyName"
  IGRPColors,           // color palette constants
  igrpColorText,        // color -> Tailwind text class
  useIGRPMetaColor,     // syncs browser chrome theme-color meta tag
  useIsMobile,          // responsive mobile detection hook
  formatDateRange,      // format date ranges to string
  formatDateToString,   // format single date to string
  igrpIsExternalUrl,    // detect external vs internal URLs
  igrpNormalizeUrl,     // normalize URL strings
} from '@igrp/igrp-framework-react-design-system';
```

## Re-exported External Types

```tsx
import type {
  // TanStack Table (used by IGRPDataTable)
  ColumnDef, Column, Row, RowSelectionState, SortingState,
  PaginationState, ColumnFiltersState, VisibilityState,
  ExpandedState, FilterFn, OnChangeFn,
  // react-day-picker (used by date pickers)
  DateRange,
} from '@igrp/igrp-framework-react-design-system';
```

## Deprecated Components

| Deprecated | Replace with |
|------------|-------------|
| `IGRPCalendar` | `IGRPCalendarSingle`, `IGRPCalendarRange`, or `IGRPCalendarMultiple` |
| `IGRPDatePicker` | `IGRPDatePickerSingle`, `IGRPDatePickerRange`, or `IGRPDatePickerMultiple` |

## CSS Setup

See [theming.md](./theming.md) for full CSS/token setup, dark mode, and theme variants.
