---
"@igrp/framework-next-ui": patch
---

The root barrel no longer carries `'use client'`. With it, any server component importing from `@igrp/framework-next-ui` (framework-next's layouts, a template page) registered the entire package as its client reference, so every page shipped every template component. Every leaf module already declared its own directive; `src/__tests__/client-boundaries.test.ts` now guards the barrel and the directive-free modules.
