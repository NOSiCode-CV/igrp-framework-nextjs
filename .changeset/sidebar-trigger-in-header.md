---
"@igrp/framework-next-ui": patch
---

- Move the sidebar collapse/expand `SidebarTrigger` out of the sidebar header and into the app header (`IGRPTemplateHeader`), gated by `showIGRPSidebarTrigger`, following the shadcn dashboard layout. The header trigger is aligned with `-ml-1`. The sidebar keeps `collapsible="icon"`, so the trigger toggles between the expanded panel and the icon rail; `SidebarRail` still re-expands from the collapsed state.
