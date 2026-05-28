---
"@igrp/igrp-framework-react-design-system": patch
---

refactor(design-system): peer-dep heavy libs, deprecate /styles export, add COMPONENTS.md + shadcn-drift detector

- Move `react-hook-form`, `zod`, `recharts`, `@tanstack/react-table`, `date-fns`, and `lucide-react` from `dependencies` to `peerDependencies` so consumers can upgrade them independently and avoid duplicate copies. Loosened semver ranges; mirrored as `devDependencies` so the DS still builds standalone.
- Deprecate the `/styles` export. Removed from the dev `exports` map; kept in `publishConfig.exports` for one more beta as a soft-deprecation window. Scheduled for removal in the next beta. Templates must import `/tokens` only and compile Tailwind in the app.
- Add `packages/design-system/COMPONENTS.md` — three-layer (Horizon / Primitive / Custom) reference map with IGRP deltas from upstream shadcn and the experimental-layer promotion criteria.
- Add `pnpm drift:shadcn` — periodic-maintenance script that compares each primitive against upstream shadcn via the CLI `--diff` flow. Not wired into CI.
- demo-legacy template: document that `npx shadcn add` must not be run inside the template (it collides with IGRP primitives).
