# shadcn drift baseline — 2026-05

First end-to-end attempt of `pnpm drift:shadcn` against the live shadcn registry, on 2026-05-28. **No actionable baseline established this cycle** — the run revealed structural defects in the detector that produce systemic false negatives. Recording the findings here so the next cycle has somewhere to start.

## What happened

The script reported **0/55 primitives drifted** with exit code 0. Cross-checking against `packages/design-system/COMPONENTS.md` "IGRP-specific deltas from upstream shadcn", we know at least five primitives (Button, Accordion, Form, Popover, RadioGroup) carry documented divergences from upstream. The script should have flagged at least those — it didn't. Result is not trustworthy.

## Root cause

Two interacting defects:

1. **Non-interactive `shadcn init` blocks on a prompt.** The script's `main()` runs `npx shadcn@latest init --yes --defaults --base radix` in a freshly-`mkdtemp`'d scratch directory with `stdio: ["ignore", "pipe", "pipe"]`. On a fresh empty dir the CLI still prompts `What is your project named?` regardless of `--yes --defaults`. With stdin set to `"ignore"`, the prompt reads EOF, the CLI either errors or produces nothing, and **no `components.json` is created in the scratch dir**.
2. **`hasDrift` swallows CLI failure as "ok".** The current check is `hasDrift = code === 0 && stdout.includes("---")`. Every subsequent `npx shadcn add <name> --dry-run --diff --base radix` call fails (the scratch dir isn't a shadcn project), returns non-zero, and the `code === 0` clause turns the failure into a silent `ok`. The script can't distinguish "no drift" from "comparison impossible".

A third concern, found and fixed in this cycle (see below), was a Windows-specific `spawn("npx", ...)` `ENOENT` because `npx` is a `.cmd` shim that `child_process.spawn` won't resolve without `shell: true`.

## Fixes landed this cycle (incidental — not the baseline work)

- `shell: process.platform === "win32"` added to the `run()` spawn options in [check-shadcn-drift.mjs](check-shadcn-drift.mjs). Fixes the Windows `ENOENT`. Necessary but not sufficient.
- Removed the `#!/usr/bin/env node` shebang from [check-shadcn-drift.mjs](check-shadcn-drift.mjs). Vitest 4.1.x's parser was choking on the shebang when the module was imported by the unit tests (`SyntaxError: Invalid or unexpected token` with no location info). Removing it restored `pnpm test` to 51/51 green. The script is still runnable via `pnpm drift:shadcn` (which invokes `node scripts/check-shadcn-drift.mjs`).

## What the next cycle must do

Before the next `pnpm drift:shadcn` run will produce a usable baseline, the script needs two changes (out of scope for this close-out — flagged for a follow-up plan):

1. **Stop relying on `shadcn init`.** Either:
   - Write `components.json` directly into the scratch dir from a known-good template, OR
   - Run `shadcn init` against a non-empty dir that already has `package.json` with `name`/`version` filled in, OR
   - Use a checked-in scratch fixture under `scripts/fixtures/shadcn-scratch/` and `cp` it into the temp dir each run.
2. **Treat non-zero exit codes as `unknown`, not `ok`.** Change `hasDrift = code === 0 && stdout.includes("---")` to surface three states: `drifted` (code 0, diff present), `clean` (code 0, no diff), `unable-to-compare` (non-zero exit). The summary should report all three counts. A primitive in `unable-to-compare` must NOT be silently dropped.

Once both fixes are in, re-run, and write `drift-baseline-2026-06.md` (or whatever month) as the real first baseline.

## Per-primitive disposition for this cycle

None. No re-stamping, no absorbing, no deferring. Stamps on `src/components/primitives/*.tsx` are untouched. The next real baseline supersedes this report entirely.

## Next run

The next `pnpm drift:shadcn` invocation, **after** the script is hardened per "What the next cycle must do" above, will produce the first trustworthy baseline. Until then, treat the script's reports as advisory and verify any "no drift" claims by hand against [COMPONENTS.md](../COMPONENTS.md) "IGRP-specific deltas".
