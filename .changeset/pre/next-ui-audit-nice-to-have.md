---
"@igrp/framework-next-ui": patch
---

Fixes from the 2026-11-25 audit:

- A menu `url` that starts with `/\` or `\` is now an external link. Browsers read it as `//host`, so it left the app while it rendered as an internal link.
- Menu items on the same route that differ only by query string (`/list?status=open`, `/list?status=closed`) now each highlight on their own. `IGRPTemplateMenus` reads `useSearchParams()`, so a static route that renders it outside `IGRPLayoutSidebar` needs a `<Suspense>` boundary.
- Ctrl+K / Cmd+K opens the command palette with Caps Lock on.
