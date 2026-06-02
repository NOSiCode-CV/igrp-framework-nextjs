---
"@igrp/igrp-framework-react-design-system": patch
---

Add dedicated `--sidebar-active` / `--sidebar-active-foreground` tokens (light + dark, registered in `@theme inline`) for the selected sidebar menu item. Defaults to a `color-mix` tint of `--sidebar-primary` so the highlight tracks the active theme, while remaining independently overridable by consumers.
