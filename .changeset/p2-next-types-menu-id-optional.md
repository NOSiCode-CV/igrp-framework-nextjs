---
"@igrp/framework-next-types": patch
---

`IGRPMenuItemArgs.id` is now optional (`id?: number`) to match the runtime
`MenuEntryDTO.id?: number`, removing a type that promised an always-present id.
