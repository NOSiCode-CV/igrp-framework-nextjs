---
'@igrp/template-migrator': patch
---

Add migration 35, and repair the drift gate's own file paths.

**Migration 35 — `35-framework-owned-redirect-and-refetch-ceiling`**

- Replaces `src/lib/auth.ts` to drop the template's local `callbacks.redirect` override. The framework default in `@igrp/framework-next-auth` now resolves post-auth destinations against the app base URL (and never against `NEXTAUTH_URL_INTERNAL`), which is exactly what the override existed to work around. `deriveAppBaseUrl()` and `AUTH_UI_PATH` go with it.
- Replaces `.env.example` and retunes `IGRP_SESSION_REFETCH_INTERVAL` from `120` to `45` in `.env`. The framework's proactive-refresh buffer is 60s, so any poll interval at or above it can never land inside the refresh window — the only refreshes that run happen in read-only RSC context and cannot persist the rotated cookie, which surfaces as a random bounce to `/login`. `withIGRPAuth` now warns about this in development.
- The retune is `env.remove` + `env.add`, because `env.add` deliberately never overwrites a key an app already has.

**Drift gate paths**

`scripts/check-drift.ts` and `scripts/sync-template-lock.ts` resolved the repo root as `<pkg>/../..`, which stopped being correct when the package moved under `packages/framework/`. `check:drift` exited 1 with "Template directory not found" on every run — so the gate that is supposed to block a release with an uncaptured template change was itself passing nothing, and `sync:template-lock` wrote to a path outside the repo. Both now use `../../..`, along with `PACKAGES_DIR` (which made the dependency-pin check silently compare against an empty workspace map).
