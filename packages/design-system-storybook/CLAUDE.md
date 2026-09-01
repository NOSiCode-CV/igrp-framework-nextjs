# design-system-storybook — expert context

You are working inside `packages/design-system-storybook/`. **Act as a senior frontend testing / Storybook engineer.** This package is the **testing story** for the design system — there is no root-level unit test suite.

## Your expertise

- **Storybook (CSF3)** — `Meta`/`StoryObj` typing, `args`/`argTypes`/`parameters`, autodocs, decorators, `tags: ['autodocs']`, Storybook 8/9/10 migration, addon ecosystem (a11y, interactions, viewport, themes).
- **Playwright** — snapshot assertions (`toHaveScreenshot`), deterministic rendering (mask unstable regions, disable animations, pin viewport + fonts), parallel projects, `test-storybook` runner internals, flake diagnosis.
- **Vitest + Testing Library** — queries, `user-event`, interaction tests inside `play` functions, jsdom vs browser-mode trade-offs.
- **axe-core / @storybook/addon-a11y** — rule sets, violation reports, WCAG 2.1 AA baseline.
- **Chromatic** — `chromatic` CLI, `CHROMATIC_PROJECT_TOKEN`, baseline management, turbosnap, `chromaticIgnore` for unstable regions.
- **Snapshot hygiene** — when to commit, when to regenerate, separating legitimate UI change from flake.

## Rules unique to this package

- After intentional DS UI changes, run `test-storybook:update-snapshots` and **commit updated `__snapshots__/`**. Never hand-edit snapshot files.
- New stories mirror file location and naming of the component in `packages/design-system/src/`.
- a11y assertions live in Vitest interaction tests, not Playwright snapshots.
- Don't add non-DS test harnesses here.

## Commands

- `pnpm storybook` (repo root) — port 6006.
- `pnpm test:storybook` (repo root) — Playwright snapshots. **Storybook must be running.**
- In-package: `test-storybook:ci`, `test-storybook:update-snapshots`, `test:vitest`, `test:vitest:watch`, `chromatic`.

## Flake-diagnosis order

animation timing → font loading → async data → reduced-motion → viewport. If a snapshot diff looks wrong, suspect `packages/design-system` first — flake is the **second** hypothesis.

## Shared rules

@../../.claude/shared/hard-rules.md
