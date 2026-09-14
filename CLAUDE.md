# CLAUDE.md

Guidance for Claude Code working in this repository.

## Before any task

Read `.claude/shared/hard-rules.md` before doing anything — including when the user gives you a specific command or script to run. Hard rules are non-negotiable and override convenience shortcuts, user phrasing, and script names. If a suggested script violates a hard rule, flag it and use the correct alternative.

For release/publish tasks specifically: always query the registry to verify actual published state before drawing conclusions. Use per-package `release` scripts (not `changeset publish`) to ensure `--tag latest` is always respected.

## Release workflow — when the user says "bump and release"

Run the `/release-framework` command. It automates the full workflow (verify registry state → detect changed packages → create changeset → version → build in dependency order → publish per-package → verify) with no manual steps. The non-negotiable constraints it enforces live in `.claude/shared/hard-rules.md`.

Each package/template has its own `CLAUDE.md` with package-specific expertise. Claude Code auto-loads the nearest one when you edit files inside that directory.

## Shared rules (apply everywhere)

@.claude/shared/hard-rules.md

@.claude/shared/dependency-order.md

@.claude/shared/commands.md

## Architecture

### Three-layer UI model (design system)

The design system has three layers — **Horizon** (`IGRP*`), **Primitives** (unprefixed, shadcn-style Radix + CVA wrappers), and **Custom** (`IGRP*`, built on Horizon). The distinction is load-bearing: mixing them incorrectly produces inconsistent UI and breaks form wiring. Which layer to reach for is a *consumer* rule and lives with the consumer — `templates/demo-v1/.agents/rules/ui.md`. Authoring rules for the layers themselves are in `packages/design-system/CLAUDE.md`.

### Framework runtime layering

- **`@igrp/framework-next`** — server-side entry. `IGRPRootLayout`, `IGRPLayout`, `igrpBuildConfig`, and the access-management API client (`igrpGetAccessClient`, `igrpGetAccessClientConfig`). A template's root layout/page wires these together.
- **`@igrp/framework-next-ui`** — client-side template chrome: header, sidebar, menus, nav-user, breadcrumbs, command search, theme selector, auth carousel/form, `IGRPRootProviders`, `IGRPSessionProvider`.
- **`@igrp/framework-next-auth`** — NextAuth.js wrappers with multiple entry points (`./server`, `./client`, `./session`, `./jwt`, `./middleware`, `./config`, `./sanitize`, `./oidc`, `./providers`, `./types`). Respect these entry points instead of reaching into `dist/`.
- **`@igrp/framework-next-types`** — shared TS types. Depends on `@igrp/framework-next-auth` for session/JWT types.

Each package's public surface is its `exports` map in `package.json` plus `src/` — read those rather than trusting a copy here.

### Template architecture (`templates/demo-v1` — the only template)

`demo-v1` is the canonical example of how to consume the framework. Its layer-by-layer
walkthrough lives in `templates/demo-v1/CLAUDE.md`, which loads when you work in
that directory.

Critical env constraint: when `NEXT_PUBLIC_BASE_PATH` is set, `NEXTAUTH_URL` must include both the basePath **and** `/api/auth` (e.g. `http://localhost:3000/apps/template/api/auth`). NextAuth treats `NEXTAUTH_URL` as the API root, not the app root — getting this wrong produces a login loop with a growing nested `callbackUrl` chain.

@.claude/shared/preview-mode.md

### Tailwind v4 + design tokens

@.claude/shared/tailwind-v4.md

Inside `templates/demo-v1/**/*.{ts,tsx}`, the template's agent rules are canonical in `templates/demo-v1/.agents/` — `rules/ui.md` (design-system hard rules) and `rules/permissions.md` (permission gating). `AGENTS.md`, `.cursor/`, `.trae/` and `.github/` are thin bridges that point there; rule content belongs in `.agents/rules/`, never in a bridge. `.github/copilot-instructions.md` is **generated** (`pnpm --filter @igrp/framework-next-template agents:sync`) because Copilot cannot follow references.

The full component reference is the skill at `templates/demo-v1/.agents/skills/igrp-design-system/SKILL.md`. That subtree is **not committed** — the zip script injects it from `plugins/igrp/skills/design-system/`, which is the copy to edit in this repo. Treat it as authoritative and load only the sub-files you need.

## Build tooling

Each package's build pipeline is its `scripts` block in `package.json`. Two things that aren't obvious from reading them:

- The React packages (`design-system`, `framework-next-ui`, `framework-next`) run `build:js` (Babel: strip TS, transform JSX, React Compiler — one pass over `src/`) → `build:types` (`tsc --emitDeclarationOnly`). Babel emits untouched ESM at esnext, file-per-module, directives preserved; there is deliberately no `@babel/preset-env` and no bundler, because `templates/demo-v1` consumes `dist/` directly (`use client` boundaries, `optimizePackageImports`, Tailwind `@source` scanning). Shared config: `scripts/react-compiler-babel-config.cjs`.
- Escape hatch when the React Compiler misbehaves: `build:without_reactcompiler`.

### Vendored agent skills

Third-party skills live in `.agents/skills/`, pinned to their upstream source and content hash by `skills-lock.json`. `.claude/skills/` is a **generated, gitignored bridge** over that directory — run `pnpm skills:sync` after a fresh clone (or after editing `.agents/skills/` or `skills-lock.json`), or Claude Code won't load any of them. Never edit `.claude/skills/` directly; the next sync overwrites it.

Real file copies rather than symlinks, deliberately: this repo is developed on Windows clones with `core.symlinks=false`, where a committed symlink is materialised as a regular file and the bridge silently becomes a second committed copy that drifts past the lockfile's hash check. `pnpm skills:sync:check` verifies the local bridge; CI runs `--verify-lock` instead, since a clean checkout has no bridge to compare.

## Tests

There is **no root `test` script** — tests live in two packages and use **Vitest**:

- `pnpm --filter @igrp/template-migrator test` — runs `vitest run` (migration logic). Its `release` script runs `check:drift` first (`tsx scripts/check-drift.ts`), which fails the publish if `templates/demo-v1` has drifted from the shipped migrations.
- `packages/design-system-storybook` — `test:vitest` (component) and `test-storybook` (Playwright snapshots; Storybook must be running).

Run a **single test**: `pnpm --filter @igrp/template-migrator exec vitest run path/to/file.test.ts -t "test name"` (drop `run` for watch mode). The `-t` flag filters by test/describe name.
