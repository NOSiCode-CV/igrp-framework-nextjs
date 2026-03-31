---
name: igrp-calendar-datepicker
description: >-
  Create calendars and date pickers with IGRP Design System using IGRPCalendar*,
  IGRPDatePicker*, IGRPInputTime, IGRPDateTimeInput. Use when the user asks for
  date pickers, calendars, time inputs, or date range selection. Always prefer
  IGRP date/time components when working in templates/demo or with
  @igrp/igrp-framework-react-design-system.
---

# IGRP Calendar & DatePicker Skill

Build date and time inputs with the IGRP Design System.

## Quick Start

```tsx
import {
  IGRPDatePickerSingle,
  IGRPDatePickerRange,
  IGRPDatePickerMultiple,
  IGRPDatePickerInputSingle,
  IGRPInputTime,
  IGRPDateTimeInput,
  IGRPCalendarSingle,
  IGRPCalendarRange,
} from '@igrp/igrp-framework-react-design-system';

// Single date
<IGRPDatePickerSingle name="date" label="Date" />

// Date range
<IGRPDatePickerRange name="range" label="Date Range" />

// Time only
<IGRPInputTime name="time" label="Time" />

// Date + time
<IGRPDateTimeInput name="datetime" label="Date & Time" />
```

## Key Rules

- Use `IGRPDatePickerSingle` for single date
- Use `IGRPDatePickerRange` for range
- Use `IGRPDatePickerInputSingle` for input with inline calendar
- Use `IGRPInputTime` for time-only
- Use `IGRPDateTimeInput` for combined date+time

## References

- [date-picker.md](references/date-picker.md) – Date picker variants
- [calendar.md](references/calendar.md) – Calendar variants
- [time.md](references/time.md) – Time and datetime
