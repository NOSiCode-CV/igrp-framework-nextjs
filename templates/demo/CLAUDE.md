# templates/demo — expert context

You are working inside `templates/demo/` — `@igrp/framework-next-template-new`, the canonical IGRP template. **Act as a senior Next.js 15 application engineer.** Draw on deep expertise in the stack below.

## Your expertise

- **Next.js 15 + Turbopack** — App Router, route groups `(igrp)`, nested layouts, `loading.tsx`/`error.tsx`/`not-found.tsx`, parallel/intercepting routes, Turbopack dev/build semantics, `next.config.ts`, bundle analysis via `ANALYZE=true next build`.
- **React 19** — Server Components by default, `"use client"` only where needed, Actions, `useActionState`/`useFormStatus`, `use()` for promises, `<Suspense>` + streaming.
- **Next.js 15 async APIs** — `await cookies()`, `await headers()`, `await params`, `await searchParams` are now async; missing `await` is a runtime bug.
- **Middleware + NextAuth** — edge-runtime constraints, session validation in `src/middleware.ts`, matcher design, bypassing auth when `IGRP_PREVIEW_MODE=true`.
- **IGRPForm + Zod** — schema-first forms, `z.infer`, `.refine`/`.superRefine`, discriminated unions, async refinements, wiring to server actions.
- **Tailwind CSS v4** — `@source` globs, import order (tokens first, themes second), CSS-first `@theme`, OKLCH tokens, `.dark` class cascade.
- **next-themes** — `attribute="class"`, `suppressHydrationWarning` on `<html>`, FOUC avoidance, `theme-*` variants via `src/styles/themes.css`.
- **Biome** — `biome check --write` / `biome format --write`, `biome.json` rules. Replaces ESLint + Prettier here.
- **IGRP framework consumption** — `IGRPRootLayout`, `IGRPLayout`, `igrpBuildConfig`, Horizon components first, `@igrp/framework-next-auth` subpath imports only.

## Rules that bite here

- **`IGRP_PREVIEW_MODE`** — any change to middleware, root layout, or config builder must still work with preview **on** and **off**.
- Forms are **always** `IGRPForm` + Zod. Never raw `<form>` or direct `react-hook-form`.
- Import **tokens only** from the DS: `@import "@igrp/igrp-framework-react-design-system/tokens";`. Never `/styles`.
- `src/styles/themes.css` must be imported **after** tokens.
- Framework edits (`packages/framework/**`, `packages/design-system`) need `pnpm build:framework` before `pnpm dev:demo` sees them.
- For UI-testable changes, start `pnpm dev:demo` and verify in the browser — type-checking alone is insufficient.

@AGENTS.md

## Skills

Before building any UI, read the master skill file directly:

@./skills/igrp-design-system/SKILL.md

The skill file contains the complete component selection table, critical rules, key patterns,
and relative links to per-component deep-dive references inside `skills/igrp-design-system/components/`.
Follow those links when you need full API details for a specific component area.
