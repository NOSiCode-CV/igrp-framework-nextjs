---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPForm`: `children` can be a function of the form instance (`(form) => …`), which re-renders on `form.watch(...)`. New props `reValidationMode` (passed to react-hook-form as `reValidateMode`) and `showInlineError` (default `true`; `false` drops the submission error banner). A thrown `onSubmit` is no longer logged to the console when `onError` is set. `formRef` is documented as imperative-only.

`IGRPInputText`: `type` also accepts `"url"`, `"tel"` and `"search"`.

`IGRPFormField`: `control` is optional and falls back to the surrounding form context. It now accepts a typed `Control<MyValues>` without a cast.
