---
"@igrp/framework-next": patch
---

Access Management sync now accepts `IGRP_APP_CODE` in any case and normalizes it to uppercase (the AM canonical form) before validation, matching the documented case-insensitive contract. Previously, lowercase app codes were rejected with `IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING`.
