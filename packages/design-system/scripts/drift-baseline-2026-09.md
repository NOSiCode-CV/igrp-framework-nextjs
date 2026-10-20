# shadcn drift baseline — 2026-09

First **trustworthy** baseline, established 2026-09-15. Supersedes
[drift-baseline-2026-05.md](drift-baseline-2026-05.md), which recorded a run
whose result was not usable.

## Detector rewritten

The 2026-05 report identified two defects. Re-testing against `shadcn@4.21.0`
found two more, one of which invalidated that report's own remediation plan:

1. **`add --base` does not exist.** `-b, --base` is an `init` option only.
   `npx shadcn@latest add button --dry-run --diff --base radix` fails immediately
   with `error: unknown option '--base'`. Every one of the 56 per-file calls died
   before reaching the network. (New — not known in 2026-05.)
2. **`init` prompts and exits 0 creating nothing.** Still reproducible on 4.21.0:
   `? What is your project named?` on a fresh empty dir despite `--yes --defaults`.
   With stdin closed the prompt reads EOF and the CLI exits **0** with an empty
   scratch directory — so even checking the init exit code would not have caught it.
3. **`hasDrift` failed open.** `code === 0 && stdout.includes("---")` turned every
   failure above into a silent `ok`.
4. **The local primitive was never where the CLI would diff it.** `checkOne` read
   `src/components/primitives/<name>.tsx` only to grep its stamp; the scratch
   project never received the file. `shadcn add --diff` diffs the registry against
   its _own_ cwd, so even with 1–3 fixed the run compared upstream against a fresh
   upstream install — structurally always clean. (New — this is why the 2026-05
   remediation plan would still have produced a broken checker.)

The CLI approach was dropped. The script now fetches the registry directly at
`https://ui.shadcn.com/r/styles/new-york-v4/<name>.json?base=radix` (the style
slug and `base` parameter taken from the CLI's own resolver in
`dist/chunk-B2MD6U5O.js`; that endpoint serves the Radix/`asChild` variant).
No scratch project, no `components.json`, no CLI. A full run takes seconds.

Because our primitives carry intentional IGRP deltas, the comparison is
**upstream-vs-recorded-upstream**, not local-vs-upstream. Baseline hashes live in
[shadcn-upstream.lock.json](shadcn-upstream.lock.json).

## Baseline

```
54 unchanged · 0 upstream-changed · 0 new · 2 local-only · 0 unavailable
```

- **54 primitives** baselined against the registry as of 2026-09-15.
- **2 local-only:** `cropper`, `stepper` — IGRP-authored, not in the shadcn
  registry. Correctly excluded rather than reported as failures.
- **0 unavailable** — every tracked primitive was successfully compared.

Detection was verified by tampering with a recorded hash: the run reported
`1 upstream-changed`, printed the diff, and exited 1.

## Per-primitive disposition

No primitive source was re-synced this cycle — this baseline records _where
upstream is today_, so the next run reports only genuine upstream movement.
The IGRP deltas in [../COMPONENTS.md](../COMPONENTS.md) remain as documented.

Stamp housekeeping:

- `carousel.tsx` and `native-select.tsx` had **no stamp**; both are now stamped
  `2026-09-15`, matching this baseline.
- The stamp parser previously matched only `// shadcn: …` on line 1 and so read
  **2 of 56** files. 51 primitives use `/* shadcn: … */` and 4 sit below an
  `eslint-disable`. The parser now scans the whole leading comment block and
  accepts both comment styles; a unit test fails if any primitive lacks a stamp.
- `accordion.tsx` is stamped `2026-09-19`, four days in the future. **Left as-is
  deliberately** — correcting it would mean guessing the real sync date. The
  script reports it on every run until someone who knows fixes it.

## Next run

`pnpm drift:shadcn`. Review any `upstream-changed` diff, port or document the
delta, then `pnpm drift:shadcn:update` to re-baseline.
