---
"@igrp/framework-next": patch
---

- Fix the header's sidebar-toggle button still rendering when `IGRPLayoutFull` is configured with `showSidebar={false}` — the trigger is now hidden whenever there's no sidebar to toggle, instead of only depending on the app's own header config.
