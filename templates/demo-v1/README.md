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

- **Next.js 15** + **React 19** — App Router + Turbopack (dev *and* build)
- **IGRP Framework** — `@igrp/framework-next`, `-next-ui`, `-next-auth`, `-next-types`
- **IGRP Design System** — `@igrp/igrp-framework-react-design-system` (Horizon components first)
- **NextAuth v4** — OIDC via the `igrp-auth` provider (PKCE + nonce), with an `AUTH_PROVIDER=none` bypass
- **TypeScript**, **Tailwind CSS v4**, **React Query**, **React Hook Form + Zod**
- **next-intl** i18n (pt / en / fr) via `@igrp/framework-next/i18n`, checked by `pnpm lint:i18n`
- **Biome** for formatting and linting
- **[Lucide](https://lucide.dev/icons/)** icons

The framework dependencies are linked from the monorepo via `workspace:*`. In a published standalone template they resolve to the internal Sonatype registry.

## Prerequisites

- **Node.js** >= 22
- **pnpm** (this repo is pnpm-only)
- **Git**

## Getting Started

### 1. Install dependencies

Inside this monorepo, run these from the **repo root** (see the root README for registry credentials):

```bash
pnpm install:deps      # install with registry credentials from the root .env
pnpm build:framework   # build the workspace:* framework packages — required before pnpm dev
```

In a standalone copy of the template, `pnpm install` is enough.

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the values. The fastest path for local development is **preview mode** — no auth server required:

```env
IGRP_PREVIEW_MODE=true
IGRP_APP_CODE=DEMO_APP
```

To sign in against IGRP Access Management, this is the minimum:

```env
AUTH_PROVIDER=igrp-auth
IGRP_PREVIEW_MODE=false

IGRP_AUTH_CLIENT_ID=igrp-access-management
IGRP_AUTH_CLIENT_SECRET=<secret>
IGRP_AUTH_ISSUER=http://auth.example.com
IGRP_AUTH_SCOPES=openid

NEXTAUTH_URL=http://localhost:3000/apps/template/api/auth   # <basePath>/api/auth
NEXTAUTH_SECRET=<openssl rand -base64 32>

IGRP_ACCESS_MANAGEMENT_API=http://am.example.com
IGRP_APP_CODE=DEMO_APP
NEXT_PUBLIC_IGRP_APP_CODE=DEMO_APP

NEXT_PUBLIC_BASE_PATH=/apps/template
```

The app code must already exist in AM, and both redirect URIs must be registered on the OAuth client. Startup sync (`IGRP_SYNC_ACCESS=true` + M2M credentials) and the multi-replica session store are optional; see [Minimum for Access Management](docs/ENVIRONMENT.md#minimum-for-access-management), [Environment Variables](docs/ENVIRONMENT.md) and [Auth Server Registration](docs/ENVIRONMENT.md#auth-server-registration-required).

### 3. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). If `NEXT_PUBLIC_BASE_PATH` is set (e.g. `/apps/template`), browse to that path — and `NEXTAUTH_URL` must then include the basePath **and** `/api/auth` (e.g. `http://localhost:3000/apps/template/api/auth`); see [Environment Variables](docs/ENVIRONMENT.md#nextauth).

### 4. Build for production

```bash
pnpm build
pnpm start
```

## Available Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `pnpm dev` | `node scripts/dev.mjs` | Development server (wraps `next dev --turbopack`, prints the basePath URL) |
| `pnpm build` | `pnpm lint && pnpm lint:i18n && next build --turbopack` | Production build (Biome check + i18n checks first) |
| `pnpm start` | `next start` | Serve the production build |
| `pnpm lint` | `biome check --write` | Lint and auto-fix |
| `pnpm lint:i18n` | `igrp-i18n check-catalogs …` + `check-literals …` | Check message catalogs and flag hard-coded UI text (runs in `build`) |
| `pnpm format` | `biome format --write` | Format |
| `pnpm publish:template` | PowerShell zip script | Package the publishable template |

> This template uses **Biome** for lint/format — not ESLint/Prettier. Don't add ESLint/Prettier configs here.

## Project Structure

```
templates/demo-v1/
├── src/
│   ├── app/
│   │   ├── (auth)/                       # Login / logout route group
│   │   │   ├── login/page.tsx            # IGRPAuthForm + carousel launcher
│   │   │   ├── login/silent-sign-in.tsx, logout-completion.tsx
│   │   │   ├── logout/page.tsx
│   │   │   └── error.tsx
│   │   ├── (igrp)/                        # Authenticated shell (verifySession gate)
│   │   │   ├── layout.tsx                 # IGRPLayoutFull (header; sidebar optional)
│   │   │   ├── page.tsx                   # Home
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   ├── forbidden.tsx              # 403 boundary for igrpAssertAuthorize
│   │   │   ├── (demo)/                    # Demo pages (e.g. system/settings/page.tsx)
│   │   │   └── (generated)/               # Code-generated route group
│   │   ├── (myapp)/                       # Feature code only (_features, _lib, _components) — no page.tsx here
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts # NextAuth handler (from lib/auth.ts)
│   │   │   └── health/route.ts            # Health check
│   │   ├── layout.tsx                     # Root layout → IGRPRootLayout
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   └── global-error.tsx               # Renders typed IgrpError
│   ├── actions/igrp/
│   │   ├── layout.ts                      # configLayout()
│   │   └── auth.ts
│   ├── components/                        # app-search.tsx, home-overview.tsx
│   ├── config/                            # site, login
│   ├── i18n/                              # next-intl setup, server actions, messages/ catalogs
│   ├── lib/
│   │   ├── auth-instance.ts               # withIGRPAuth instance
│   │   ├── auth.ts                        # re-exports auth; serverSession, getSession
│   │   ├── dal.ts                         # verifySession() data-access gate
│   │   ├── utilities.ts                   # isPreviewMode, isAuthDisabled, isAuthBypass, sanitizeCallbackUrl
│   │   ├── errors.ts, report-error.ts
│   │   ├── fonts.ts
│   │   ├── header-search.ts               # Command-palette data (server)
│   │   ├── session-store.ts, silent-sso.ts, logout-pending.ts, error-copy.ts
│   │   └── config/                        # get-base-path, get-permissions, get-pkj, get-routes, get-session-args
│   ├── providers/                         # React Query: query-provider.tsx, query-client(.server).ts
│   ├── temp/                              # Mock users / menus / applications (preview mode)
│   ├── styles/                            # globals.css
│   ├── middleware.ts                      # Auth gate + security headers
│   ├── instrumentation.ts
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
| [Header Slots](docs/HEADER_SLOTS.md) | Injecting your own components into the header — replacing search, notifications or settings, and adding new actions via `headerSlots` |
| [Authentication](docs/AUTHENTICATION.md) | Centralized `withIGRPAuth` instance, `callbackUrl` sanitization, the OIDC flow, and the preview-mode / `AUTH_PROVIDER=none` bypass |
| [Permissions](docs/PERMISSIONS.md) | Token-claims gating for pages, components, and menus — `igrpAssertAuthorize`, `<IGRPAuthorization>`, `usePermissions` |
| [Access Management Sync](docs/ACCESS_MANAGEMENT.md) | OAuth2 `client_credentials` sync of application/resources/menus to the Access Management API |
| [Internationalisation](docs/I18N.md) | next-intl setup, message catalogs, format locales / time zone, `pnpm lint:i18n` |
| [Design System](docs/DESIGN_SYSTEM.md) | The `@igrp/igrp-framework-react-design-system` component layers and usage |
| [Design Tokens](docs/TOKENS.md) | CSS-variable tokens and how to theme the template |
| [Upgrading](docs/MIGRATION_GUIDE.md) | Applying framework migrations with `@igrp/template-migrator` |
| [Docker](docs/DOCKER-RUN.md) | Building and running the template in Docker |

### Styling (Tailwind v4) — quick notes

Tailwind compiles **once here in the app**, not in the framework packages. Import **tokens only** (`@import "@igrp/igrp-framework-react-design-system/tokens";`) — never the prebuilt `styles.css`. All UI comes from the design system (Horizon `IGRP*` first), forms are always `IGRPForm` + Zod, and dark mode is driven by `next-themes`. Full details in [Design System](docs/DESIGN_SYSTEM.md) and [Design Tokens](docs/TOKENS.md).

- **Do not run `npx shadcn add` here** — see `CLAUDE.md` § "Do not run `npx shadcn add` here". Use `IGRP*` from the design system instead.

### Header slots — quick note

Render your own components in the header by passing `headerSlots` to `IGRPLayoutFull`: `start` (left, after the logo), and `search`, `settings`, `notifications` and `actions` in the right cluster. The framework still fetches and owns all header data (user, logo, breadcrumbs) — a slot only replaces what renders in its position. Slots must be **elements**, not component references, since they cross the Server→Client boundary. This template's command palette is the worked example: [`src/lib/header-search.ts`](src/lib/header-search.ts) (server data) + [`src/components/app-search.tsx`](src/components/app-search.tsx) (client handlers), wired in [`src/app/(igrp)/layout.tsx`](src/app/(igrp)/layout.tsx). Full guide in [Header Slots](docs/HEADER_SLOTS.md).

### Permissions — quick note

Gate UI and routes by the user's access-token claims (zero network; the AM API is the real enforcement). Server pages: `await igrpAssertAuthorize("<perm>")` → 403 on deny. Client UI: wrap with `<IGRPAuthorization permission="…">` or read `usePermissions().isAllowed(…)`. In preview mode claims are super-admin (every gate passes). Full guide — including the per-page guard checklist (there is **no** default-deny) — in [Permissions](docs/PERMISSIONS.md).

### Upgrading — quick note

Framework changes are delivered via `@igrp/template-migrator`; the applied set is tracked in [`.igrp-migrations-lock.json`](.igrp-migrations-lock.json). See [Upgrading](docs/MIGRATION_GUIDE.md) for the full workflow.

### Docker — quick note

`docker/development/` builds a **production** standalone image (not `next dev`). From the template root: `docker compose -f docker/development/docker-compose.yml up --build` — app on [http://localhost:3001](http://localhost:3001). There is no root `Dockerfile`; pass `-f docker/development/Dockerfile` if you build with the Docker CLI. Env, ports, and auth URLs: [Docker](docs/DOCKER-RUN.md).

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [IGRP Framework](https://github.com/NOSiCode-CV/IGRP-Framework)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [TanStack Query](https://tanstack.com/query/latest)

## License

MIT License — see [LICENSE](LICENSE).

---

### Built by the IGRP Core Team · NOSI E.P.E
