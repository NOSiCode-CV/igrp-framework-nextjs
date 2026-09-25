---
'@igrp/igrp-framework-react-design-system': patch
---

Fix field defects in `IGRPCombobox` and the required marker on form-bound
fields.

- **`IGRPCombobox` now becomes touched.** The field is marked touched when its
  popover closes. Before, it never was, so under `validationMode="onTouched"`
  an error set on it never cleared by itself. **Behaviour change:** in
  `onTouched` forms, opening and closing a required combobox without picking
  now shows its required error straight away, as `onTouched` intends.
- **`IGRPCombobox` popover is no longer modal.** Radix's modal mode
  scroll-locked the page and hid the rest of the form from assistive
  technology. In scroll containers it could also close the popover shortly
  after it opened.
- **`IGRPCombobox` `disabled` is real.** It used to be `pointer-events-none`
  styling only, so the trigger could still be opened from the keyboard. It now
  sets `disabled` on the trigger.
- **`errorText` is honoured when form-bound.** `IGRPFormField` accepts
  `errorText`, which replaces the form's own message and is always shown when
  set. `IGRPCombobox` and `IGRPMultiSelect` pass it through.
- **Required asterisk restored** on `IGRPFormField` (every form-bound field),
  `IGRPInputText`, `IGRPInputSearch`, `IGRPSelect` and the date pickers. Their
  labels used `after:content-["*"]`. Babel re-emits that as
  `after:content-[\"*\"]`, and Tailwind scanning `dist/` generated a class with
  the backslashes in its name, so it never matched. They now use
  `after:content-['*']`, and a unit test rejects the double-quoted form.
