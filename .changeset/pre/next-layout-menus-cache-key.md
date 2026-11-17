---
'@igrp/framework-next': patch
---

`igrpGetLayoutMenus` caches per request on `layoutData`, `appCode` and `previewMode` instead of on the config object. A page that builds its own config, or passes a copy, now shares the layout's menu fetch instead of calling `layoutData.getMenus` again.
