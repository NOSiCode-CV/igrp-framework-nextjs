---
"@igrp/igrp-framework-react-design-system": patch
---

- `IGRPRichTextEditor` is focused when an invalid submit lands on it, and is read-only inside a disabled `IGRPForm` or a `useForm({ disabled })` form. It used to stay editable there.
- `IGRPInputHidden` keeps a caller's `ref`, `onChange` and `onBlur` next to the form binding instead of replacing them.
- The date pickers render the `error` prop (in a form and standalone) and hide `helperText` while it shows. They accepted it before but never displayed it.
- `IGRPFormList` binds to any react-hook-form `FormProvider`, like the other fields, instead of only `IGRPForm`.
