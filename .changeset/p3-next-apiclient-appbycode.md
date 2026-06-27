---
"@igrp/framework-next": patch
---

`igrpGetAccessClient` now requires a non-empty token (not just baseUrl),
throwing the clear "not configured" error instead of issuing `Authorization:
Bearer ` (empty). `fetchAppByCode` selects the exact `code` match from the
list response instead of blindly taking `[0]`.
