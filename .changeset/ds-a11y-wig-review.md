---
"@igrp/igrp-framework-react-design-system": patch
---

Web Interface Guidelines a11y pass: fix dead expander button and inverted theme-color constants; default `aria-hidden` on `IGRPIcon` and enforce an accessible name on icon-only `IGRPButton`; standardize input `aria-describedby`/label wiring and password hardening; add live regions to alert/notification/chat/form; scope `transition-all` and add reduced-motion guards; correct invalid ARIA on stepper/menu-navigation; locale-aware date formatting via `Intl.DateTimeFormat`. Note: `IGRPDataTableCellDate` props change from `dateFormat` to `language`/`dateOptions`.
