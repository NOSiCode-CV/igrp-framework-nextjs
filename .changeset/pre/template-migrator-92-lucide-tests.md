---
'@igrp/template-migrator': patch
---

Migration 92: `next.config.ts`'s dev icon map works with lucide-react 1.x, and the template gains Vitest with tests for the middleware and session args with the auth bypass on and off, plus `sanitizeCallbackUrl`. Adding the `test` script, and turning off Biome's formatter for `.md`/`.yml` so `pnpm lint` stops rewriting the docs, are manual steps.
