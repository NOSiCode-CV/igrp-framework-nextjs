# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

`igrp-framework-nextjs` is a pnpm workspace monorepo that publishes the IGRP Framework — a set of React/Next.js packages used to build IGRP applications — plus reference templates. Published artifacts go to the internal NOSi Sonatype registry (`https://sonatype.nosi.cv/repository/igrp/`).

Requires **Node ≥ 22** and **pnpm**. Workspaces: `packages/**`, `templates/**`, `apps/**`.

## Workspace Layout

```
packages/
  design-system/              → @igrp/igrp-framework-react-design-system  (client UI library)
  design-system-storybook/    → Storybook + visual/regression tests for the DS
  framework/
    next-auth/                → @igrp/framework-next-auth   (NextAuth wrappers, OIDC, session, middleware)
    next-types/               → @igrp/framework-next-types  (shared TS types; depends on next-auth types)
    next-ui/                  → @igrp/framework-next-ui     (client template chrome: header, sidebar, auth forms, theme, providers)
    next/                     → @igrp/framework-next        (server entry: IGRPLayout, IGRPRootLayout, igrpBuildConfig, API client)
templates/
  demo/                       → @igrp/framework-next-template-new  (consumed as workspace:*, also published as zip template)
  demo-legacy/                → older reference template
scripts/                      → repo utilities (e.g. migrate-primitive-names.mjs)
```

### Package dependency order (important for local builds)

```
next-auth → next-types → design-system → next-ui → next
```

`pnpm build:framework` runs them in exactly this order. Do not reorder — `next-ui` imports from the design system and auth packages, and `next` imports from `next-ui`/`next-auth`/`next-types`.

## Common Commands

All run from repo root unless stated. Most scripts forward through pnpm workspace filters.

### Framework packages

```bash
# Full, ordered build of all framework packages
pnpm build:framework

# Individual package builds
pnpm build:auth        # @igrp/framework-next-auth
pnpm build:next-types  # @igrp/framework-next-types
pnpm build:ds          # @igrp/igrp-framework-react-design-system
pnpm build:next-ui     # @igrp/framework-next-ui
pnpm build:next        # @igrp/framework-next

# Build everything in the workspace that has a build script
pnpm build

# Recursive lint / format / clean across all packages
pnpm lint
pnpm format
pnpm clean
pnpm clean-all         # also removes node_modules
```

Most framework packages build with SWC + Babel and run `babel-plugin-react-compiler` (React Compiler). The output of `build:swc` is re-passed through `build:babel` to apply the compiler, then `build:types` emits `.d.ts`. If the React Compiler misbehaves, packages also expose `build:without_reactcompiler` as an escape hatch. `design-system` and `next-ui` additionally prebuild Tailwind with `pnpm dlx @tailwindcss/cli` via `tailwind:build` before SWC.

### Templates & apps

```bash
# Demo template (Next.js 15 + Turbopack)
pnpm dev:demo          # start dev server
pnpm build:demo        # next build (also runs biome format)
pnpm start:demo        # next start
pnpm release:demo      # create the publishable zip template

# App Center (if present under apps/)
pnpm dev:app-center
```

Templates use **Biome** (not ESLint) for lint/format: from inside a template, `pnpm lint` → `biome check --write`, `pnpm format` → `biome format --write`.

### Storybook & visual tests (packages/design-system-storybook)

```bash
pnpm storybook         # start Storybook from the root (port 6006)
pnpm test:storybook    # Playwright-driven snapshot tests (Storybook must be running)
```

Inside `packages/design-system-storybook` more scripts exist: `test-storybook:ci`, `test-storybook:update-snapshots` (after intentional UI changes — snapshots live in `__snapshots__/` and must be committed), `test:vitest` / `test:vitest:watch` for interaction + a11y tests, and `chromatic` for cloud visual regression (requires `CHROMATIC_PROJECT_TOKEN`).

There is no unit test suite at the repo root — visual/interaction tests in `design-system-storybook` are the testing story for the design system.

### Releases

Versioning is driven by **Changesets**:

```bash
pnpm changeset               # record a change (pick packages + bump type)
pnpm version:changesets      # apply versions and regenerate CHANGELOGs (baseBranch = main)
```

Each publishable package also has a `release` script that builds and publishes to the internal Sonatype registry with `yarn publish --tag latest`. Do not switch registries or tags without checking first.

### Codemods

```bash
pnpm migrate:primitives        # dry-run of scripts/migrate-primitive-names.mjs
pnpm migrate:primitives:apply  # actually rewrite files
```

## Architecture

### The three-layer UI model (design system)

The design system exposes three component layers. This distinction is load-bearing — mixing them incorrectly produces inconsistent UI and breaks form wiring:

| Layer | Prefix | When to use |
| --- | --- | --- |
| **Horizon** | `IGRP*` | Default for all app UI. Opinionated — built-in labels, icons, loading, and `IGRPForm` integration. |
| **Primitives** | `*Primitive` or unprefixed shadcn-style (`Button`, `Card`, `Input`) | Custom composition / full control. Thin Radix + CVA wrappers with no IGRP conventions. |
| **Custom** | `IGRP*` (e.g. `IGRPStatsCard`, `IGRPUserAvatar`) | Domain-specific components built on Horizon. |

Horizon is always the first choice. Drop to Primitives only when Horizon doesn't fit.

Everything from `@igrp/igrp-framework-react-design-system` is **client-side**: any file importing from it needs `'use client'`. The package's `src/index.ts` and `src/components/custom/*` are wrapped in `"use client"` boundaries — wildcard exports and aliasing are forbidden there because they break the unbundled build.

### Framework runtime layering

- **`@igrp/framework-next`** — server-side entry. Provides `IGRPRootLayout`, `IGRPLayout`, `igrpBuildConfig`, and the access-management API client (`igrpGetAccessClient`, `igrpGetAccessClientConfig`). A template's root layout/page wires these together.
- **`@igrp/framework-next-ui`** — client-side template chrome: header, sidebar, menus, nav-user, breadcrumbs, command search, theme selector, auth carousel/form, `IGRPRootProviders`, `IGRPSessionProvider`. Consumed by `framework-next` layouts and by templates directly.
- **`@igrp/framework-next-auth`** — NextAuth.js wrappers with multiple entry points (`./server`, `./client`, `./session`, `./jwt`, `./middleware`, `./config`, `./sanitize`, `./oidc`, `./providers`, `./types`). Respect these entry points instead of reaching into `dist/` — they exist to keep server code out of client bundles.
- **`@igrp/framework-next-types`** — shared TS types. Depends on `@igrp/framework-next-auth` for session/JWT types.

### Template architecture (templates/demo)

Demo is the canonical example of how to consume the framework. Flow:

1. **Middleware** (`src/middleware.ts`) validates the NextAuth session, bypasses public/login/logout/API routes, and honors `IGRP_PREVIEW_MODE`.
2. **Root layout** (`src/app/layout.tsx`) wraps the app in `IGRPRootLayout` + providers.
3. **IGRP layout** (`src/app/(igrp)/layout.tsx`) runs auth checks, loads session, and renders `IGRPLayout` with header/sidebar around the route group.
4. **Config builder** (`src/igrp.template.config.ts`) uses `igrpBuildConfig` to assemble layout + API + toaster + session config, and swaps in mock data when `IGRP_PREVIEW_MODE=true`.
5. **Server actions** (`src/actions/igrp/`) fetch layout + session server-side; `api/auth/*` holds NextAuth routes.

Preview mode (`IGRP_PREVIEW_MODE=true`) is significant: it bypasses auth, uses mock data from `src/temp/{users,menus,applications}`, and disables session refetch. Middleware and layouts both check this flag.

### Tailwind v4 + design tokens (critical)

Templates compile Tailwind **once in the app**, not in the framework packages. Two things must be correct:

1. `@source` in the app's `globals.css` must point at both the app source and the compiled `dist/` output of the IGRP packages, so Tailwind generates utilities used inside the DS.
2. Import **tokens only** from the design system — never the prebuilt `styles.css`:
   ```css
   @import "@igrp/igrp-framework-react-design-system/tokens";
   ```
   Importing `@igrp/*/styles.css` causes cascade conflicts and missing utilities. The DS `package.json` still exposes `/styles` for legacy consumers, but templates in this repo must not use it.

Dark mode is the `.dark` class on a parent (driven by `next-themes`). Theme variants (`theme-blue`, etc.) override tokens in `src/styles/themes.css`, which must be imported *after* the tokens import.

### UI rules inside templates/demo

`.cursor/rules/design-system-templates.mdc` and `templates/demo/AGENTS.md` enforce: all UI comes from `@igrp/igrp-framework-react-design-system`; forms always use `IGRPForm` + Zod (never raw `<form>` or direct react-hook-form); only semantic tokens (`bg-background`, `text-foreground`) — never raw Tailwind colors; `cn()` for class merging; `size-*` when width equals height; `flex gap-*` over `space-x-*`/`space-y-*`.

When working inside `templates/demo/**/*.{ts,tsx}`, the authoritative component reference is `templates/demo/skills/igrp-design-system/SKILL.md` — it has the full component-selection table and links out to per-component deep-dives in `components/`. Load only the sub-files you need; the skill tree is large.

## Repo Conventions

- **pnpm only.** `engines.node >= 22`. Workspaces rely on the `workspace:*` protocol — internal deps are linked, not downloaded.
- **Don't edit `dist/`.** All packages build into their own `dist/` and that is what ships; source is always under `src/`.
- **Don't import across package internals** (e.g. `@igrp/framework-next-auth/dist/...`). Use the documented export entry points.
- **Changeset per user-visible change** to a publishable package.
- **`.env.npmrc.example`** documents the registry/auth setup; `pnpm install:deps` runs install via `dotenv-cli` so a `.env` at the root can inject private-registry credentials.
- Framework packages use **ESLint + Prettier**; `templates/demo` uses **Biome**. Don't run one on the other's tree.
