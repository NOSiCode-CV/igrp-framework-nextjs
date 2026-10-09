---
"@igrp/template-migrator": patch
---

- Migration 53: `/` home redirect moves to a `next.config.ts` redirect; `getAuthenticatedUser()` no longer returns the access token; the `logout_pending` cookie name carries the basePath suffix; `logo.srcDark` dropped.
- Migration 54: the home page shows what each layer did for the current request (new `home-overview.tsx`).
- Migration 55: ships the basePath-scoped stale auth-cookie sweep in `middleware.ts`, moves `AppSearch` to `src/components/app-search.tsx`, and pins the framework release.
