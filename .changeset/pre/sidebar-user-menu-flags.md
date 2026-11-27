---
"@igrp/framework-next-types": patch
"@igrp/framework-next-ui": patch
---

The sidebar user menu can hide its Profile and Settings entries. `IGRPSidebarDataArgs` gets `showProfile` and `showSettings` (default `true`); `IGRPSidebarUser` and `IGRPTemplateNavUser` take the same props, and a prop wins over the data.
