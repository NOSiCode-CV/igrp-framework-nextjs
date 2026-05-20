---
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
---

Add `showSidebar` prop to `IGRPLayoutFull` to render header-only chrome without a sidebar.

`IGRPRootProvidersFull` now accepts `sidebar` as optional — when absent, skips `SidebarProvider`/`SidebarInset` and renders a plain flex-column layout instead, avoiding sidebar CSS offsets.
