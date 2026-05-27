# IGRP Framework Next.js Template

The canonical reference template for building applications with the **IGRP Framework** on **Next.js 15**. It ships a complete, production-ready foundation: OIDC authentication, layout/session management, Access Management sync, typed error boundaries, and a modern UI built on the IGRP design system.

Package name: `@igrp/framework-next-template`.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Auth Server Registration](#auth-server-registration-required)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [How It's Built](#how-its-built)
- [Authentication](#authentication)
- [Preview Mode & Auth Bypass](#preview-mode--auth-bypass)
- [Access Management Sync](#access-management-sync)
- [Styling (Tailwind v4)](#styling-tailwind-v4)
- [Upgrading](#upgrading)
- [Docker Support](#docker-support)

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
IGRP_APP_CODE=demo-app
```

For a real auth flow, see [Environment Variables](#environment-variables) and [Auth Server Registration](#auth-server-registration-required).

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

## Environment Variables

All variables are documented inline in [`.env.example`](.env.example). Required values are validated when `IGRPRootLayout` renders — misconfiguration surfaces as a typed `IgrpConfigError` in `app/global-error.tsx`, not as an opaque runtime failure.

### Authentication

| Variable | Description | Default |
| --- | --- | --- |
| `AUTH_PROVIDER` | Active provider. `igrp-auth` (OIDC) or `none` (bypass auth) | `igrp-auth` |
| `IGRP_AUTH_CLIENT_ID` | OAuth client ID registered on the authorization server | — |
| `IGRP_AUTH_CLIENT_SECRET` | OAuth client secret | — |
| `IGRP_AUTH_ISSUER` | Authorization server base URL (no trailing slash); discovery at `/.well-known/openid-configuration` | — |
| `IGRP_AUTH_SCOPES` | Space-separated OAuth scopes. Must be registered on the client *and* advertised by the IdP | `openid` |

> The IGRP discovery doc advertises `openid` only. Requesting unregistered scopes (`profile`, `email`, …) is silently dropped or rejected by Spring Authorization Server — register them on the client first.

### NextAuth

| Variable | Description |
| --- | --- |
| `NEXTAUTH_URL` | Public URL of the **NextAuth API root**. Under a basePath this must include `<basePath>/api/auth` (see callout below) |
| `NEXTAUTH_URL_INTERNAL` | Server-to-server URL; same as `NEXTAUTH_URL` outside Docker/K8s |
| `NEXTAUTH_SECRET` | JWE secret for tokens/cookies. Generate with `openssl rand -base64 32`. **Hard-fails in production if unset** |
| `IGRP_SESSION_REFETCH_INTERVAL` | Client session poll interval (seconds). Set **below** the IdP access-token TTL so refresh lands in time. Defaults to `180` (suits a 5-min token) |

> **`NEXTAUTH_URL` includes `/api/auth`.** NextAuth v4 treats this value as the URL of its API root and derives `signin`/`callback` from it — it does **not** auto-append `/api/auth` when a basePath is present. With `NEXT_PUBLIC_BASE_PATH=/apps/template`, the correct value is `http://localhost:3000/apps/template/api/auth`. Getting this wrong produces a login loop with a deeply nested `?callbackUrl=…?callbackUrl=…` chain.

### IGRP Framework

| Variable | Description | Default |
| --- | --- | --- |
| `IGRP_APP_CODE` | Unique application identifier | — |
| `IGRP_ACCESS_MANAGEMENT_API` | Base URL of the IGRP Access Management API | — |
| `IGRP_PREVIEW_MODE` | Bypass auth + use mock data (case-insensitive, quote-tolerant) | `false` |
| `IGRP_SYNC_ACCESS` | Sync application/resources/menus to Access Management at startup | `false` |
| `IGRP_SYNC_ON_CODE_MENUS` | Push `src/temp/menus/menus.ts` to AM (overwrites AM menus). Requires sync on + preview off | `false` |

### Access Management M2M (required when `IGRP_SYNC_ACCESS=true`)

| Variable | Description |
| --- | --- |
| `IGRP_SERVICE_ID` | Stable service identity — resource name + `X-Machine-Service-ID` header. Lowercase alphanumeric + `-`/`_`, 2-64 chars. **Not a credential.** |
| `IGRP_M2M_CLIENT_ID` | OAuth2 `client_credentials` client ID, issued by your AM admin |
| `IGRP_M2M_CLIENT_SECRET` | Paired client secret. Server-only — never commit |

### Next.js public

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_PATH` | Subdirectory mount path (empty for root) | — |
| `NEXT_PUBLIC_IGRP_APP_HOME_SLUG` | Route to land on after login | `/` |
| `NEXT_IGRP_APP_CENTER_URL` | Application Center URL (app switcher) | — |
| `NEXT_PUBLIC_ALLOWED_DOMAINS` | Comma-separated image domains for `next/image` | — |
| `NEXT_PUBLIC_IGRP_PROFILE_URL` | External profile base URL | — |
| `NEXT_PUBLIC_IGRP_NOTIFICATION_URL` | External notification base URL | — |
| `NEXT_PUBLIC_IGRP_SETTINGS_URL` | External settings base URL | — |

## Auth Server Registration (REQUIRED)

Two URIs **must** be registered on the OAuth client (e.g. `igrp-access-management` in IGRP Access Management). Missing either causes a silent failure:

| URI | Why | Symptom if missing |
| --- | --- | --- |
| **OAuth callback** | Where the IdP returns the user after authentication | Login bounces back to `/login` with a growing nested `callbackUrl` chain |
| **Post-logout redirect** | Where the IdP returns the user after the SSO session is cleared | Logout clears local cookies but the IdP SSO session survives — re-login skips the credential prompt |

Exact values depend on `NEXT_PUBLIC_BASE_PATH`:

| Config | OAuth callback URI | Post-logout redirect URI |
| --- | --- | --- |
| root (`NEXT_PUBLIC_BASE_PATH=`) | `http://localhost:3000/api/auth/callback/igrp-auth` | `http://localhost:3000/login` |
| `/apps/template` | `http://localhost:3000/apps/template/api/auth/callback/igrp-auth` | `http://localhost:3000/apps/template/login` |

The OIDC spec requires a byte-for-byte match. The provider enables PKCE (RFC 7636, S256) and an OIDC `nonce`; `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and the proxy path must stay stable across the `/authorize` → `/callback` round-trip (the PKCE/state/nonce cookies are JWE-encrypted with `NEXTAUTH_SECRET` and scoped to the `NEXTAUTH_URL` path).

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
│   │   │   ├── layout.tsx                 # IGRPLayoutFull (header + sidebar)
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
│   └── igrp.template.config.ts            # createConfig() → igrpBuildConfig
├── public/
├── create-template/                      # Template publishing scripts
├── docker/development/                   # Dockerfile, compose, env
├── .igrp-migrations-lock.json            # Applied-migration tracker
└── package.json
```

## How It's Built

The template wires the framework together in four layers:

1. **Middleware** ([`src/middleware.ts`](src/middleware.ts)) — runs first. On auth bypass it redirects `/login`, `/logout`, `/api/auth/*` to `/` and lets everything else through. Otherwise it skips public/static paths, extracts the JWT via `auth.getTokenFromRequest()`, and redirects to `<basePath>/login` (with a sanitized `callbackUrl`) when the token is missing/expired/refresh-failed. Injects an `x-current-path` request header and applies security headers in production. The matcher comes from the framework (`export const { config } = auth`).

2. **Root layout** ([`src/app/layout.tsx`](src/app/layout.tsx)) — builds config via `createConfig(...)` and mounts `IGRPRootLayout` (providers, theme, session). Does **not** enforce auth, so the login page stays reachable.

3. **IGRP layout** ([`src/app/(igrp)/layout.tsx`](src/app/(igrp)/layout.tsx)) — calls `verifySession()` (from [`lib/dal.ts`](src/lib/dal.ts)) to gate the authenticated shell, then renders `IGRPLayoutFull` around `children`.

4. **Config builder** ([`src/igrp.template.config.ts`](src/igrp.template.config.ts)) — `createConfig()` wraps `igrpBuildConfig`, assembling header/sidebar data, fonts, API/M2M config, toaster, and session args. In preview mode it swaps in `src/temp/*` mock data.

### Data flow (authenticated)

1. Request → middleware validates JWT
2. Valid → passes through with `x-current-path`
3. `(igrp)/layout.tsx` → `verifySession()` confirms session (else redirect to `/login`)
4. `createConfig()` builds the IGRP config
5. `IGRPLayoutFull` renders header + sidebar around the page

## Authentication

Auth is centralized in [`src/lib/auth.ts`](src/lib/auth.ts) via a single `withIGRPAuth(...)` instance. The provider is resolved from `AUTH_PROVIDER`. That instance exposes everything the app needs:

- **Route handler** — `export const { GET, POST } = auth` in `api/auth/[...nextauth]/route.ts`
- **Middleware** — `export const { config } = auth`
- **`serverSession()`** — validates env, configures the IGRP access client, returns the session (or `null`)
- **`getSession()`** — returns `null` on bypass; otherwise redirects to `/logout` on expired/failed refresh

A custom `redirect` callback resolves post-login destinations against the **app origin** (`NEXTAUTH_URL` minus `/api/auth`), honoring same-origin `callbackUrl` values but never bouncing back to `/login` or `/logout`.

### `callbackUrl` is always sanitized

`sanitizeCallbackUrl()` ([`lib/utils.ts`](src/lib/utils.ts)) is applied in both middleware and the login page. It rejects scheme-relative (`//…`) and absolute URLs (open-redirect), collapses basePath-prefixed `/login`, and drops `/login*` / `/logout*` targets. Any new code consuming `callbackUrl` must go through it.

### Authentication flow (no bypass)

1. Request hits middleware → no/expired token → redirect to `<basePath>/login`
2. `/login` renders `IGRPAuthForm`; the button calls `signIn('igrp-auth', { callbackUrl })`
3. NextAuth returns the IGRP issuer's `/oauth2/authorize` URL → browser navigates there
4. IdP authenticates → 302 back to `<NEXTAUTH_URL>/callback/igrp-auth?code=…`
5. NextAuth exchanges the code → session cookie set → redirect to `callbackUrl`
6. Next request: middleware sees a valid token → passes through

## Preview Mode & Auth Bypass

Two env paths bypass authentication, both unified behind `isAuthBypass()`:

```env
IGRP_PREVIEW_MODE=true   # or
AUTH_PROVIDER=none
```

When bypass is on:

- Middleware lets every non-auth path through and redirects `/login`, `/logout`, `/api/auth/*` to `/`
- `serverSession()` / `getSession()` return `null`; `verifySession()` returns a stub session
- `createConfig()` swaps in mock data
- Client session refetch is disabled

**Mock data sources:**

- [`src/temp/users/use-mock-user.ts`](src/temp/users/use-mock-user.ts)
- [`src/temp/menus/use-mock-menus.ts`](src/temp/menus/use-mock-menus.ts)
- [`src/temp/applications/use-mock-apps.ts`](src/temp/applications/use-mock-apps.ts)

> Any change to middleware, root layout, or the config builder must work with bypass **on** and **off**.

## Access Management Sync

When `IGRP_SYNC_ACCESS=true` and preview mode is off, the framework authenticates to the Access Management API with OAuth2 `client_credentials`:

1. `POST {IGRP_ACCESS_MANAGEMENT_API}/oauth2/token` with `Basic base64(IGRP_M2M_CLIENT_ID:IGRP_M2M_CLIENT_SECRET)`
2. The bearer token is cached until expiry and shared across the three sync phases (application metadata, route resources, on-code menus)

Sync runs post-response via `after()`, so it never blocks the first request. The four M2M variables are validated at render time — misconfiguration surfaces as `IgrpConfigError` (`IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING`) in `global-error.tsx`. Enabling `IGRP_SYNC_ON_CODE_MENUS` pushes `src/temp/menus/menus.ts` and **overwrites** the AM-side menus.

## Styling (Tailwind v4)

Tailwind compiles **once here in the app**, not in the framework packages. `src/styles/globals.css` uses `@source` to scan both the template `src/**` and the compiled `dist/` of each consumed `@igrp/*` package, so utilities used inside those packages are generated.

- Import **tokens only**: `@import "@igrp/igrp-framework-react-design-system/tokens";` — never the prebuilt `styles.css` (causes cascade conflicts / missing utilities)
- Theme variants live in `src/styles/themes.css`, imported **after** tokens
- Dark mode is the `.dark` class driven by `next-themes` — no manual `dark:` overrides
- All UI comes from the design system: Horizon (`IGRP*`) first, Primitives only when needed. Forms are always `IGRPForm` + Zod. Use semantic tokens (`bg-background`, `text-foreground`, …), `cn()`, `size-*`, and `flex gap-*`

## Upgrading

When a new framework version requires template changes, they're delivered via `@igrp/template-migrator`. The applied set is tracked in [`.igrp-migrations-lock.json`](.igrp-migrations-lock.json).

```bash
# See applied vs. pending
pnpm dlx @igrp/template-migrator@latest status

# Preview file operations (no writes)
pnpm dlx @igrp/template-migrator@latest plan

# Apply pending migrations (prompts before each; resumable)
pnpm dlx @igrp/template-migrator@latest apply
pnpm dlx @igrp/template-migrator@latest apply --yes   # CI / scripted

# CI gate — fails if migrations are pending
pnpm dlx @igrp/template-migrator@latest check
```

Migration history (all applied in this template):

| # | What changed | Target framework |
| --- | --- | --- |
| `01-preview-mode-not-found` | Preview-mode bypass, custom 404 | — |
| `02-access-sync-config-refactor` | Access Management sync, config helpers | beta.84 |
| `03-tailwind-v4-tokens` | Tailwind v4 `@source` / token-only imports | — |
| `04-multi-auth-provider` | Provider resolution (`AUTH_PROVIDER`), central `auth.ts` | beta.113 |
| `05-edge-safe-auth-bypass` | Edge-safe auth refactor, `isAuthBypass()` unification | beta.114 |
| `06-error-handling-overhaul` | Typed error hierarchy, full App Router error boundaries | beta.115 |

## Docker Support

```bash
docker build -f docker/development/Dockerfile -t my-igrp-template:latest .
docker run -d --name my-igrp-template -p 3000:3000 \
  --restart unless-stopped \
  --env-file docker/development/.env.development \
  my-igrp-template:latest
```

A `docker/development/docker-compose.yml` is also provided.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [IGRP Framework](https://github.com/NOSiCode-CV/IGRP-Framework)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [TanStack Query](https://tanstack.com/query/latest)

## License

MIT License — see [LICENSE](LICENSE).

---

### Built by the IGRP Core Team · NOSI E.P.E
