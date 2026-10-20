# Design system maintenance scripts

## `check-shadcn-drift.mjs`

Periodic (~quarterly) check that tells you **whether upstream shadcn has moved
since the last time we looked** at each primitive under
`src/components/primitives/`.

**Run:** `pnpm drift:shadcn` (from `packages/design-system/`).
**Re-baseline:** `pnpm drift:shadcn:update` after you have reviewed the changes.

### How it works

It fetches each primitive straight from the shadcn registry over HTTP:

```
https://ui.shadcn.com/r/styles/new-york-v4/<name>.json?base=radix
```

`new-york-v4` is the style slug the CLI itself resolves to (`shadcn@4.21.0`,
`dist/chunk-B2MD6U5O.js`), and it serves the **Radix** (`asChild`) variant —
the one this package tracks. There is no scratch project, no `components.json`,
and no `shadcn` CLI invocation.

Because our primitives carry deliberate IGRP deltas (see `../COMPONENTS.md`),
"local differs from upstream" is permanently true and useless as a signal. So
the script normalizes and hashes each **upstream** source into
`shadcn-upstream.lock.json` and compares against that baseline. Normalization
drops the things that are structural rather than semantic: line endings,
trailing whitespace, the leading comment block, and upstream's `@/` aliases
(rewritten to this package's relative paths).

### Statuses

| Status             | Meaning                                                   | Fails the run |
| ------------------ | --------------------------------------------------------- | ------------- |
| `unchanged`        | upstream identical to the recorded baseline               | no            |
| `upstream-changed` | upstream moved — review the printed diff                  | yes           |
| `new`              | no baseline recorded yet                                  | yes           |
| `local-only`       | not in the registry (IGRP-authored: `cropper`, `stepper`) | no            |
| `unavailable`      | could not be fetched or parsed                            | yes           |

`unavailable` is deliberately a failure. The previous implementation treated a
failed comparison as a pass, which is how it reported `0/55 drifted` while five
primitives were known to diverge.

### What to do with an `upstream-changed` result

- Upstream shipped a bugfix we want → port it into the local primitive, bump the
  `shadcn:` stamp, add a changeset, then `pnpm drift:shadcn:update`.
- Upstream changed something we intentionally diverge from → add or update the
  entry in `../COMPONENTS.md` "IGRP-specific deltas from upstream shadcn", then
  `pnpm drift:shadcn:update` so the next run starts from the new upstream.

### Stamps

Each primitive carries a `shadcn: YYYY-MM-DD` stamp in its leading comment
block, recording the last upstream sync. Both `// shadcn: …` and
`/* shadcn: … */` are accepted, and the stamp may sit below another leading
comment such as an `eslint-disable`. The script reports any primitive missing a
stamp or carrying a future-dated one; `scripts/__tests__` fails if a primitive
has no stamp at all.

### Flags

| Flag       | Effect                                                       |
| ---------- | ------------------------------------------------------------ |
| _(none)_   | report; exit 1 on `upstream-changed` / `new` / `unavailable` |
| `--update` | record the current upstream as the new baseline              |
| `--json`   | machine-readable report on stdout                            |

It hits the network and is **not** wired into CI. It takes a few seconds
(56 requests, 8 at a time).
