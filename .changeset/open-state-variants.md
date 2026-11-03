---
"@igrp/igrp-framework-react-design-system": patch
---

Fix accordion and `IGRPFormList` rows clipping content that appears after the row opens (upload results, validation messages, conditional fields). The content body no longer keeps the height measured on open. Consumers can drop the `[&_[data-slot=accordion-content]>div]:h-auto` workaround.

Restore open/close animations on Radix-based primitives. `tokens.css` now maps the `data-open:` / `data-closed:` variants to Radix's `data-state="open" | "closed"` (ADR 0006), so dialog, sheet, drawer, popover, hover-card, select, menu and accordion animations and the open-trigger highlights apply again. Requires the app to import `/tokens`.
