---
"@igrp/framework-next-i18n": patch
---

The build writes `dist/cli.js` and `dist/index.js` again, the files `bin`, `main` and `exports` point at. Since the switch to tsdown it wrote `.mjs`, so the `igrp-i18n` command, the template's `lint:i18n` (and with it `build`), and the root `lint:i18n:framework` failed with "Cannot find module".
