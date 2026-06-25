# IGRP Framework Next.js Template

The canonical reference template for building applications with the **IGRP Framework** on **Next.js 15**. It ships a complete, production-ready foundation: OIDC authentication, layout/session management, Access Management sync, typed error boundaries, and a modern UI built on the IGRP design system.

Package name: `@igrp/framework-next-template`.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Documentation](#documentation)

## Overview

The template integrates:

- **Next.js 15** — App Router + Turbopack (dev *and* build)
- **IGRP Framework** — `@igrp/framework-next`, `-next-ui`, `-next-auth`, `-next-types`
- **IGRP Design System** — `@igrp/igrp-framework-react-design-system` (Horizon components first)
- **NextAuth v4** — OIDC via the `igrp-auth` provider (PKCE + nonce), with an `AUTH_PROVIDER=none` bypass
- **TypeScript**, **Tailwind CSS v4**, **React Query**, **React Hook Form + Zod**
- **Biome** for formatting and linting
- **[Lucide](https://lucide.dev/icons/)** icons

The framework dependencies are linked from the monorepo via `workspace:*`. In a published standalone template they resolve to the internal Sonatype registry.

## Prerequisites

- **Node.js** >= 22
- **pnpm** (this repo is pnpm-only)
- **Git**

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the values. The fastest path for local development is **preview mode** — no auth server required:

```env
IGRP_PREVIEW_MODE=true
IGRP_APP_CODE=DEMO_APP
```

For a real auth flow, see [Environment Variables](docs/ENVIRONMENT.md) and [Auth Server Registration](docs/ENVIRONMENT.md#auth-server-registration-required).

### 3. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). If `NEXT_PUBLIC_BASE_PATH` is set (e.g. `/apps/template`), browse to that path.

### 4. Build for production

```bash
pnpm build
pnpm start
```

## Available Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `pnpm dev` | `next dev --turbopack` | Development server |
| `pnpm build` | `pnpm format && next build --turbopack` | Production build (Biome format first) |
| `pnpm start` | `next start` | Serve the production build |
| `pnpm lint` | `biome check --write` | Lint and auto-fix |
| `pnpm format` | `biome format --write` | Format |
| `pnpm publish:template` | PowerShell zip script | Package the publishable template |

> This template uses **Biome** for lint/format — not ESLint/Prettier. Don't add ESLint/Prettier configs here.

## Project Structure

```
templates/demo-legacy/
├── src/
│   ├── app/
│   │   ├── (auth)/                       # Login / logout route group
│   │   │   ├── login/page.tsx            # IGRPAuthForm + carousel launcher
│   │   │   ├── logout/page.tsx
│   │   │   └── error.tsx
│   │   ├── (igrp)/                        # Authenticated shell (verifySession gate)
│   │   │   ├── layout.tsx                 # IGRPLayoutFull (header; sidebar optional)
│   │   │   ├── page.tsx                   # Home
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   ├── system-settings/page.tsx
│   │   │   └── (generated)/               # Code-generated route group
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts # NextAuth handler (from lib/auth.ts)
│   │   │   └── health/route.ts            # Health check
│   │   ├── layout.tsx                     # Root layout → IGRPRootLayout
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   └── global-error.tsx               # Renders typed IgrpError
│   ├── actions/igrp/
│   │   ├── layout.ts                      # configLayout(), getTheme()
│   │   └── auth.ts
│   ├── config/                            # site, login, error-messages
│   ├── lib/
│   │   ├── auth.ts                        # withIGRPAuth instance, serverSession, getSession
│   │   ├── dal.ts                         # verifySession() data-access gate
│   │   ├── utils.ts                       # cn, isPreviewMode, isAuthDisabled, isAuthBypass, sanitizeCallbackUrl
│   │   ├── errors.ts, report-error.ts
│   │   ├── fonts.ts
│   │   └── config/                        # get-base-path, get-pkj, get-routes, get-session-args
│   ├── providers/query-client.tsx        # React Query provider
│   ├── temp/                              # Mock users / menus / applications (preview mode)
│   ├── styles/                            # globals.css + theme variants
│   ├── middleware.ts                      # Auth gate + security headers
│   └── igrp.template.config.ts           # createConfig() → igrpBuildConfig
├── public/
├── create-template/                      # Template publishing scripts
├── docker/development/                   # Dockerfile, compose, env
├── .igrp-migrations-lock.json            # Applied-migration tracker
└── package.json
```

## Documentation

Detailed topics live in [`docs/`](docs/):

| Topic | Description |
| --- | --- |
| [Environment Variables](docs/ENVIRONMENT.md) | Every env var (auth, NextAuth, framework, M2M, public) + required auth-server URI registration |
| [Architecture](docs/ARCHITECTURE.md) | How the template wires middleware, root layout, IGRP layout, and the config builder; authenticated data flow |
| [Authentication](docs/AUTHENTICATION.md) | Centralized `withIGRPAuth` instance, `callbackUrl` sanitization, the OIDC flow, and the preview-mode / `AUTH_PROVIDER=none` bypass |
| [Permissions](docs/PERMISSIONS.md) | Token-claims gating for pages, components, and menus — `igrpAssertAuthorize`, `<IGRPAuthorization>`, `usePermissions` |
| [Access Management Sync](docs/ACCESS_MANAGEMENT.md) | OAuth2 `client_credentials` sync of application/resources/menus to the Access Management API |
| [Design System](docs/DESIGN_SYSTEM.md) | The `@igrp/igrp-framework-react-design-system` component layers and usage |
| [Design Tokens](docs/TOKENS.md) | CSS-variable tokens and how to theme the template |
| [Upgrading](docs/MIGRATION_GUIDE.md) | Applying framework migrations with `@igrp/template-migrator` |
| [Docker](docs/DOCKER-RUN.md) | Building and running the template in Docker |

### Styling (Tailwind v4) — quick notes

Tailwind compiles **once here in the app**, not in the framework packages. Import **tokens only** (`@import "@igrp/igrp-framework-react-design-system/tokens";`) — never the prebuilt `styles.css`. All UI comes from the design system (Horizon `IGRP*` first), forms are always `IGRPForm` + Zod, and dark mode is driven by `next-themes`. Full details in [Design System](docs/DESIGN_SYSTEM.md) and [Design Tokens](docs/TOKENS.md).

- **Do not run `npx shadcn add` here** — see `CLAUDE.md` § "Do not run `npx shadcn add` here". Use `IGRP*` from the design system instead.

### Permissions — quick note

Gate UI and routes by the user's access-token claims (zero network; the AM API is the real enforcement). Server pages: `await igrpAssertAuthorize("<perm>")` → 403 on deny. Client UI: wrap with `<IGRPAuthorization permission="…">` or read `usePermissions().can(…)`. In preview mode claims are super-admin (every gate passes). Full guide — including the per-page guard checklist (there is **no** default-deny) — in [Permissions](docs/PERMISSIONS.md).

### Upgrading — quick note

Framework changes are delivered via `@igrp/template-migrator`; the applied set is tracked in [`.igrp-migrations-lock.json`](.igrp-migrations-lock.json). See [Upgrading](docs/MIGRATION_GUIDE.md) for the full workflow.

### Docker — quick note

A `docker/development/Dockerfile` and `docker-compose.yml` are provided. See [Docker](docs/DOCKER-RUN.md).

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [IGRP Framework](https://github.com/NOSiCode-CV/IGRP-Framework)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [TanStack Query](https://tanstack.com/query/latest)

## License

MIT License — see [LICENSE](LICENSE).

---

### Built by the IGRP Core Team · NOSI E.P.E
