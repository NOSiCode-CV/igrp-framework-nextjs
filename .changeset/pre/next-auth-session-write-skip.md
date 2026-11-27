---
"@igrp/framework-next-auth": patch
---

Session store: a session read that changed nothing no longer writes to the store (one encryption and one store round trip per page view). The entry is still rewritten once less than half its lifetime is left, so an active session keeps sliding.
