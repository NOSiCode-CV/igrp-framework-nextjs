---
"@igrp/igrp-framework-react-design-system": patch
"@igrp/framework-next-ui": patch
"@igrp/template-migrator": patch
---

- The design system now requires `zod` `^4.5.0` instead of `^4.4.0`, matching the range `@igrp/framework-next` already declares. Apps on zod `4.4.x` must upgrade to `4.5.x`.
- `@igrp/framework-next-ui` pins `react`, `react-dom` and `next-auth` as devDependencies so it builds and typechecks against the same versions every other framework package uses, instead of whatever the workspace happened to hoist.
- `@igrp/template-migrator` gains a typecheck config for its `scripts/` folder; no change to the published CLI or migration set.
