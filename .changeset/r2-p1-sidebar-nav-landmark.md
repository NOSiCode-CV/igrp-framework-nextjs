---
"@igrp/framework-next-ui": patch
---

Sidebar menus now expose exactly one labeled navigation landmark. Removed the
invalid `role="navigation"` from `SidebarMenu` (a `<ul>`, where it stripped list
semantics and emitted an unlabeled landmark per section) and wrapped
`IGRPTemplateMenus` once in `<nav aria-label>` — overridable via the new
`navAriaLabel` prop (default "Menu principal").
