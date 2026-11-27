---
"@igrp/igrp-framework-react-design-system": patch
---

Fixes from the 2026-11-25 audit:

- `IGRPInputSearch`: Enter and the submit button cancel a pending debounced search, so `onSearch` runs once. A pending search is dropped when the field no longer holds its value (a form `reset()`), so stale results do not come back.
- `IGRPDateTimeInput`: formats what is typed when the form value is `null`.
- Area chart: with `expanded`, the value axis shows percentages instead of 0–1.
