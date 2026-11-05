---
"@igrp/template-migrator": patch
---

Build `dist/cli.js` and `dist/index.js` again instead of `.mjs`, so the `igrp-migrate` bin in `package.json` exists and `igrp migrate` / `pnpm dlx` can run it.
