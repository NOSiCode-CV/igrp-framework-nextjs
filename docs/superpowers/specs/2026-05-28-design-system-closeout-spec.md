# Design System Close-Out Spec

**Date:** 2026-05-28
**Scope target:** `packages/design-system` (`@igrp/igrp-framework-react-design-system`)
**Predecessor:** the design-system quality pass on `dev` (commits `60f72e00..dca7c471`), which introduced peerDeps migration, `/styles` deprecation, `COMPONENTS.md`, a template `shadcn add` warning, and the shadcn drift detector.
**Status:** spec — not yet planned, not yet implemented.

## Purpose

The quality-pass closed the architectural gaps surfaced by the shadcn-skill audit. This spec captures the **finishing work** that remains before the kit can be called "closed for the cycle." It batches six follow-ups identified in the post-merge re-review. Each item is independently shippable; the spec scopes them, defines success, and notes risks, but does **not** prescribe implementation steps — that's the plan's job.

## Non-goals

- Adding new components, new variants, or new layers.
- Re-architecting the three-layer model.
- Cross-package work (next, next-ui, next-auth, templates). Where downstream packages are touched, it's only because this spec's work forces a downstream-visible change.

---

## Item 1 — Complete the `/styles` removal

### Problem

The previous beta (the one currently on `dev`) soft-deprecated the `/styles` export — dropped from the dev `exports` map, retained in `publishConfig.exports`. The `package.json` `"//"` field commits to removal in the next beta. That removal hasn't happened.

While `/styles` still ships:
- Every release rebuilds `src/styles.css` via `tailwind:build` — wasted CI cycles.
- External consumers can still import it and trigger the cascade conflict documented in [.claude/shared/tailwind-v4.md](.claude/shared/tailwind-v4.md).
- The `dist/styles.css` artifact remains in the published tarball, inflating its size.

### In scope

- Remove `./styles` from `publishConfig.exports` in [packages/design-system/package.json](packages/design-system/package.json).
- Remove the `tailwind:build` script and its invocation from `build:reactcompiler`.
- Delete `src/styles.css` (regenerated artifact — confirm via `git log` it's not hand-maintained).
- Remove the `"//"` deprecation comment field (no longer needed).
- Update [packages/design-system/CLAUDE.md](packages/design-system/CLAUDE.md) "Deprecated exports" section: either delete the entry or move it to a "Removed exports (do not reintroduce)" note.
- Update [.claude/shared/tailwind-v4.md](.claude/shared/tailwind-v4.md) wording: deprecation → removal.
- Patch-level changeset.

### Out of scope

- Migrating external consumers off `/styles`. They're on their own — the deprecation window was the runway.
- Removing `tw-animate-css` or other Tailwind machinery.

### Success criteria

- `pnpm pack --dry-run` for the design-system shows no `styles.css` in the tarball file list.
- A test fixture importing `@igrp/igrp-framework-react-design-system/styles` resolves to module-not-found.
- `pnpm build:ds` runs without `tailwind:build` and completes in measurably less time.
- Demo template still renders correctly (it consumes `/tokens`, not `/styles`).

### Risks

- An external app inside NOSi may be importing `/styles`. Audit before merge: grep the wider NOSi codebase if accessible, or coordinate with the apps team on Slack.
- Removing the `tailwind:build` script removes a useful escape hatch for one-off CSS debugging. Document the alternative (run `@tailwindcss/cli` ad-hoc) in `CLAUDE.md`.

---

## Item 2 — Catalogue all IGRP deltas from upstream shadcn

### Problem

[COMPONENTS.md](packages/design-system/COMPONENTS.md) has an "IGRP-specific deltas from upstream shadcn" section, but it currently lists only `Button`. The other primitives marked `// IGRP CUSTOM: THIS COMPONENT IS CHANGED FROM THE ORIGINAL` in source aren't catalogued.

Without a complete catalogue:
- The drift detector (item 3 dependency) has no baseline for "this divergence is intentional."
- Quarterly refresh tasks can't tell whether a diff is legitimate drift to absorb or a re-introduction of an upstream change we deliberately rejected.
- Onboarding contributors can't tell why a given primitive doesn't behave exactly like the upstream docs.

### In scope

- `grep -r "// IGRP CUSTOM"` across `packages/design-system/src/components/primitives/`.
- For each hit, read the file and write a one-paragraph entry in [COMPONENTS.md](packages/design-system/COMPONENTS.md) under "IGRP-specific deltas from upstream shadcn." Each entry covers: what the upstream API was, what we changed, why.
- Where a primitive has the `// shadcn: YYYY-MM-DD` stamp, confirm the stamp date matches the last meaningful edit; re-stamp if it doesn't.

### Out of scope

- Reverting any divergence to match upstream.
- Adding deltas that aren't already in source.

### Success criteria

- Every `// IGRP CUSTOM` marker in `src/components/primitives/` has a corresponding entry in COMPONENTS.md.
- Running `grep -L "// shadcn:" packages/design-system/src/components/primitives/*.tsx` returns either nothing or only files where the absence is intentional and documented.

### Risks

- The grep may surface deltas that no one alive remembers the reason for. Where the WHY is unrecoverable, write the entry as "Reason: pre-dating this catalogue; preserved as-is" rather than fabricating motivation.

---

## Item 3 — Establish a drift baseline

### Problem

The drift-detector script ([scripts/check-shadcn-drift.mjs](packages/design-system/scripts/check-shadcn-drift.mjs)) was added but has never been run end-to-end against the real shadcn registry. We don't know how many primitives have drifted from upstream since their stamp dates, or whether the script even produces a clean report under real network conditions.

### In scope

- Run `pnpm drift:shadcn` once, end-to-end, against the live shadcn registry.
- Capture the output verbatim into a one-off report file (e.g. `packages/design-system/scripts/drift-baseline-2026-XX.md`).
- Triage each reported drift: (a) absorb the upstream change, (b) document in COMPONENTS.md as intentional divergence + re-stamp the file, or (c) defer with explicit justification.
- For (a) — apply the upstream change via the shadcn CLI's `--diff` workflow, not by hand.

### Out of scope

- Wiring the drift detector into CI. Still manual, per the design.
- Refreshing every primitive even where no drift is reported.

### Success criteria

- `pnpm drift:shadcn` produces a clean report (zero exit code, no `DRIFT` rows) OR every `DRIFT` row has a documented disposition in the baseline file.
- The next-quarter run produces a comprehensible diff against the baseline.

### Risks

- The shadcn CLI's `--diff` flow may behave unexpectedly against the IGRP-customized primitives (the script was tested in isolation but not against real drift). If it does, the script may need a one-off correction before this item can complete — treat that as feedback for [scripts/check-shadcn-drift.mjs](packages/design-system/scripts/check-shadcn-drift.mjs), not a blocker.
- Some upstream primitives may have moved to `base-ui` instead of `radix`; the `--base radix` flag in the script keeps us on Radix, but absorbing upstream changes that assume `base-ui` is non-trivial. Defer with justification rather than force-merge.

---

## Item 4 — External component documentation surface (stub)

### Problem

[COMPONENTS.md](packages/design-system/COMPONENTS.md) is a layer map — it answers "which component should I use" but not "what props does it take" or "what does it look like." Downstream app developers consuming the published package have no per-component reference outside the source tree. `packages/design-system-storybook` exists but isn't externally published.

### Why this is a stub

The right form for this docs surface is a real decision: extend the existing Storybook and publish it (Chromatic / GitHub Pages / Sonatype-adjacent), build a fresh docs site (Nextra / Astro Starlight / shadcn-style preview), or auto-generate from source + COMPONENTS.md. Each has a different cost profile, hosting story, and authoring workflow. That decision is too big to make inside this spec without a dedicated brainstorming pass.

### Constraints any solution must respect

- Must be reachable by external NOSi app developers, not just maintainers.
- Must render every Horizon, Primitive, and Custom component with at least one usage example.
- Must stay in sync with source — manual prop tables are not acceptable (they rot fast).
- Should support search and deep-linking.
- Hosting cost must be approximately zero (no per-seat Chromatic licensing, no commercial-tier requirements).

### Success criteria

- A successor spec exists at `docs/superpowers/specs/YYYY-MM-DD-design-system-docs-site.md` covering: the chosen form, the hosting target, the source-of-truth wiring (Storybook stories vs. MDX vs. autogen), the publishing pipeline, the migration plan from `packages/design-system-storybook`, and the URL.
- That spec is brainstormed (per `superpowers:brainstorming`) before being planned.

### Out of scope for this batch

Everything else. This item shipping = the successor spec landing in `docs/superpowers/specs/`, not the docs site itself.

---

## Item 5 — Co-located component unit tests

### Problem

`vitest` is configured in `packages/design-system` but has exactly 4 tests today — all for the drift-detector script. No `IGRPForm`, `IGRPDataTable`, `cn()`, or other component-level unit coverage. All UI verification is currently in `packages/design-system-storybook` (visual + Playwright snapshots).

That split is defensible for visual regression. It is **not** sufficient for logic-heavy components:
- `IGRPForm` has nontrivial state machines (validation modes, global error, submit lifecycle, `useFormStatus`).
- `IGRPDataTable` has filter / sort / pagination / row-selection logic.
- `cn()`, `formatChartValue`, `getChartHeight` are pure functions that belong in unit tests.

A bug in any of these surfaces as a visual regression test failure today, with no useful localization signal.

### In scope

- Add unit tests for the pure utilities in `packages/design-system/src/lib/`: `cn()`, `formatChartValue`, `getChartHeight`, anything else stateless.
- Add unit tests for `IGRPForm` covering: schema validation, validation-mode switching, `setGlobalError` / `clearGlobalError`, `reset`, `submit`, `isSubmitting` lifecycle.
- Add unit tests for `IGRPDataTable` filter and sort logic (the headless TanStack Table layer — not DOM rendering).
- Configure vitest with `@testing-library/react` if not already present (peer-dep this; don't bundle it).
- Document the test split in `packages/design-system/CLAUDE.md`: "unit tests here, visual / interaction tests in `design-system-storybook`."

### Out of scope

- Tests for every primitive or Horizon component. Coverage target is **utilities + logic-heavy components**, not 100% surface.
- Migrating any existing Storybook test into vitest. They stay where they are.
- Browser-environment tests (jsdom is sufficient for the targets above).

### Success criteria

- `pnpm --filter @igrp/igrp-framework-react-design-system test` runs in under 10 seconds.
- New tests cover at minimum: `cn()`, `IGRPForm` submit lifecycle (happy path + validation failure), `IGRPDataTable` filter + sort (one each).
- Coverage report (vitest `--coverage`) shows ≥ 70% line coverage for `src/lib/` and `src/components/horizon/form/`.

### Risks

- `IGRPForm` is React Compiler-optimized. Unit tests that mock react-hook-form deeply may pass but not reflect production behavior. Tests must use real RHF + real Zod schemas against jsdom, not mocks.
- `@testing-library/react` must go in peerDependencies, not dependencies, or it inflates the consumer install.

---

## Item 6 — Horizon-layer `Menubar` wrapper

### Problem

The primitive layer ships `Menubar` + sub-components, but there's no Horizon wrapper (`IGRPMenubar`). The three-layer model says Horizon is the default; without an `IGRPMenubar`, any consumer needing a menu bar has to drop to the primitive — a per-use violation of the "Horizon first" rule.

### In scope

- Create `packages/design-system/src/components/horizon/menubar.tsx`.
- Wrap the primitive `Menubar` + sub-components with the standard Horizon conventions: built-in icon slot, semantic labels, `IGRPForm`-aware where relevant (Menubar isn't form-bound, but the convention is icons via `data-icon`).
- Export from `packages/design-system/src/index.ts` (named export, no wildcards, no aliasing).
- Add an entry to [COMPONENTS.md](packages/design-system/COMPONENTS.md): "Menubar | `IGRPMenubar` | `Menubar` + `MenubarMenu` + `MenubarTrigger` + `MenubarContent` + `MenubarItem` | —".
- Add a single happy-path test in `packages/design-system-storybook` (visual snapshot is sufficient; behavior is delegated to the primitive).

### Out of scope

- Adding `IGRPContextMenu`, `IGRPHoverCard`, or other "Horizon gaps" the deltas catalogue (item 2) may surface. If item 2 surfaces a list, that becomes its own spec.
- Reworking the existing primitive `Menubar` to add features.

### Success criteria

- `import { IGRPMenubar } from "@igrp/igrp-framework-react-design-system"` resolves in the demo template.
- A demo route or Storybook story shows it rendering.
- The new entry in COMPONENTS.md passes the existing "every `IGRP*` name resolves" verification.

### Risks

- The `IGRP*` naming convention is established but the *shape* of a Horizon wrapper for a compound primitive like Menubar isn't. Look at how `IGRPDropdownMenu` wraps `DropdownMenu` for the precedent; mirror that pattern.

---

## Cross-cutting

### Release strategy

All six items can ship under one or two beta bumps:

- **Bundle A (recommended):** items 1, 2, 3, 6 together — small, mechanical, no major decisions. One changeset, one beta bump.
- **Bundle B:** item 5 (tests) on its own — bigger surface, may need iteration. One changeset, one beta bump.
- **Item 4 (docs site):** ships as a follow-up spec, not as a changeset against the DS package.

### Dependency order

- Item 1 has no dependencies.
- Item 2 should land before item 3 (drift detector reports against a complete deltas catalogue).
- Item 3 depends on item 2.
- Item 4 is a meta-item (produces a spec, not code).
- Item 5 is independent of items 1–4.
- Item 6 is independent.

### Hard rules (from `.claude/shared/hard-rules.md`) that apply across the batch

- Every user-visible change to a publishable package needs a changeset, type `patch`.
- Don't `changeset publish` — use each package's `release` script.
- Verify registry state before/after any publish.
- pnpm only; Node ≥ 22.
- No `--no-verify` on commits.

### Acceptance for the spec as a whole

This spec is considered complete when each of items 1–6 has either (a) shipped under a tagged beta release, or (b) has a successor spec/plan in `docs/superpowers/specs/` or `docs/superpowers/plans/` that supersedes it.

---

## Hand-off notes

- **Next step:** convert items 1, 2, 3, 6 into an executable plan via `superpowers:writing-plans`. They are small enough to share one plan document.
- **Item 4** should be brainstormed (`superpowers:brainstorming`) before any spec, given the open architectural decisions.
- **Item 5** can be specified separately or rolled into the same plan as items 1–6; size-wise it stands alone better.
