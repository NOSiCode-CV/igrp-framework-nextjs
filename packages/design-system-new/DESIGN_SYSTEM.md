# IGRP Design System – LLM Reference

This document provides context for AI agents (e.g. Cursor) when building UI with `@igrp/igrp-framework-react-design-system` in templates (e.g. `templates/demo`) or apps.

## Package Overview

- **Package**: `@igrp/igrp-framework-react-design-system`
- **Exports**: All components are client-side (`'use client'`)
- **Styling**: Tailwind CSS v4, design tokens via CSS variables

## Component Layers

### 1. Primitives (`*Primitive`)

Low-level building blocks (Radix-based). Use when composing custom components.

```tsx
import { Button, Card, IGRPDialogPrimitive, Input } from '@igrp/igrp-framework-react-design-system';
```

### 2. Horizon (recommended for templates)

High-level components with IGRP conventions: labels, icons, form integration, validation.

```tsx
import {
  IGRPButton,
  IGRPCard,
  IGRPModalDialog,
  IGRPInputText,
  IGRPForm,
} from '@igrp/igrp-framework-react-design-system';
```

### 3. Custom

Domain-specific components (e.g. `IGRPStatusBanner`, `IGRPStatsCardTopBorderColored`, `IGRPUserAvatar`).

## Naming Convention

- All exports use the `IGRP` prefix.
- Primitives: `IGRP*Primitive` (e.g. `Button`).
- Horizon: `IGRP*` (e.g. `IGRPButton`, `IGRPInputText`).

## Key Types

| Type                 | Purpose                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `IGRPBaseAttributes` | `label`, `helperText`, `showIcon`, `iconName`, `iconPlacement`, `iconSize`, `iconClassName`, `name` |
| `IGRPInputProps`     | Extends `IGRPBaseAttributes` + `inputClassName`, `error`, `gridSize`                                |
| `IGRPSize`           | `'sm' \| 'md' \| 'lg' \| 'xl'`                                                                      |
| `IGRPPlacementProps` | `'start' \| 'end' \| 'center'`                                                                      |

## Common Patterns

### Form with validation

```tsx
import {
  IGRPForm,
  IGRPFormField,
  IGRPInputText,
  IGRPButton,
} from '@igrp/igrp-framework-react-design-system';

<IGRPForm schema={schema} onSubmit={onSubmit}>
  <IGRPFormField name="email" label="Email" required>
    <IGRPInputText name="email" type="email" />
  </IGRPFormField>
  <IGRPButton type="submit">Submit</IGRPButton>
</IGRPForm>;
```

### Input with icon

```tsx
<IGRPInputText
  name="search"
  label="Search"
  showIcon
  iconName="Search"
  iconPlacement="start"
  placeholder="Search..."
/>
```

### Button variants

```tsx
<IGRPButton variant="default" size="md">Submit</IGRPButton>
<IGRPButton variant="outline" size="sm">Cancel</IGRPButton>
<IGRPButton variant="destructive" loading>Delete</IGRPButton>
```

### Cards

```tsx
import {
  IGRPCard,
  IGRPCardHeader,
  IGRPCardTitle,
  IGRPCardContent,
  IGRPCardFooter,
} from '@igrp/igrp-framework-react-design-system';

<IGRPCard>
  <IGRPCardHeader>
    <IGRPCardTitle>Title</IGRPCardTitle>
  </IGRPCardHeader>
  <IGRPCardContent>Content</IGRPCardContent>
  <IGRPCardFooter>Footer</IGRPCardFooter>
</IGRPCard>;
```

### Data table

```tsx
import { IGRPDataTable, type ColumnDef } from '@igrp/igrp-framework-react-design-system';

<IGRPDataTable columns={columns} data={data} />;
```

### Checklist, Amount input, Progress cell

```tsx
import {
  IGRPChecklist,
  IGRPInputAmount,
  IGRPProgressTableCell,
} from '@igrp/igrp-framework-react-design-system';

// Checklist: multi-select with ReactNode content per item
<IGRPChecklist
  name="notifications"
  label="Preferences"
  items={[{ value: 'email', content: 'Email' }, { value: 'sms', content: 'SMS' }]}
  onValueChange={(values) => setSelected(values)}
/>

// Amount: formatted currency display (read-only), supports formRef, form context, or controlled
<IGRPInputAmount
  name="total"
  label="Total"
  formatValue={(v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)}
  formRef={formRef}
  fieldName="total"
/>

// Progress cell: progress bar + label for tables/dashboards
<IGRPProgressTableCell value={70} completedTasks={7} totalTasks={10} />
```

See `packages/design-system/docs/use-cases/` for detailed use cases.

### Icons

```tsx
import { IGRPIcon, type IGRPIconName } from '@igrp/igrp-framework-react-design-system';

<IGRPIcon iconName="Check" size={16} />;
```

## Styling in Templates

1. **Tokens**: Import tokens in `globals.css`:

   ```css
   @import '@igrp/igrp-framework-react-design-system/tokens';
   ```

2. **Tailwind source**: Scan design-system dist so Tailwind generates utilities:

   ```css
   @source "../../node_modules/@igrp/igrp-framework-react-design-system/dist/**/*.{js,jsx,ts,tsx,mjs,cjs}";
   ```

3. **Theme overrides**: Use `themes.css` for custom tokens.

4. **Do not** import prebuilt `@igrp/*/styles.css` files; they can conflict.

## Utility Exports

```tsx
import {
  cn,
  igrpGetInitials,
  igrpToPascalCase,
  IGRPColors,
  useIGRPMetaColor,
  useIsMobile,
} from '@igrp/igrp-framework-react-design-system';
```

## When Building New Components

1. Prefer **Horizon** components over Primitives when they fit.
2. Use `IGRPBaseAttributes` for shared props (label, icon, helperText).
3. Use `cn()` for class merging.
4. Use `IGRPIcon` with Lucide icon names.
5. Integrate with `IGRPForm` / `IGRPFormField` for form inputs.
6. Follow existing patterns in `packages/design-system/src/components/horizon/`.
