# IGRP Design System Storybook

Storybook for the IGRP Design System with visual and regression testing.

## Prerequisites

Storybook resolves the design system through its `exports` map, which points at `dist/` (gitignored). Build it first, from the repo root:

```bash
pnpm build:ds
```

The story runner and Vitest browser tests drive Chromium through Playwright; install the browser once:

```bash
pnpm exec playwright install chromium
```

## Development

```bash
pnpm storybook
```

From the repo root the same commands are aliased as `pnpm storybook` and `pnpm test:storybook` (story smoke tests).

## Visual & Regression Testing

### 1. Story smoke tests

Uses [@storybook/test-runner](https://storybook.js.org/docs/writing-tests/test-runner) with Playwright to render every story, run its `play` function and its accessibility check. A story that throws, or a failing `play`, fails the run. There are no HTML snapshots: they failed on every class-name change, so a red run said nothing about whether the UI broke. Behaviour is covered by the design system's Vitest suite, and pixels by Chromatic.

**Run tests** (requires Storybook running in another terminal):

```bash
# Terminal 1: Start Storybook
pnpm storybook

# Terminal 2: Run the story tests
pnpm test-storybook
```

**CI mode:**

```bash
pnpm test-storybook:ci
```

### 2. Vitest (Interaction & Accessibility)

Runs interaction tests (stories with `play` functions) and a11y checks in a real browser:

```bash
pnpm test:vitest
pnpm test:vitest:watch  # Watch mode
```

a11y violations fail the run (`parameters.a11y.test: 'error'` in `.storybook/preview.ts`).

### 3. Chromatic (Cloud Visual Regression)

[Chromatic](https://www.chromatic.com/) provides pixel-perfect visual testing with cross-browser support, theme testing, and PR integration.

**Setup:**

1. Create a project at [chromatic.com](https://www.chromatic.com/)
2. Set `CHROMATIC_PROJECT_TOKEN` in your environment

**Run:**

```bash
pnpm chromatic
```

For CI, add to your pipeline:

```yaml
- run: pnpm build-storybook
- run: pnpm chromatic --project-token=$CHROMATIC_PROJECT_TOKEN
```

## Scripts

| Script | Description |
|-------|-------------|
| `storybook` | Start Storybook dev server (port 6006) |
| `build-storybook` | Build static Storybook |
| `serve-storybook` | Serve built Storybook locally |
| `test-storybook` | Render every story and run its play function and a11y check |
| `test-storybook:ci` | Same, in CI mode |
| `test:vitest` | Run Vitest interaction tests |
| `test:vitest:watch` | Vitest in watch mode |
| `chromatic` | Run Chromatic visual regression |
| `dev` | `tsc --watch` |
| `lint` | ESLint |
| `format` | Prettier (write) |
| `clean-all` | Remove `node_modules` |
