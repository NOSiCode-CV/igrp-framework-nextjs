# IGRPSelect API Reference

## Import

```tsx
import { IGRPSelect, type IGRPSelectProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPSelectProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | Yes (form) | Field name |
| `options` | `IGRPOptionsProps[]` | Yes | `{ label, value, color?, status?, icon?, group? }` |
| `label` | `string` | No | Field label |
| `placeholder` | `string` | No | Placeholder when empty |
| `value` | `string` | No | Controlled value |
| `defaultValue` | `string` | No | Uncontrolled default |
| `onValueChange` | `(value: string) => void` | No | Change handler (standalone) |
| `showSearch` | `boolean` | No | Enable search/filter |
| `showStatus` | `boolean` | No | Show status color |
| `showGroup` | `boolean` | No | Group options by `group` |
| `required` | `boolean` | No | Required indicator |
| `error` | `string` | No | Validation error |

## IGRPOptionsProps

```ts
{ label: string; value: string; color?: string; status?: IGRPColorVariants; icon?: string; group?: string; description?: string; image?: string; flag?: string }
```

## Example

```tsx
<IGRPSelect
  name="status"
  label="Status"
  options={[
    { label: 'Active', value: 'active', status: 'success' },
    { label: 'Inactive', value: 'inactive', status: 'secondary' },
  ]}
  placeholder="Select status"
  showSearch
/>
```
