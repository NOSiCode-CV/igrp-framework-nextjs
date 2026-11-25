---
"@igrp/framework-next-ui": patch
---

`IGRPNestedProviders` wraps the app in `IGRPTooltipProvider` (delay 0, as before) instead of the primitive `TooltipProvider`. Every `IGRPTooltip` in the app now shares it instead of mounting its own provider.
