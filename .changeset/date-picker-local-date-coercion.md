---
"@igrp/igrp-framework-react-design-system": patch
---

fix(date-picker): render date-only ISO form values on the correct day west of Greenwich

The date pickers declare their value as `Date | undefined`, but react-hook-form hands over
whatever the API put in the form — typically a date-only ISO string such as `"2026-08-26"`.
ECMAScript reads a date-only string as UTC midnight, so date-fns formatted it as the
previous day in any UTC-N zone: `Atlantic/Cape_Verde` showed `26-08-2026` as `25-08-2026`.
The calendar received the same value and highlighted the wrong day, so clicking the
highlighted day wrote that wrong date back to the form.

All four components were affected — `IGRPDatePickerSingle`, `IGRPDatePickerInputSingle`,
`IGRPDatePickerRange` and `IGRPDatePickerMultiple`. Each now coerces the form value at the
`field.value` boundary via the new `toLocalDate` / `toLocalDateRange` / `toLocalDates`
helpers in `calendar-utils`. Strings that carry a time denote an instant and are passed
through unshifted; `Date` values are untouched.

Regression tests are pinned to a UTC-N zone, since these assertions pass in UTC and east of
Greenwich with or without the fix.
