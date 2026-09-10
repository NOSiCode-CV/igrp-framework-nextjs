---
"@igrp/framework-next-types": patch
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
"@igrp/template-migrator": patch
---

- Framework packages no longer declare their internal `@igrp/*` siblings as exact-version peer dependencies. They are regular dependencies again, so installing or upgrading a single framework package no longer emits unmet-peer warnings across the whole set.
- `@igrp/framework-next` widens its `zod` peer range from the exact `4.5.0` to `^4.5.0`, so an app on any `4.5.x` (the template ships `4.5.4`) satisfies it.
- `@igrp/template-migrator` ships migration `30-resync-beta166-deps`, which carries a CLI-upgraded app's dependency set forward to the beta.166 framework release — including `zod`, `react-hook-form`, `@tanstack/react-query` and `@types/react-dom`, which no earlier migration had ever pinned.
