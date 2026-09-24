---
'@igrp/template-migrator': patch
---

Ship migration `45-dev-basepath-url`: adds `scripts/dev.mjs`, a `next dev` wrapper that prints the app URL including `NEXT_PUBLIC_BASE_PATH` under Next's `Local:` line. Point the app's `dev` script at it by hand (`"dev": "node scripts/dev.mjs"`); `package.json` isn't migration-managed.
