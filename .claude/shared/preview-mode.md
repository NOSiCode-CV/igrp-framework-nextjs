# Preview mode (`IGRP_PREVIEW_MODE`)

`IGRP_PREVIEW_MODE=true` in `templates/demo-v1/.env` is the fastest dev loop without auth/backend setup.

`AUTH_PROVIDER=none` is the parallel bypass path. Both are unified behind `isAuthBypass()` in `templates/demo-v1/src/lib/utilities.ts` — every auth-aware code path must use that helper, not check the raw env directly.

**Effect:**
- Bypasses NextAuth session checks in `src/middleware.ts`.
- `/login`, `/logout`, `/api/auth/*` all redirect to `/` — there's no real provider to talk to.
- Swaps in mock data from `src/temp/{users,menus,applications}` (in `src/igrp.template.config.ts`, through `layoutData`).
- Disables session refetch (`src/lib/config/get-session-args.ts`).

**Places that must stay branch-aware:**
- `src/middleware.ts` — preview-mode bypass.
- `src/app/layout.tsx` and `src/app/(igrp)/layout.tsx` — session load.
- `src/igrp.template.config.ts` — passes `previewMode: isAuthBypass()` and swaps in mock data.
- `src/lib/config/get-session-args.ts` — refetch off under bypass.
- `packages/framework/next` — consumes `config.previewMode` (skips Access Management calls, relaxes `igrpBuildConfig` validation). `igrpBuildConfig` reads no env and swaps no data; keep it that way. The package's `isIgrpAuthBypass()` mirrors `isAuthBypass()` for permission checks that run without a config.

Any change to middleware, root layout, or config builder must work with preview **on** and **off**.
