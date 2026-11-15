---
"@igrp/template-migrator": patch
---

Migration 86: the demo-v1 middleware no longer treats `/api/*` paths ending in an asset extension (`.pdf`, `.json`, `.txt`, `.xml`, …) as public, so they go through the token check. The `/api/csp-report` route logs report bodies as quoted JSON so they cannot forge log lines.
