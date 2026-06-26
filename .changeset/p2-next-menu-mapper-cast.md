---
"@igrp/framework-next": patch
---

`mapperMenus` no longer casts `menu.id as number` — propagates the real
optionality now that `IGRPMenuItemArgs.id` is optional.
