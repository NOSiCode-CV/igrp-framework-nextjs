# IGRP Design System Storybook

Storybook for the IGRP Design System with visual and regression testing.

## Development

```bash
pnpm storybook
```

## Visual & Regression Testing

### 1. Snapshot Testing (Local)

Uses [@storybook/test-runner](https://storybook.js.org/docs/writing-tests/test-runner) with Playwright to capture HTML snapshots of each story. Compares against baselines to detect visual regressions.

**Run tests** (requires Storybook running in another terminal):

```bash
# Terminal 1: Start Storybook
pnpm storybook

# Terminal 2: Run snapshot tests
pnpm test-storybook
```

**CI mode** (fails on snapshot mismatch):

```bash
pnpm test-storybook:ci
```

**Update snapshots** (after intentional UI changes):

```bash
pnpm test-storybook:update-snapshots
```

Snapshots are stored in `__snapshots__/` — commit them to version control.

### 2. Vitest (Interaction & Accessibility)

Runs interaction tests (stories with `play` functions) and a11y checks in a real browser:

```bash
pnpm test:vitest
pnpm test:vitest:watch  # Watch mode
```

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
| `test-storybook` | Run snapshot regression tests |
| `test-storybook:ci` | Run tests in CI mode (fail on diff) |
| `test-storybook:update-snapshots` | Update snapshot baselines |
| `test:vitest` | Run Vitest interaction tests |
| `chromatic` | Run Chromatic visual regression |
