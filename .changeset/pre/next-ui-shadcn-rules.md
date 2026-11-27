---
"@igrp/framework-next-ui": patch
---

The template chrome follows the shadcn rules:

- Header, sidebar and header-slot loading placeholders use the design-system `Skeleton`. They are now `rounded-md`.
- The app switcher, user menu, breadcrumb overflow menu and collapsed-sidebar folder menu put their items in a `DropdownMenuGroup`.
- Icons in buttons, alerts and breadcrumbs no longer set their own size. The component sizes them. The retry and home icons on the error pages lose the extra `mr-2`, so the gap to the label is now 6 px.
- The retry spinner stops when the user prefers reduced motion.
