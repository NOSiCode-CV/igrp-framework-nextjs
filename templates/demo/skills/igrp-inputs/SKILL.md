---
name: igrp-inputs
description: >-
  Create form inputs with IGRP Design System using IGRPInputText, IGRPSelect,
  IGRPCheckbox, IGRPTextarea, IGRPInputNumber, IGRPInputSearch, IGRPInputFile,
  IGRPDatePicker, IGRPRadioGroup, IGRPSwitch, IGRPCombobox, etc. Use when the user
  asks for inputs, text fields, select dropdowns, checkboxes, file uploads,
  date pickers, or any form control. Always prefer IGRP inputs over raw HTML
  when working in templates/demo or with @igrp/igrp-framework-react-design-system.
---

# IGRP Inputs Skill

Build form inputs with the IGRP Design System. All inputs auto-wire to IGRPForm when inside form context.

## Quick Start

```tsx
import {
  IGRPInputText,
  IGRPSelect,
  IGRPCheckbox,
  IGRPTextarea,
  IGRPInputNumber,
  IGRPInputSearch,
  IGRPInputFile,
  IGRPDatePickerSingle,
  IGRPRadioGroup,
  IGRPSwitch,
} from '@igrp/igrp-framework-react-design-system';

// Text
<IGRPInputText name="email" label="Email" type="email" required />

// Select
<IGRPSelect name="role" label="Role" options={[{ label: 'Admin', value: 'admin' }]} />

// Checkbox
<IGRPCheckbox name="agree" label="I agree" />

// Textarea
<IGRPTextarea name="bio" label="Bio" />

// Number
<IGRPInputNumber name="quantity" label="Quantity" />

// Search (with icon)
<IGRPInputSearch name="query" label="Search" />

// File
<IGRPInputFile name="file" label="Upload" />

// Date
<IGRPDatePickerSingle name="date" label="Date" />

// Radio
<IGRPRadioGroup name="type" label="Type" options={[{ label: 'A', value: 'a' }]} />

// Switch
<IGRPSwitch name="enabled" label="Enabled" />
```

## Key Rules

- All IGRP inputs accept `label`, `helperText`, `name`, `required`, `error`
- Use `IGRPOptionsProps` for select/radio/combobox: `{ label, value, color?, status?, icon?, group? }`
- Inputs auto-detect IGRPForm context and wire themselves
- Use `showIcon`, `iconName`, `iconPlacement` for icon-prefixed inputs

## References

- [input-text.md](references/input-text.md) – IGRPInputText
- [select.md](references/select.md) – IGRPSelect
- [checkbox.md](references/checkbox.md) – IGRPCheckbox
- [textarea.md](references/textarea.md) – IGRPTextarea
- [number.md](references/number.md) – IGRPInputNumber
- [date-picker.md](references/date-picker.md) – Date picker variants
- [combobox.md](references/combobox.md) – IGRPCombobox
