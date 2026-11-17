---
'@igrp/igrp-framework-react-design-system': patch
---

Form controls are now announced correctly by screen readers.

- `IGRPCombobox` is named by its label, standalone and inside a form. Its error, helper text and required state reach the trigger button. With `variant="multiple"` the chips sit below the trigger, and each remove button is labelled "Remover {label}".
- Date pickers (single, range, multiple) read the label and the selected date together. Standalone pickers link the label when only `id` is given. In a form, range and multiple pickers get the field's id, error and description on the trigger, and the calendar no longer reuses the trigger's id.
- The `IGRPInputFile` dropzone is a named button, the label points at the file input, and the error is announced.
- Caller errors (`errorText` on `IGRPFormField`, `error` on `IGRPInputText`, `IGRPSelect` and `IGRPInputSearch`) now set `aria-invalid` and are referenced by `aria-describedby`. `FormControl` only references a description or message that is actually rendered. `FormMessage` takes an optional `message` that overrides the form's own error.
- `required` sets `aria-required` on select, combobox, multi-select, color, phone, number, every date picker, and standalone checkbox and switch.
- Helper and error text in number, select and search inputs have ids that the control references.
