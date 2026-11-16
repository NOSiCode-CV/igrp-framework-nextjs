---
'@igrp/igrp-framework-react-design-system': patch
---

lucide-react 1.x is supported: the peer range is `^0.577.0 || ^1.0.0`.

- `IGRPIcon` reads both icon-module shapes (0.x `__iconNode`, 1.x `__iconData`). Before, every lazily loaded icon rendered empty on 1.x.
- `IGRPIconObject` leaves out the 18 brand icons lucide 1.x removed (`Github`, `Facebook`, `Slack`, …), so a picker never offers a name that renders the unknown-icon glyph. They still render by name on 0.x.
- `IGRPDataTableCellDate` with the deprecated `dateFormat` now formats timestamps in the `IGRPI18nProvider` time zone (or `dateOptions.timeZone`), as the `Intl` path already did, instead of the runtime zone. Adds `@date-fns/tz`.
