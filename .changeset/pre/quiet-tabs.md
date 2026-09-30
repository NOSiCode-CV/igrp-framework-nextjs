---
"@igrp/framework-next-auth": patch
"@igrp/igrp-framework-react-design-system": patch
---

- next-auth: fix the post-login redirect dropping the app's `basePath` under basePath deployments (relative callback URLs are no longer double-prefixed; same-origin absolute URLs outside the basePath now go to the app home).
- design-system: fix `IGRPTabs` / `Tabs` — the selected tab is now styled in every variant, the `underline` indicator is visible, `pills` uses the correct foreground colour, and vertical tabs report the right orientation.
- design-system: tabs scroll arrows no longer mount/unmount while scrolling, reduced motion is respected, and `IGRPTabItem` gains `ariaLabel` and `keepMounted` while its `className` is now applied.
