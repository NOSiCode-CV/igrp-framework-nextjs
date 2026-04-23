# Preview mode (`IGRP_PREVIEW_MODE`)

`IGRP_PREVIEW_MODE=true` in `templates/demo/.env` is the fastest dev loop without auth/backend setup.

**Effect:**
- Bypasses NextAuth session checks in `src/middleware.ts`.
- Swaps in mock data from `src/temp/{users,menus,applications}`.
- Disables session refetch.

**Places that must stay branch-aware:**
- `src/middleware.ts` — preview-mode bypass.
- `src/app/layout.tsx` and `src/app/(igrp)/layout.tsx` — session load.
- `src/igrp.template.config.ts` — `igrpBuildConfig` swaps in mock data.
- `packages/framework/next` — `igrpBuildConfig` itself must honor the flag.

Any change to middleware, root layout, or config builder must work with preview **on** and **off**.
