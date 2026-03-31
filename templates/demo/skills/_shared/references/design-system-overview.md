# IGRP Design System Overview

## Package

- **Import**: `@igrp/igrp-framework-react-design-system`
- **Exports**: Client-side components (`'use client'`)
- **Styling**: Tailwind CSS v4, design tokens via CSS variables

## Component Layers

### Horizon (use first)

High-level components with labels, icons, form integration, validation. Prefixed `IGRP*`.

### Primitives (`*Primitive`)

Low-level building blocks. Use when composing custom components. Exported as `IGRP*Primitive`.

### Custom

Domain components: `IGRPStatusBanner`, `IGRPStatsCardTopBorderColored`, `IGRPUserAvatar`, `IGRPStatsCardMini`.

## Key Types

| Type | Purpose |
|------|---------|
| `IGRPBaseAttributes` | `label`, `helperText`, `showIcon`, `iconName`, `iconPlacement`, `iconSize`, `name` |
| `IGRPInputProps` | Input props + `inputClassName`, `error`, `gridSize` |
| `IGRPSize` | `'sm' \| 'md' \| 'lg' \| 'xl'` |
| `IGRPOptionsProps` | `label`, `value`, `color`, `status`, `icon`, `group`, `description`, `image`, `flag` |
| `IGRPGridSize` | `'default' \| 'full' \| '1/2' \| '1/3' \| '2/3' \| '1/4' \| '3/4'` |

## Styling

- Tokens: `@igrp/igrp-framework-react-design-system/tokens` (in `src/styles/globals.css`)
- Theme overrides: `src/styles/themes.css`
- Do **not** import prebuilt `@igrp/*/styles.css` files.
