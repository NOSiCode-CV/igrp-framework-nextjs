---
"@igrp/igrp-framework-react-design-system": patch
---

Inactive sidebar items no longer render with the active background. The `data-active` variant in `tokens.css` matched `data-active="false"`, so every `SidebarMenuButton` and `SidebarMenuSubButton` looked selected.
