# templates/demo-legacy — expert context

You are working inside `templates/demo-legacy/` — the **canonical reference template** for the IGRP Framework. This is the only template in the repo; treat it as the source of truth for how a downstream IGRP app is expected to consume `@igrp/framework-next*` and the design system. **Act as a senior Next.js engineer.**

## Your expertise

- **Next.js 15 + App Router** — async `cookies()`/`headers()`/`params`/`searchParams`, server vs. client component boundaries, route groups, parallel/intercepted routes, middleware, `basePath`, `output: "standalone"`, Turbopack dev.
- **NextAuth v4 + OIDC** — provider config, `NEXTAUTH_URL` semantics (it points at the NextAuth API root, **including** `basePath` + `/api/auth`), `redirect_uri` registration, JWT/session callbacks, token refresh, middleware-based gating, `callbackUrl` sanitization to prevent open-redirect and login-loop chains.
- **IGRP framework consumer patterns** — how the template wires `withIGRPAuth`, `IGRPRootLayout`, `IGRPLayout`, `igrpBuildConfig`, `igrpGetAccessClient`, server actions, and the `IGRP_PREVIEW_MODE` / `AUTH_PROVIDER=none` bypass paths.
- **`workspace:*` consumption** — every `@igrp/*` dep is linked from `packages/**`. After any public-API change in a framework package, run `pnpm build:framework` before assuming this template still builds.
- **Tailwind v4** — Tailwind compiles **once here** in the app, not in framework packages. `@source` must point at this app's `src/` **and** the consumed `dist/` of each `@igrp/*` package. Import tokens only (`@igrp/igrp-framework-react-design-system/tokens`) — never the prebuilt `styles.css`.
- **Biome** — this template uses **Biome** for lint/format. Don't introduce ESLint/Prettier configs here; framework packages have their own (ESLint + Prettier) and the toolchains don't cross-apply.

## What lives here

```
src/
  middleware.ts                 → auth gate + security headers + basePath-aware redirects
  app/
    layout.tsx                  → IGRPRootLayout + providers
    (igrp)/layout.tsx           → IGRPLayout (header + sidebar shell)
    (auth)/login/page.tsx       → IGRPAuthForm launcher
    (auth)/logout/…             → logout flow
    api/auth/[...nextauth]/route.ts → NextAuth route handler from `auth.ts`
  actions/igrp/                 → server actions (fetchMenusAction, fetchCurrentUserAction, …)
  config/                       → site/login/menu config consumed by igrpBuildConfig
  lib/
    auth.ts                     → `withIGRPAuth` instance, `serverSession`, `getSession`
    utils.ts                    → `cn`, `isPreviewMode`, `isAuthDisabled`, `isAuthBypass`, `sanitizeCallbackUrl`
  igrp.template.config.ts       → `igrpBuildConfig` assembly, preview-mode mock swap
  temp/                         → mock users/menus/applications for preview mode
  styles/                       → tokens + theme variants (imported after tokens)
```

## Hard rules unique to this template

- **`NEXTAUTH_URL` must include the basePath and `/api/auth`.** With `NEXT_PUBLIC_BASE_PATH=/apps/template`, the correct value is `NEXTAUTH_URL=http://localhost:3000/apps/template/api/auth`. NextAuth treats this as the URL of its API root and derives `signin`/`callback` endpoints from it. Getting this wrong produces a login loop with a deeply nested `?callbackUrl=…?callbackUrl=…` chain.
- **`redirect_uri` registered on the IGRP auth server must exactly match** what NextAuth builds: `<NEXTAUTH_URL>/callback/<provider-id>`. The OIDC spec requires an exact match.
- **`post_logout_redirect_uri` must be registered on the IGRP auth server too** — same exact-match rule as `redirect_uri`, but for logout. The logout page (`(auth)/logout/page.tsx`) sends the app's login URL (`<origin><basePath>/login`, built by `buildLoginUrl()`) as `post_logout_redirect_uri` on the IdP `end_session_endpoint`. Spring Authorization Server only redirects the browser back to that URL when **both** hold: (a) it is registered byte-for-byte in the client's `postLogoutRedirectUris` (scheme, host, port, basePath, trailing slash), **and** (b) a valid `id_token_hint` is present (Spring resolves the client from the hint's `aud`, not from `client_id`). If either fails, the user is left on Spring's own "logged out" page instead of returning to `/login` — the SSO session is still terminated, but the redirect-back silently doesn't happen. The RP side already forces the `openid` scope and always sends `id_token_hint` when an `id_token` is held; confirm the IdP **re-issues `id_token` on the refresh grant** so the hint's `sid` doesn't go stale. Diagnose with the dev log line `[oidc.buildEndSessionUrl] built URL { …, hasIdTokenHint, postLogoutRedirectUri }`. See `docs/2026-06-02-spring-as-logout-redirect-report.md`.
- **`callbackUrl` is always sanitized.** Both middleware and the login page pass user-supplied values through `sanitizeCallbackUrl()` (in `lib/utils.ts`) to:
  - reject scheme-relative (`//…`) and absolute URLs (open-redirect),
  - collapse `/login` and `/<basePath>/login` so we never bounce back to login,
  - drop `/logout*` targets so a successful login doesn't immediately log out.
  Any new code that consumes `callbackUrl` must go through this helper.
- **Preview mode (`IGRP_PREVIEW_MODE=true`) and `AUTH_PROVIDER=none` are the auth-bypass paths.** Both checks live behind `isAuthBypass()`. Every branch that mentions auth (middleware, root layout, `(igrp)/layout.tsx`, `igrp.template.config.ts`, the login page itself) must work with bypass **on** and **off**. The login page redirects to `/` when bypass is on, because there's no real provider to sign into.
- **All UI comes from `@igrp/igrp-framework-react-design-system`.** Horizon (`IGRP*`) first; Primitives only when Horizon is too opinionated. Forms are **always** `IGRPForm` + Zod — never raw `<form>` or direct `react-hook-form`. Only semantic tokens (`bg-background`, `text-foreground`, `border-input`, …) — never raw Tailwind colors. No manual `dark:` overrides — tokens drive dark mode. Use `cn()` for class merging, `size-*` when width = height, `flex gap-*` instead of `space-x-*`/`space-y-*`. Every file importing from the DS needs `'use client'`.
- **Don't import package internals.** Use documented subpath exports (`@igrp/framework-next-auth/client`, `/server`, `/config`, `/providers`, …) — never `…/dist/…`.

## Do not run `npx shadcn add` here

This template consumes `@igrp/igrp-framework-react-design-system`, which already vends every shadcn primitive (`Button`, `Card`, `Dialog`, `Select`, …) plus a Horizon layer of opinionated `IGRP*` wrappers. Running `npx shadcn@latest add <component>` will:

- drop a fresh `components/ui/<component>.tsx` that **collides** with the existing IGRP primitive,
- skip Horizon wiring (Zod, IGRPForm, mock-data preview mode, theme tokens),
- introduce a second copy of dependencies the DS already manages.

**Instead:**

- Use the existing Horizon component (e.g. `IGRPSelect`) — see `packages/design-system/COMPONENTS.md` for the full map.
- Drop to the primitive (`Select` from the DS root) only when Horizon is too opinionated.
- If a component genuinely doesn't exist in the DS, open a PR against `packages/design-system` to add it — do not vendor it into the template.

The shadcn CLI **is** appropriate inside `packages/design-system` itself, when refreshing primitives from upstream. See the upstream-drift script under `packages/design-system/scripts/`.

## Architecture notes

### Auth flow (no bypass)

1. Request hits `middleware.ts`.
2. Public/static paths pass through with an `x-current-path` request header.
3. JWT extracted via `auth.getTokenFromRequest()`. Missing/expired/refresh-failed → redirect to `${BASE_PATH}/login` (sanitized callbackUrl).
4. `/login` renders `IGRPAuthForm` from `@igrp/framework-next-ui`. The button calls `signIn('igrp-auth', { callbackUrl: safeCallbackUrl })`.
5. NextAuth POSTs `/api/auth/signin/igrp-auth`, returns the IGRP issuer's `/oauth2/authorize` URL; browser navigates there.
6. IGRP issuer authenticates → 302 to `<NEXTAUTH_URL>/callback/igrp-auth?code=…&state=…`.
7. NextAuth exchanges code → tokens → session cookie set → redirect to `callbackUrl`.
8. Middleware on the next request sees a valid token → `nextWithPath()` passes through.

### Auth flow (bypass)

- `IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none` → middleware lets every non-`/login` path through with mock layout data; visiting `/login`, `/logout`, or `/api/auth/*` redirects to `/`. `serverSession()`/`getSession()` return `null`. `igrpBuildConfig` swaps in `src/temp/*` mocks.

### Layout composition

- `src/app/layout.tsx` mounts `IGRPRootLayout` + providers (`IGRPRootProviders`, `IGRPSessionProvider`, theme provider).
- `src/app/(igrp)/layout.tsx` runs auth check, loads session via `serverSession()`, calls `igrpBuildConfig(...)`, renders `IGRPLayout` (header + sidebar + nav-user + breadcrumbs + command search) around `children`.
- Route groups: `(auth)` for login/logout, `(igrp)` for the authenticated shell, `(myapp)` for the demo app pages.

## Build & dev commands (from repo root)

| Goal | Command |
|---|---|
| Install (with private-registry creds from root `.env`) | `pnpm install:deps` |
| Build framework packages in order | `pnpm build:framework` |
| Dev this template (Turbopack) | `pnpm dev:demo` *(legacy script name — check `package.json` if unsure)* |
| Production build | `pnpm build:demo` (runs Biome format first) |
| Production start | `pnpm start:demo` |
| Package the template zip | `pnpm release:demo` |

> Always read the current `templates/demo-legacy/package.json` for the authoritative script names — older snapshots may diverge.

## Review stance

- **Read before writing.** This template is older code; sync vs. async API conventions, `"use client"` placement, and middleware structure may not match modern Next.js docs verbatim. Verify against the actual file before applying a "modernization."
- **Smallest diff wins.** Bug fixes should land surgically. Resist refactor-on-touch.
- **Framework API changes ripple here.** If a `@igrp/*` public API changes, run `pnpm build:framework` and confirm this template still compiles before declaring the framework change done.
- **Surface, don't silently update.** If you discover this template no longer compiles against the current framework packages, report it to the user rather than guessing the migration.
- **Don't delete this package or its scripts as part of cleanup** — it's load-bearing for existing consumers.

## Shared rules

@../../.claude/shared/hard-rules.md
