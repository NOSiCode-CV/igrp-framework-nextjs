---
"@igrp/template-migrator": patch
---

Add migration `13-resync-beta145`: re-capture `src/lib/dal.ts` (import-order realignment after the Biome sort) and bump the `@igrp/*` dependency pins to the `framework@0.1.0-beta.145` set (`framework-next@0.1.0-beta.145`, `framework-next-ui@0.1.0-beta.144`, `igrp-framework-react-design-system@0.1.0-beta.135`). Clears the `check:drift` gate.
