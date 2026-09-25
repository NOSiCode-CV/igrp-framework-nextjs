---
"@igrp/igrp-framework-react-design-system": patch
---

Fix typing, clearing and format handling in the single date pickers.

**`IGRPDatePickerInputSingle`**

- **Editing an existing date wiped the field.** Every keystroke was pushed into the form and read back, so the first backspace on `26-08-2026` parsed as invalid, wrote `undefined`, and the sync effect blanked the input. Typing is now held in a local draft and only committed when it parses; a half-typed date no longer touches the form value, and blurring an unfinished edit restores the committed date.
- **The calendar became unreachable once a date was picked.** The popover trigger was rendered only while the field was empty, leaving `PopoverTrigger asChild` with no child, the popover with no anchor, and no way back into the calendar but an undiscoverable ArrowDown. The calendar button is now always rendered, alongside the clear button.
- **Typing only worked for one exact spelling.** Input is masked to `dateFormat` as it is typed: `26082026` and `1-8-2026` both become `26-08-2026` / `01-08-2026`. Parsing tolerates the widths people actually type while still rejecting half-typed input and impossible days.
- `onDateChange` fired **twice per keystroke** — both the handler and the callback it was given invoked it. It now fires once per committed change.
- The input gained `autoComplete="off"`, `inputMode="numeric"` and `maxLength`, so browser form-history suggestions no longer shadow the calendar with text that cannot match the format.
- `aria-invalid` / `aria-describedby` now land on the `input` itself rather than the wrapper, the calendar no longer duplicates the input's DOM id, and the calendar button's accessible name comes from the i18n catalog instead of a hardcoded string.

**`IGRPDatePickerSingle`**

- **Clearing emptied the value but kept displaying the old date.** Clearing wrote `undefined`, which react-hook-form reads as "no value set" — `useWatch` then hands back the field's *default*, so the picker immediately re-rendered the date it had just dropped. Cleared fields now write `null`.
- The popover stays open after picking a date — fixed; it now closes on select, matching `IGRPDatePickerInputSingle`.
- The default placeholder is the pt-PT `datePicker.placeholder` string instead of the hardcoded English `"Pick a date"`, the clear button honours `disabled` as well as `disabledPicker`, and `z-100` (not a generated Tailwind utility) is now `z-[100]`.

**`IGRPCalendarSingle`**

- `date ?? ownDate` could not express a cleared selection: once an internal selection existed, a parent passing `date={undefined}` could never deselect the day. Controlled mode is now decided by whether `date` was passed, not by whether it is defined. The same conflation is fixed in both single date pickers.

**Utilities**

- `formatDateToString` uses `format` instead of `lightFormat`, which understood only numeric tokens and silently rendered the rest as digits — `dd MMM yyyy` came out as `26 08 2026` while the matching `parse` read it as a month name, so the two single pickers disagreed on the same `dateFormat`.
- `formatDateRange` formatted `range.from` twice, so every range rendered its start date on both sides.
- `parseStringToDate` / `parseStringToRange` no longer reject on an exact-length check; they delegate to the new tolerant `parseDateInput`.
- New exports: `parseDateInput`, `maskDateInput`, `getDateFormatParts`, `getDateFormatMaxLength`.

Note for consumers: a cleared date picker now writes `null` into react-hook-form rather than `undefined`. Schemas that accept only `Date | undefined` (e.g. `z.date().optional()`) should accept `null` as well — `z.date().nullish()`.
