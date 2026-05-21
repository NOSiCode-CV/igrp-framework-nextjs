# Common commands (from repo root)

## Setup

- `pnpm install:deps` — install via `dotenv-cli` (injects `.env` registry credentials)
- `pnpm build:framework` — must run once after install before `pnpm dev:demo` works

## Framework builds (ordered)

- `pnpm build:framework` — full ordered build
- `pnpm build:auth` | `pnpm build:next-types` | `pnpm build:ds` | `pnpm build:next-ui` | `pnpm build:next`
- `pnpm build` — everything with a build script
- `pnpm lint` | `pnpm format` | `pnpm clean` | `pnpm clean-all` (also removes `node_modules`)

## Template (`templates/demo-legacy` — the only template, package name `@igrp/framework-next-template`)

- `pnpm dev:demo` — Next.js 15 + Turbopack
- `pnpm build:demo` — `next build` (runs Biome format)
- `pnpm start:demo` — `next start`
- `pnpm release:demo` — create the publishable zip template
- `pnpm dev:app-center` — if `apps/` is present

## Storybook & visual tests

- `pnpm storybook` — port 6006
- `pnpm test:storybook` — Playwright snapshots (Storybook must be running)
- Inside `packages/design-system-storybook`: `test-storybook:ci`, `test-storybook:update-snapshots`, `test:vitest`, `chromatic`

## Releases

- `pnpm changeset` — record a change
- `pnpm version:changesets` — apply versions, regenerate CHANGELOGs (baseBranch = `main`)

## Codemods

- `pnpm migrate:primitives` — dry-run
- `pnpm migrate:primitives:apply` — rewrite files
