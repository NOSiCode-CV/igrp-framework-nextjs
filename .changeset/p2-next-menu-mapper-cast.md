---
"@igrp/framework-next": patch
---

`mapMenu` no longer casts `menu.id as number` — propagates the real
optionality now that `IGRPMenuItemArgs.id` is optional.
