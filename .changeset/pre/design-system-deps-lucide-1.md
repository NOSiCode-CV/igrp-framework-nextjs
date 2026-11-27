---
"@igrp/igrp-framework-react-design-system": patch
---

- Upgrade `react-day-picker` to 10.0.2. v10 removes the props v9 had deprecated, so an app that passes `fromDate`, `toDate`, `fromMonth`, `toMonth` or `initialFocus` to `IGRPCalendar` must move to `hidden={{ before, after }}`, `startMonth`/`endMonth` and `autoFocus`.
- Upgrade `@hookform/resolvers` to 7.0.9. `zodResolver` has the same import and signature.
- `IGRP_ICON_NAMES` follows lucide-react 1.79: 476 icons added, and 57 renamed ones listed under their new names (`Trash2` → `Trash`, `CircleAlert` → `CircleExclamationPoint`, `TriangleAlert` → `TriangleExclamationPoint`, …). `IGRPIcon` still renders the old names, so menus stored with them keep working; icon pickers now offer only the new ones.
