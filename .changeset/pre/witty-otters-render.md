---
'@igrp/template-migrator': patch
---

Ship migration 33 (`33-force-dynamic-root-layout`) for `demo-v1`:

- Re-captures `src/app/layout.tsx` with `export const dynamic = "force-dynamic"`. The root layout resolves the session, so without it Next tries to statically prerender the whole tree at `next build` time and the build fails with `NEXTAUTH_SECRET must be set in production` / `Missing required authentication environment variables`. Container and CI builds no longer need runtime secrets; runtime behaviour is unchanged.
