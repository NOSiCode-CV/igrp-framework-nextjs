# Design system maintenance scripts

## `check-shadcn-drift.mjs`

Periodic (~quarterly) check that compares each primitive under
`src/components/primitives/` against the upstream shadcn registry,
using the shadcn CLI's `--diff` mode in a scratch directory.

**Run:** `pnpm drift:shadcn` (from `packages/design-system/`).

**What it does:**

- Reads the `// shadcn: YYYY-MM-DD` stamp at the top of each primitive.
- Runs `npx shadcn@latest add <name> --dry-run --diff` in a temp dir.
- Reports primitives that have drifted from upstream.

**What to do with drift:**

- If the upstream change is a bugfix → update the local primitive, bump the stamp date, add a changeset.
- If the local divergence is intentional → add an entry to the "IGRP deltas" section of `../COMPONENTS.md` and bump the stamp date so the next run treats it as the new baseline.

This script is slow (hits the network, runs the shadcn CLI per file) and is **not** wired into CI. Run it manually before scheduled refreshes.
