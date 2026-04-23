# CLAUDE.md

Guidance for Claude Code working in this repository.

## Repository Overview

`igrp-framework-nextjs` is a pnpm workspace monorepo that publishes the IGRP Framework — a set of React/Next.js packages used to build IGRP applications — plus reference templates. Published artifacts go to the internal NOSi Sonatype registry.

Requires **Node ≥ 22** and **pnpm**. Workspaces: `packages/**`, `templates/**`, `apps/**`.

## Workspace Layout

```
packages/
  design-system/              → @igrp/igrp-framework-react-design-system  (client UI library)
  design-system-storybook/    → Storybook + visual/regression tests for the DS
  framework/
    next-auth/                → @igrp/framework-next-auth   (NextAuth wrappers, OIDC, session, middleware)
    next-types/               → @igrp/framework-next-types  (shared TS types; depends on next-auth types)
    next-ui/                  → @igrp/framework-next-ui     (client template chrome)
    next/                     → @igrp/framework-next        (server entry: IGRPLayout, IGRPRootLayout, igrpBuildConfig, API client)
templates/
  demo/                       → @igrp/framework-next-template-new  (workspace:* and published zip)
  demo-legacy/                → older reference template
scripts/                      → repo utilities (e.g. migrate-primitive-names.mjs)
```

Each package/template has its own `CLAUDE.md` with package-specific expertise. Claude Code auto-loads the nearest one when you edit files inside that directory.

## Shared rules (apply everywhere)

@.claude/shared/hard-rules.md

@.claude/shared/dependency-order.md

@.claude/shared/commands.md

## Architecture

### Three-layer UI model (design system)

@.claude/shared/three-layer-ui.md

The distinction is load-bearing — mixing layers incorrectly produces inconsistent UI and breaks form wiring.

### Framework runtime layering

- **`@igrp/framework-next`** — server-side entry. `IGRPRootLayout`, `IGRPLayout`, `igrpBuildConfig`, and the access-management API client (`igrpGetAccessClient`, `igrpGetAccessClientConfig`). A template's root layout/page wires these together.
- **`@igrp/framework-next-ui`** — client-side template chrome: header, sidebar, menus, nav-user, breadcrumbs, command search, theme selector, auth carousel/form, `IGRPRootProviders`, `IGRPSessionProvider`.
- **`@igrp/framework-next-auth`** — NextAuth.js wrappers with multiple entry points (`./server`, `./client`, `./session`, `./jwt`, `./middleware`, `./config`, `./sanitize`, `./oidc`, `./providers`, `./types`). Respect these entry points instead of reaching into `dist/`.
- **`@igrp/framework-next-types`** — shared TS types. Depends on `@igrp/framework-next-auth` for session/JWT types.

### Template architecture (templates/demo)

Demo is the canonical example of how to consume the framework:

1. **Middleware** (`src/middleware.ts`) validates the NextAuth session, bypasses public/login/logout/API routes, honors `IGRP_PREVIEW_MODE`.
2. **Root layout** (`src/app/layout.tsx`) wraps the app in `IGRPRootLayout` + providers.
3. **IGRP layout** (`src/app/(igrp)/layout.tsx`) runs auth checks, loads session, renders `IGRPLayout` with header/sidebar around the route group.
4. **Config builder** (`src/igrp.template.config.ts`) uses `igrpBuildConfig` to assemble layout + API + toaster + session config, and swaps in mock data when `IGRP_PREVIEW_MODE=true`.
5. **Server actions** (`src/actions/igrp/`) fetch layout + session server-side; `api/auth/*` holds NextAuth routes.

@.claude/shared/preview-mode.md

### Tailwind v4 + design tokens

@.claude/shared/tailwind-v4.md

### UI rules (design system consumers + templates)

@.claude/shared/ui-rules.md

Inside `templates/demo/**/*.{ts,tsx}`, the authoritative component reference is `templates/demo/skills/igrp-design-system/SKILL.md` — load only the sub-files you need.

## Build tooling by package

| Package | Build | React Compiler | Tailwind prebuild |
| --- | --- | --- | --- |
| `framework-next-auth` | tsup | no | no |
| `framework-next-types` | `tsc -b` | n/a (types only) | no |
| `design-system` | SWC + Babel | yes | yes |
| `framework-next-ui` | SWC + Babel | yes | yes |
| `framework-next` | SWC + Babel | yes | no |

SWC+Babel pipeline: `build:swc` → `build:babel` (React Compiler pass) → `build:types` (emit `.d.ts`). Escape hatch when the React Compiler misbehaves: `build:without_reactcompiler`.

## Claude Desktop coworker knowledge

`.claude/coworker/` contains files designed to be uploaded to a Claude Desktop Project (claude.ai) as project knowledge. `INSTRUCTIONS.xml` is the custom-instructions system prompt; see `.claude/coworker/README.xml` for setup. Claude Code in the IDE uses this `CLAUDE.md` tree and `.claude/agents/` instead.
