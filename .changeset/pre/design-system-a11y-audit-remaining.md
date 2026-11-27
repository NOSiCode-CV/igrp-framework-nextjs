---
'@igrp/igrp-framework-react-design-system': patch
---

Accessibility: the remaining items of the WCAG audit of 2026-11-26.

- **Type change:** `IGRPButton` with an icon size (`icon`, `icon-xs`, `icon-sm`, `icon-lg`) now requires `aria-label` or `aria-labelledby`. TypeScript rejects an icon-only button without a name. The runtime fallback to the icon name stays for JavaScript callers.
- **Type change:** `labelTrigger` is required on the data-table action buttons and dropdown items, because it is their only accessible name.
- `SidebarRail` is reachable by keyboard and shows its line on focus.
- The `Command` search box shows a focus ring.
- `StepperTrigger asChild` gives a non-button child the button role, a tab stop, and Enter/Space, when the stepper can change step.
- Invisible 32px hit areas, with no visual change: the sidebar group and menu actions at every width, and the resizable handle.
- `KbdGroup` renders a `<span>` around its `<kbd>` keys.
