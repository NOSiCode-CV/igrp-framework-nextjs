---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPInputFile` dropzone with a single file keeps the file already picked when a later drop is fully rejected.
`IGRPInputFile` default variant clears the file name it shows when the form value is emptied, for example by `form.reset()`.
`IGRPInputNumber` with `formatOptions` saves the value rounded the way it shows it (fraction or significant digits, `roundingMode`, `roundingIncrement`), so "10,01 €" no longer saves 10.005. Compact, scientific and engineering notation keep the typed value.
`IGRPInputNumber` writes `null` when the typed text is not a number, so the form no longer submits the previous value.
`IGRPLookupField` clears the `valueName` field when the user types in the input, so a typed text is no longer saved with the id of an earlier pick.
`IGRPInputSearch` outside a form runs the caller's `onChange` and `onKeyDown` after its own instead of replacing them.
`IGRPInputUrl` submits the full URL to a native form through a hidden input; the visible input no longer has `name` or `type="url"`.
