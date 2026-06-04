---
'@igrp/template-migrator': patch
---

Add migration `12-template-resync` and a `check:drift` release gate.

- **New migration `12-template-resync`** re-captures 13 `templates/demo-legacy` files that had been edited directly without an accompanying migration (so the changes had shipped only to apps scaffolded from the zip, never to apps upgraded via `igrp-migrate`): the layout server action, the `lib/config/*` helpers, `lib/auth.ts`, `lib/dal.ts`, `lib/report-error.ts`, the NextAuth route handler, the three `error.tsx` boundaries, the logout page, and `.env.example`. It also deletes the stale `src/app/[...not-found]/page.tsx` catch-all route, bumps the `@igrp/*` deps to the `framework-next@0.1.0-beta.144` set, and aligns the React/Next runtime (`next ^15.5.18`, `react`/`react-dom 19.2.6`) which had advanced in the template since migration 04 without an intervening migration.
- **New `check:drift` script** (`scripts/check-drift.ts`) reconciles both the payload tree and the dependency pins against the live template, and fails if a managed file changed without a migration, a migration ships a file the template removed, a payload is missing, or a bumped dependency drifted from the template's current (workspace-resolved) version. It runs automatically at the start of the `release` script, preventing this drift from recurring.
