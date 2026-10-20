---
"@igrp/igrp-framework-react-design-system": patch
---

Horizon inputs inside a react-hook-form no longer let caller props break the form binding.

- A caller `onChange` or `onBlur` now runs after the field's own handler instead of replacing it. Before, `<IGRPInputText onChange={…} />` or `<IGRPTextarea onChange={…} />` disconnected the input from the form: it showed the keystroke, the form never received it, and the value snapped back. A caller `onBlur` did the same to touched state and `mode: "onBlur"` validation in text, textarea, password, time, url, search, phone, file, checkbox and switch. `IGRPInputNumber` ignored a caller `onFocus` / `onBlur` altogether and never marked the field touched. It now does both.
- A caller `value` / `defaultValue` (text, textarea) or `checked` / `defaultChecked` (checkbox, switch) no longer overrides the form's value. Inside a form, the form is the source of truth.
- Every form-bound input now hands `field.ref` to a focusable element, merged with any caller `ref`, so `shouldFocusError` focuses the first invalid field on submit. Before, only `IGRPInputHidden` did. Radio groups focus the checked radio, or the first enabled one.
- `IGRPSelect` and the date pickers mark the field touched when their dropdown closes, as `IGRPCombobox` and `IGRPMultiSelect` already did. A caller `onOpenChange` on `IGRPSelect` no longer replaces its internal open state.
- `IGRPDatePickerMultiple` opens again. Its trigger dropped the props `PopoverTrigger` passes it, so clicking it did nothing.
