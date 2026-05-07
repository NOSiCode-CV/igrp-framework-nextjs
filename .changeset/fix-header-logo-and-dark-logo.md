---
"@igrp/framework-next-ui": patch
---

Fix header logo visibility and add dark-mode logo support in auth form.

**Header logo (`IGRPTemplateHeader`):** `showIGRPHeaderLogo` and `showIGRPHeaderTitle` were inside a `!showIGRPSidebarTrigger` branch, making them silently ineffective whenever the sidebar trigger was enabled. They are now independent controls — the logo and title render based on their own flags regardless of whether the sidebar trigger is shown.

**Dark-mode logo (`IGRPAuthForm`):** `IGRPSiteLogo` now accepts an optional `srcDark` field. When provided, the light logo is hidden in dark mode (`dark:hidden`) and the dark logo is shown (`hidden dark:block`), using CSS only — no JavaScript theme detection required, no hydration mismatch.
