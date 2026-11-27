# Common commands (from repo root)

## Setup

- `pnpm install:deps` — install via `dotenv-cli` (injects `.env` registry credentials)
- `pnpm build:framework` — must run once after install before `pnpm dev:demo` works

## Before pushing

- `pnpm ci:local` — runs the verify-stage jobs of `.gitlab-ci.yml` locally (`drift`, `skills`, `i18n`, `verify`, `e2e`, `storybook`); `-- --only=verify,e2e` or `-- --skip=storybook` to narrow it. The Storybook job needs Playwright's Chromium (`pnpm --filter @igrp/e2e exec playwright install chromium`); e2e falls back to Edge/Chrome without it. Keep `scripts/ci-local.mjs` in step with `.gitlab-ci.yml`.

## Framework builds (ordered)

- `pnpm build:framework` — full ordered build
- `pnpm build:auth` | `pnpm build:next-types` | `pnpm build:ds` | `pnpm build:next-ui` | `pnpm build:next`
- `pnpm build` — everything with a build script
- `pnpm lint:i18n:framework` — no hardcoded UI strings in the design system, next-ui and next (needs `pnpm build:i18n-tools`); mark non-language literals with an `igrp-i18n-ignore` comment
- `pnpm lint` | `pnpm format` | `pnpm format:check` (also in CI `verify` and every framework `release`) | `pnpm clean` | `pnpm clean-all` (also removes `node_modules`)

## Template (`templates/demo-v1` — the only template, package name `@igrp/framework-next-template`)

- `pnpm dev:demo` — Next.js 15 + Turbopack
- `pnpm build:demo` — `next build` (runs Biome format)
- `pnpm start:demo` — `next start`
- `pnpm release:demo` — create the publishable zip template

## Storybook & visual tests

- `pnpm storybook` — port 6006
- `pnpm test:storybook` — renders every story (Storybook must be running)
- `pnpm test:e2e` — Playwright smoke tests (`packages/e2e`) against `templates/demo-v1` in preview mode; starts `next dev` on port 3100 itself. Needs `pnpm build:framework` first. Without `playwright install chromium`, run with `E2E_CHANNEL=msedge` (or `chrome`) to use an installed browser
- Inside `packages/design-system-storybook`: `test-storybook:ci`, `test:vitest`, `chromatic`

## Releases

- `pnpm changeset` — record a change
- `pnpm version:changesets` — apply versions, regenerate CHANGELOGs (baseBranch = `main`)

## Template migrator (`packages/framework/template-migrator` — `@igrp/template-migrator`, CLI `igrp-migrate`)

- `pnpm template-migrations` — build the migrator (`pnpm --filter @igrp/template-migrator build`)
- `pnpm --filter @igrp/template-migrator test` — Vitest
- `pnpm --filter @igrp/template-migrator typecheck` — `tsc --noEmit` over `src/` **and** `scripts/`
- `pnpm --filter @igrp/template-migrator check:drift` — fail if `templates/demo-v1` drifted from shipped migrations. Runs in `release` (after `typecheck` and `test`), and per-MR via the `check_template_drift` job in `.gitlab-ci.yml`
- `pnpm --filter @igrp/template-migrator sync:template-lock` — regenerate `templates/demo-v1/.igrp-migrations-lock.json` so the zip marks every migration applied. **Run after adding a migration** — `check:drift` fails until you do. Add `--check` for a dry run.
