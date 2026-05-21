# Preview mode (`IGRP_PREVIEW_MODE`)

`IGRP_PREVIEW_MODE=true` in `templates/demo-legacy/.env` is the fastest dev loop without auth/backend setup.

`AUTH_PROVIDER=none` is the parallel bypass path. Both are unified behind `isAuthBypass()` in `templates/demo-legacy/src/lib/utils.ts` — every auth-aware code path must use that helper, not check the raw env directly.

**Effect:**
- Bypasses NextAuth session checks in `src/middleware.ts`.
- `/login`, `/logout`, `/api/auth/*` all redirect to `/` — there's no real provider to talk to.
- Swaps in mock data from `src/temp/{users,menus,applications}`.
- Disables session refetch.

**Places that must stay branch-aware:**
- `src/middleware.ts` — preview-mode bypass.
- `src/app/layout.tsx` and `src/app/(igrp)/layout.tsx` — session load.
- `src/igrp.template.config.ts` — `igrpBuildConfig` swaps in mock data.
- `packages/framework/next` — `igrpBuildConfig` itself must honor the flag.

Any change to middleware, root layout, or config builder must work with preview **on** and **off**.
