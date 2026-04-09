# IGRP Date Picker API Reference

## Import

```tsx
import {
  IGRPDatePickerSingle,
  IGRPDatePickerRange,
  IGRPDatePickerMultiple,
  IGRPDatePickerInputSingle,
} from '@igrp/igrp-framework-react-design-system';
```

## Variants

| Component | Purpose |
|-----------|---------|
| `IGRPDatePickerSingle` | Single date picker |
| `IGRPDatePickerRange` | Date range picker |
| `IGRPDatePickerMultiple` | Multiple dates |
| `IGRPDatePickerInputSingle` | Input with inline calendar |

## Common Props

`label`, `required`, `placeholder`, `dateFormat`, `disabledPicker`, `disableBefore`, `disableAfter`, `name`.

## Example

```tsx
<IGRPDatePickerSingle name="birthDate" label="Birth Date" required />
<IGRPDatePickerRange name="range" label="Date Range" />
```
