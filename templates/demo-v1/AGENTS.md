# Agent instructions — IGRP Next.js template

This project is built on the IGRP framework (`@igrp/framework-next`, `@igrp/framework-next-ui`, `@igrp/framework-next-auth`, `@igrp/igrp-framework-react-design-system`). When working on UI in `src/**/*.{ts,tsx}`, follow the IGRP design system skill.

## IGRP design system — required reading before UI work

The canonical skill that documents which `IGRP*` component to pick and the exact prop shapes the design system exports lives at:

@.agents/skills/igrp-design-system/SKILL.md

Read it before writing any form, table, chart, modal, or component import from `@igrp/igrp-framework-react-design-system`. Deep references for the heavy families are alongside it under `.agents/skills/igrp-design-system/references/` — load only the one relevant to your task:

- `references/forms.md` — `IGRPForm` + Zod + all `IGRPInput*` (load when any form is in scope)
- `references/data-table.md` — `IGRPDataTable`, `createIGRPColumnHelper`, row actions, cell renderers
- `references/charts.md` — `IGRPAreaChart` / `IGRPVerticalBarChart` / `IGRPLineChart` / etc.
- `references/horizon.md`, `references/primitives.md`, `references/utilities.md`, `references/custom.md`

## Hard rules (non-negotiable)

These come from the IGRP repo's shared UI rules. The skill repeats them in detail with examples; high-level summary:

- All UI from `@igrp/igrp-framework-react-design-system`. Never raw shadcn, MUI, Mantine, etc.
- `'use client'` on every file that imports from the design system.
- Forms are **always** `IGRPForm` + Zod. Never raw `<form>` or direct `react-hook-form`.
- Only semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, `bg-destructive`, …). Never raw Tailwind palette colors (`bg-blue-500`).
- No manual `dark:` overrides in app code. Tokens handle dark mode.
- `cn()` from the DS for class merging, `size-*` when w = h, `flex gap-*` for spacing.
- Import tokens only: `@import "@igrp/igrp-framework-react-design-system/tokens";` — never the legacy `/styles` bundle.

## Project shape

- `src/app/` — Next.js App Router routes.
- `src/app/(igrp)/layout.tsx` — runs auth checks, loads session, wraps the route group in `IGRPLayout`.
- `src/middleware.ts` — NextAuth session validation, honors `IGRP_PREVIEW_MODE` / `AUTH_PROVIDER=none`.
- `src/igrp.template.config.ts` — assembles the IGRP runtime config via `igrpBuildConfig`.
- `src/actions/igrp/` — server actions; `src/app/api/auth/*` holds NextAuth routes.

For Claude-Code-specific guidance see `CLAUDE.md`.
