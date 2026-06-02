---
"@igrp/framework-next-ui": patch
---

Fix sidebar menu active highlighting: submenu items inside FOLDER menus (collapsible and dropdown variants) now reflect the current route via `isActive`. Extract a shared `isItemActive` helper, thread `pathname` through `FolderMenuItem`/`SubLeafLink`, auto-open the collapsible and mark the folder trigger active when a child matches the current path.

Also strengthen the selected-item treatment: the active menu item now renders with a soft brand tint, clearly distinct from the faint `sidebar-accent` hover wash. The treatment is driven by the dedicated `--sidebar-active` / `--sidebar-active-foreground` design-system tokens (so integrators can recolor the highlight from their app CSS) and centralized in a shared `ACTIVE_MENU_ITEM_CLASS` constant using semantic tokens only. Also fixes the active FOLDER trigger losing its highlight on hover — the DS primitive's `data-[state=open]:hover:bg-sidebar-accent` was overriding the active styling; a higher-specificity `data-[active=true]:data-[state=open]:hover:` rule now holds it.
