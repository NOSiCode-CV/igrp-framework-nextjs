# IGRPButton

## Description

Primary button component with optional icon, loading state, and IGRP conventions.

## Props

| Prop | Type | Values | Default |
|------|------|--------|---------|
| variant | enum | default, destructive, outline, secondary, ghost, link | default |
| size | enum | default, xs, sm, lg, icon, icon-sm, icon-lg | default |
| loading | boolean | - | false |
| showIcon | boolean | - | false |
| iconName | string | Lucide icon name | ArrowLeft |
| iconPlacement | enum | start, end | start |

## Example

```tsx
<IGRPButton variant="default" size="md">Save</IGRPButton>
<IGRPButton variant="outline" size="sm">Cancel</IGRPButton>
<IGRPButton variant="destructive" loading>Delete</IGRPButton>
```

## Structured

```yaml
component: IGRPButton
props:
  variant:
    type: enum
    values: [default, destructive, outline, secondary, ghost, link]
  size:
    type: enum
    values: [default, xs, sm, lg, icon, icon-sm, icon-lg]
```
