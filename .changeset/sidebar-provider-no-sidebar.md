---
"@igrp/framework-next-ui": patch
---

fix: header fails to load when showSidebar is false in IGRPLayoutFull

`IGRPTemplateNavUser` calls `useIGRPSidebar()` unconditionally, which throws when
no `SidebarProvider` is present. `IGRPRootProvidersFull` now always wraps with
`SidebarProvider` regardless of whether the sidebar slot is provided, so the header
renders correctly when `showSidebar={false}`.
